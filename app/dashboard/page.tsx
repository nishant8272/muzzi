"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import StreamView from "../components/StreamView";
import { signIn } from "next-auth/react";


function Loader(){
  return (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 300 150"
          className="w-64 h-32 "
        >
          <rect width="300" height="150" className="#0d1320" fill="#0d1320" />
          <path
            fill="none"
            stroke="#541EFF"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray="300 385"
            strokeDashoffset="0"
            d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
          >
            <animate
              attributeName="stroke-dashoffset"
              calcMode="spline"
              dur="3.1s"
              values="685;-685"
              keySplines="0 0 1 1"
              repeatCount="indefinite"
            />
          </path>
        </svg>
  )
}

function App() {
  const { data: session, status } = useSession();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreatorId() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch(`/api/me/?email=${session.user.email}`);
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          const responseData = await response.json();
          setCreatorId(responseData.creatorId);
        } catch (err: any) {
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
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1320]">
        <Loader />
      </div>
    );

  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1320]">
        <div className="flex flex-col items-center justify-center">
          <Loader />
          <div>
            <h1 className="text-3xl font-bold text-white text-center">Muzzi, please sign in to continue.</h1>
            <button className="bg-[#0d1320] hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg transition duration-300" onClick={() => signIn()}>Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1320]">
        <div className="flex flex-col items-center justify-center">
          <Loader />
          <div>
            <h1 className="text-3xl font-bold text-white text-center">An error occurred: {error}</h1>
          </div>
        </div>
      </div>
    );
  }

  // Handle authenticated state
  if (creatorId) {
    return <StreamView creatorId={creatorId} share={false} />;
  }

  // Fallback
  return (

    <div className="flex items-center justify-center h-screen bg-[#0d1320]">
      <div className="flex flex-col items-center justify-center">
        <Loader/>
        <div>
          <h1 className="text-3xl font-bold text-white text-center">Unable to fetch creator ID. Please try again later.</h1>
        </div>
      </div>
    </div>
      )
}

      export default App;
