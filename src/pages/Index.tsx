import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArbitrageCard } from "@/components/ArbitrageCard";
import { connectWallet, provider } from "@/lib/web3";
import { toast } from "sonner";
import { Pause, Play } from "lucide-react";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [opportunities] = useState([
    {
      tokenA: "MATIC",
      tokenB: "USDC",
      profit: 0.5,
      dexA: "QuickSwap",
      dexB: "SushiSwap",
    }
  ]);

  const handleConnect = async () => {
    const signer = await connectWallet();
    if (signer) {
      setConnected(true);
      toast.success("Wallet connected successfully!");
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    toast.success(isPaused ? "Scanner resumed" : "Scanner paused");
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setConnected(accounts.length > 0);
      }
    };
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1F2C] bg-gradient-to-b from-[#221F26] to-[#1A1F2C]">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-polygon-purple">Polygon Arbitrage Scanner</h1>
          <div className="flex gap-4">
            <Button
              onClick={togglePause}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={handleConnect}
              variant={connected ? "secondary" : "default"}
              className="bg-polygon-purple hover:bg-polygon-purple/90 text-white"
            >
              {connected ? "Connected" : "Connect Wallet"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp, index) => (
            <ArbitrageCard key={index} {...opp} isPaused={isPaused} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;