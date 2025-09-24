"use client"

import { signIn, signOut, useSession } from "next-auth/react"

export function Appbar() {
  const {  status } = useSession()
  const signOutHandler = async () => {

    const response = await fetch("/api/me", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      alert("Failed to delete user");
      return;
    } else {  
    signOut({
      callbackUrl: "/dashboard"
    })
    alert("User deleted successfully")
  }


  }


  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 p-4 border-b border-cyan-500/30">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter text-white">
          Muzzi Dashboard
        </h1>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400 rounded-2xl bg-blue-500 p-2 px-4">
            {status === "loading" && (
              <span className="opacity-70">Loading...</span>
            )}

            {status === "authenticated" && (
              <button
                onClick={() => signOutHandler()}
                className="text-white font-semibold hover:underline"
              >
                Logout
              </button>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn()}
                className="text-white font-semibold hover:underline"
              >
                Login
              </button>
            )}
          </span>
        </div>
      </div>
    </header>
  )
}
