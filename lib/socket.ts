/**
 * Utility to notify the real-time WebSocket server about queue/playback state changes.
 */

const WS_PORT = process.env.WS_PORT || "3001";
const WS_HTTP_URL = process.env.WS_INTERNAL_URL || `http://127.0.0.1:${WS_PORT}`;

export async function broadcastWs(
  creatorId: string,
  event: {
    type: string;
    [key: string]: unknown;
  }
): Promise<void> {
  if (!creatorId) return;

  // If no WS server is actively configured, gracefully no-op to eliminate serverless delay
  if (!process.env.WS_INTERNAL_URL && !process.env.WS_SERVER_ACTIVE) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${WS_HTTP_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorId,
        event,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[WS Broadcast] Broadcast returned status ${res.status}`);
    }
  } catch (err) {
    // Non-blocking catch: WS failure should not crash core REST endpoints
    // Logging in development only
    if (process.env.NODE_ENV !== "production") {
      console.debug("[WS Broadcast] WS server unreachable or not running:", (err as Error)?.message);
    }
  }
}
