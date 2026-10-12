const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = parseInt(process.env.WS_PORT || "3001", 10);

// Map of creatorId -> Set<WebSocket>
const rooms = new Map();

// Map of creatorId -> { state: "PLAYING" | "PAUSED", anchorPositionSec: number, anchorEpochMs: number, videoId: string }
const latestPlayback = new Map();

function getCalculatedPosition(anchor) {
  if (!anchor) return 0;
  if (anchor.state === "PAUSED") return anchor.anchorPositionSec;
  const elapsed = Math.max(0, (Date.now() - anchor.anchorEpochMs) / 1000);
  return anchor.anchorPositionSec + elapsed;
}

// HTTP server for health check + REST broadcast trigger from Next.js API routes
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    let totalConnections = 0;
    for (const clients of rooms.values()) {
      totalConnections += clients.size;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        roomsCount: rooms.size,
        totalConnections,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Broadcast endpoint from Next.js server actions
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const { creatorId, event } = JSON.parse(body);
        if (!creatorId || !event) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing creatorId or event" }));
          return;
        }

        if (event.type === "STAGE_STOPPED") {
          latestPlayback.delete(creatorId);
        } else if (event.type === "NOW_PLAYING" && event.currentStream) {
          latestPlayback.set(creatorId, {
            state: "PLAYING",
            anchorPositionSec: 0,
            anchorEpochMs: Date.now(),
            videoId: event.currentStream.extractedId,
            title: event.currentStream.title,
            thumbnail: event.currentStream.thumbnail || null,
          });
        }

        const clients = rooms.get(creatorId);
        let deliveredCount = 0;

        if (clients && clients.size > 0) {
          const payload = JSON.stringify(event);
          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
              deliveredCount++;
            }
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, deliveredCount }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to process broadcast", message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  let currentRoom = null;
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      // Client joins a room (creatorId)
      if (data.type === "JOIN_ROOM" && data.creatorId) {
        // Leave previous room if any
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom).delete(ws);
        }

        currentRoom = data.creatorId;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }
        rooms.get(currentRoom).add(ws);

        ws.send(
          JSON.stringify({
            type: "ROOM_JOINED",
            creatorId: currentRoom,
            activeViewers: rooms.get(currentRoom).size,
          })
        );

        // Send latest known playback sync to the newly joined client
        const currentPlayback = latestPlayback.get(currentRoom);
        if (currentPlayback) {
          const currentSec = getCalculatedPosition(currentPlayback);
          ws.send(
            JSON.stringify({
              type: "PLAYBACK_SYNC",
              state: currentPlayback.state,
              videoId: currentPlayback.videoId,
              title: currentPlayback.title,
              thumbnail: currentPlayback.thumbnail,
              anchorPositionSec: currentPlayback.anchorPositionSec,
              anchorEpochMs: currentPlayback.anchorEpochMs,
              serverTime: Date.now(),
              currentTime: currentSec,
            })
          );
        }

        // Broadcast viewer count update to room
        broadcastToRoom(currentRoom, {
          type: "VIEWER_COUNT",
          count: rooms.get(currentRoom).size,
        });
      }

      // Broadcaster state change (PLAYING / PAUSED / SEEK)
      if (data.type === "BROADCASTER_SYNC" && data.creatorId) {
        const prev = latestPlayback.get(data.creatorId) || {};
        const anchor = {
          state: data.state === "PAUSED" ? "PAUSED" : "PLAYING",
          anchorPositionSec: typeof data.currentTime === "number" ? Math.max(0, data.currentTime) : 0,
          anchorEpochMs: Date.now(),
          videoId: data.videoId || prev.videoId,
          title: data.title || prev.title,
          thumbnail: data.thumbnail || prev.thumbnail,
        };
        latestPlayback.set(data.creatorId, anchor);

        // Broadcast immutable server clock anchor to all room audience members
        broadcastToRoom(
          data.creatorId,
          {
            type: "PLAYBACK_SYNC",
            state: anchor.state,
            videoId: anchor.videoId,
            title: anchor.title,
            thumbnail: anchor.thumbnail,
            anchorPositionSec: anchor.anchorPositionSec,
            anchorEpochMs: anchor.anchorEpochMs,
            serverTime: Date.now(),
            currentTime: anchor.anchorPositionSec,
          },
          ws // Exclude sender so creator does not loop back to itself
        );
      }

      // Broadcaster stopped / cleared stage
      if (data.type === "STAGE_STOPPED" && data.creatorId) {
        latestPlayback.delete(data.creatorId);
        broadcastToRoom(data.creatorId, { type: "STAGE_STOPPED" }, ws);
      }

      // Client leaves a room
      if (data.type === "LEAVE_ROOM" && currentRoom) {
        if (rooms.has(currentRoom)) {
          rooms.get(currentRoom).delete(ws);
          broadcastToRoom(currentRoom, {
            type: "VIEWER_COUNT",
            count: rooms.get(currentRoom).size,
          });
        }
        currentRoom = null;
      }
    } catch (e) {
      console.error("[WS] Error parsing message:", e);
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      } else {
        broadcastToRoom(currentRoom, {
          type: "VIEWER_COUNT",
          count: rooms.get(currentRoom).size,
        });
      }
    }
  });

  ws.on("error", (err) => {
    console.error("[WS] Socket error:", err);
  });
});

function broadcastToRoom(creatorId, event, excludeWs = null) {
  const clients = rooms.get(creatorId);
  if (!clients) return;
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Keep-alive heartbeat every 30 seconds
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

server.listen(PORT, () => {
  console.log(`[Muzzi WS Server] Running on http/ws://localhost:${PORT}`);
});
