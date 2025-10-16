"use client";
import React from 'react';
import { Appbar } from './components/Appbar';
import { Redirect } from './components/Redirect';
import { signIn } from 'next-auth/react';


function App() {
    return (
        <div className="bg-gray-900 text-white transition-colors duration-300">
            {/* Styles that would normally be in the <head> */}
            <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                }
                .hero-bg {
                    background: linear-gradient(rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.95)), url('https://placehold.co/1920x1080/1a202c/ffffff?text=Live+Concert+Vibes');
                    background-size: cover;
                    background-position: center;
                }
                .glow-effect {
                    box-shadow: 0 0 15px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.3);
                }
            `}</style>
            
            {/* Header */}
            <Appbar />
            <Redirect />

            {/* Hero Section */}
            <main className="hero-bg">
                <div className="container mx-auto flex flex-col items-center justify-center min-h-screen text-center px-6">
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-wider mb-4 text-white">
                        Let Your Fans <span className="text-cyan-400">DJ Your Stream</span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mb-8">
                        Stop guessing what your audience wants to hear. With Muzzi, your fans vote on the music, creating an interactive live experience that keeps them coming back for more.
                    </p>
                    <a href="#cta" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-10 rounded-full text-lg transition duration-300 transform hover:scale-105 glow-effect" onClick={()=>{
                         signIn()
                    }}>
                        Start Your Interactive Stream
                    </a>
                </div>
            </main>

            {/* How It Works Section */}
            <section className="py-20 bg-black">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-4xl font-bold mb-2">It's Simple to Get Started</h3>
                    <p className="text-gray-400 mb-12">Three steps to a more engaged audience.</p>
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                            <div className="bg-cyan-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
                            <h4 className="text-2xl font-semibold mb-3">Link Your Music</h4>
                            <p className="text-gray-400">Connect your Spotify, Apple Music, or SoundCloud account. We'll pull in your favorite playlists and liked songs.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                            <div className="bg-cyan-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
                            <h4 className="text-2xl font-semibold mb-3">Start Your Stream</h4>
                            <p className="text-gray-400">Go live! We provide a unique link for your fans to join the interactive session. No downloads required for them.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                            <div className="bg-cyan-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
                            <h4 className="text-2xl font-semibold mb-3">Let Fans Vote</h4>
                            <p className="text-gray-400">Fans can see upcoming tracks, suggest songs from your library, and vote for what plays next. The top-voted song automatically joins the queue.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h3 className="text-4xl font-bold mb-2">Build a Community, Not Just a Following</h3>
                        <p className="text-gray-400 mb-12">Tools designed for creator success.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Boost Engagement</h4><p className="text-gray-300">Turn passive listeners into active participants. Higher engagement means better viewer retention.</p></div>
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Monetize Your Vibe</h4><p className="text-gray-300">Allow fans to supercharge their votes or make special requests with tips.</p></div>
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Seamless Integration</h4><p className="text-gray-300">Works with your existing streaming software like OBS and Streamlabs.</p></div>
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Real-time Analytics</h4><p className="text-gray-300">See your most popular tracks and most active fans at a glance.</p></div>
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Song Request Queue</h4><p className="text-gray-300">Manage incoming requests easily with a moderated queue system.</p></div>
                        <div className="bg-gray-900 p-6 rounded-lg"><h4 className="text-xl font-semibold mb-2 text-cyan-400">Customizable Overlay</h4><p className="text-gray-300">Show the current track and voting progress directly on your stream.</p></div>
                    </div>
                </div>
            </section>
            
            {/* Testimonial Section */}
            <section className="py-20 bg-black">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h3 className="text-4xl font-bold mb-12">Loved by Creators</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 text-center">
                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700"><p className="text-gray-300 mb-4">"Muzzi changed the game for my channel. My chat has never been more active, and my average view duration has doubled. It's a must-have tool for any music streamer."</p><p className="font-bold text-cyan-400">- DJ VibeMaster</p></div>
                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700"><p className="text-gray-300 mb-4">"I used to spend hours curating the perfect playlist, only for half the chat to complain. Now, they just pick the music themselves! It's less stress for me and more fun for them."</p><p className="font-bold text-cyan-400">- LofiGirl24/7</p></div>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-gray-900 py-10">
                <div className="container mx-auto text-center text-gray-400">
                    <p>&copy; 2024 Muzzi. All Rights Reserved.</p>
                    <div className="flex justify-center space-x-6 mt-4">
                        <a href="#" className="hover:text-cyan-400">Twitter</a>
                        <a href="#" className="hover:text-cyan-400">Discord</a>
                        <a href="#" className="hover:text-cyan-400">Privacy Policy</a>
                        <a href="#" className="hover:text-cyan-400">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;

