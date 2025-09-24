"use client";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import StreamView from '../components/StreamView';

function App() {
  const { data: session, status } = useSession();
  const [creatorId, setCreatorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCreatorId() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch(`/api/me/?email=${session.user.email}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const responseData = await response.json();
          setCreatorId(responseData.creatorId);
        } catch (err : any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    }

    fetchCreatorId();
  }, [session, status]);

  // Handle loading state
  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return <div>Please sign in to view your stream.</div>;
  }

  // Handle error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Handle authenticated state
  if (creatorId) {
    return <StreamView creatorId={creatorId} share={false} />;
  }

  // Fallback
  return <div>Unable to load stream.</div>;
}

export default App;
