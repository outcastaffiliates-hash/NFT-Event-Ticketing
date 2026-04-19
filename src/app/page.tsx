"use client";

import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import EventCard from "@/components/EventCard";
import { Ticket, Search, Filter } from "lucide-react";
import { useStellar } from "@/context/StellarContext";

// Mock Data
const upcomingEvents = [
  {
    id: "evt_1",
    title: "Global Web3 Summit",
    date: "August 15, 2026",
    location: "Dubai, UAE",
    category: "Conference",
    price: "150",
    currency: "USDC",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    remaining: 45
  },
  {
    id: "evt_2",
    title: "Stellar Developer Bootcamp",
    date: "September 02, 2026",
    location: "Virtual Experience",
    category: "Workshop",
    price: "50",
    currency: "XLM",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    remaining: 120
  },
  {
    id: "evt_3",
    title: "NFT Art Exhibition",
    date: "October 10, 2026",
    location: "New York City, NY",
    category: "Exhibition",
    price: "200",
    currency: "USDC",
    image: "https://images.unsplash.com/photo-1520110120536-11f810168341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    remaining: 12
  }
];

export default function Home() {
  const { isConnected } = useStellar();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Conference", "Workshop", "Exhibition"];

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen animated-bg text-white selection:bg-teal-500/30">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Rise<span className="text-teal-400">Tix</span>
          </span>
        </div>
        <WalletConnect />
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Stellar Network Live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Premium Web3 <br/>
            <span className="gradient-text">Event Experiences</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
            Discover exclusive events, mint verifiable NFT tickets, and access dynamic experiences on the Stellar blockchain.
          </p>
        </section>

        {/* Dashboard Sections (Conditional on Wallet Context) */}
        {isConnected && (
          <section className="flex flex-col gap-6 p-8 rounded-3xl glass-card border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-teal-400" /> My Tickets
            </h2>
            <div className="flex items-center justify-center py-10 border border-white/5 bg-black/20 rounded-2xl border-dashed">
              <p className="text-gray-400">You haven't minted any tickets yet. Explore events below!</p>
            </div>
          </section>
        )}

        {/* Featured Events Grid */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="text-gray-400 mt-2">Mint exclusive NFT tickets directly to your wallet.</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/50 transition-all placeholder:text-gray-500"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-8 text-sm focus:outline-none focus:border-teal-400/50 transition-all text-white cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 border border-white/5 rounded-2xl bg-white/5">
                No events found matching your criteria.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
