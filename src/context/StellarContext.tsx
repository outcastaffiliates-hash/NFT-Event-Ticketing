"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAllowed, getPublicKey, isConnected as checkFreighterConnected } from "@stellar/freighter-api";

interface StellarContextType {
  isConnected: boolean;
  walletAddress: string;
  isConnecting: boolean;
  error: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function StellarProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setIsConnecting(true);
    setError("");
    
    try {
      const hasFreighter = await checkFreighterConnected();
      if (!hasFreighter) {
        setError("Freighter extension not found!");
        setIsConnecting(false);
        return;
      }
      
      const allowed = await setAllowed();
      if (allowed) {
        const publicKey = await getPublicKey();
        setWalletAddress(publicKey);
        setIsConnected(true);
      } else {
        setError("Connection rejected by user");
      }
    } catch (e) {
      setError("Wallet error occurred.");
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setError("");
  };

  return (
    <StellarContext.Provider
      value={{
        isConnected,
        walletAddress,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar() {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error("useStellar must be used within a StellarProvider");
  }
  return context;
}
