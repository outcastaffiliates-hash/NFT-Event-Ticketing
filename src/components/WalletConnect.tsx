"use client";

import { Wallet, LogOut, ChevronDown, AlertCircle } from "lucide-react";
import { useStellar } from "@/context/StellarContext";

export default function WalletConnect() {
  const { 
    isConnected, 
    walletAddress, 
    isConnecting, 
    error, 
    connectWallet, 
    disconnectWallet 
  } = useStellar();

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 transition-all duration-300">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">XLM</span>
          </div>
          <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
          <div className="glass-card p-2 rounded-xl flex flex-col gap-1 shadow-xl">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs text-gray-400">Network</p>
              <p className="font-semibold text-teal-400 text-sm">Testnet</p>
            </div>
            <button
              onClick={disconnectWallet}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors w-full text-left mt-1"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300 backdrop-blur-md text-sm font-medium disabled:opacity-50"
      >
        {isConnecting ? (
          <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Wallet className="w-4 h-4 text-teal-400" />
        )}
        <span>{isConnecting ? "Connecting..." : "Connect Freighter"}</span>
      </button>
      
      {error && (
        <span className="text-xs text-red-400 flex items-center gap-1 opacity-90 absolute top-full mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </div>
  );
}
