"use client";

import { Calendar, MapPin, Ticket, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useStellar } from "@/context/StellarContext";

interface EventProps {
  id: string;
  title: string;
  date: string;
  location: string;
  price: string;
  currency: string;
  image: string;
  remaining: number;
}

export default function EventCard({ event }: { event: EventProps }) {
  const { isConnected, walletAddress } = useStellar();
  const [isMinting, setIsMinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleMint = async () => {
    if (!isConnected || !walletAddress) {
      setError("Please connect your wallet first!");
      return;
    }

    setIsMinting(true);
    setError("");

    try {
      // 1. Get unsigned Trustline XDR from backend
      const assetCodeStr = event.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12).toUpperCase();
      
      let signedXdr = null;
      const buildRes = await fetch("/api/trustline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPublicKey: walletAddress, assetCode: assetCodeStr })
      });
      const buildData = await buildRes.json();

      if (buildData.xdr && buildData.xdr !== "simulated_xdr_transaction") {
        // 2. Prompt Freighter to sign the trustline
        const { signTransaction } = await import('@stellar/freighter-api');
        signedXdr = await signTransaction(buildData.xdr, {
          network: 'TESTNET'
        });
      } else {
        signedXdr = 'simulated_xdr_transaction';
      }

      // 3. Send the signed trustline to the backend to mint the ticket
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationPublicKey: walletAddress,
          assetCode: assetCodeStr,
          signedTrustlineXdr: signedXdr
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to mint ticket.");
      }
    } catch (err) {
      setError("API Network error.");
      console.error(err);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      {/* Event Image Placeholder */}
      <div 
        className="w-full h-48 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${event.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <span className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-xs font-semibold border border-white/10 text-teal-300">
            {event.remaining} Tickets Left
          </span>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-300">Price</span>
            <span className="font-bold text-lg text-white drop-shadow-md">
              {event.price} <span className="text-sm font-normal">{event.currency}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
          {event.title}
        </h3>
        
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <button
          onClick={handleMint}
          disabled={isMinting || success}
          className={`mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 ${
            success 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/25"
          } disabled:opacity-75 disabled:cursor-not-allowed`}
        >
          {isMinting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : success ? (
            <>
              <Ticket className="w-5 h-5" />
              Ticket Minted!
            </>
          ) : (
            <>
              <Ticket className="w-5 h-5" />
              Mint Ticket NFT
            </>
          )}
        </button>
        {error && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-1 justify-center">
                <AlertCircle className="w-3 h-3" /> {error}
            </p>
        )}
      </div>
    </div>
  );
}
