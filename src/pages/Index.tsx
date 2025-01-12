import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet } from "@/lib/web3";
import { toast } from "sonner";
import { Pause, Play } from "lucide-react";
import { PoolProfitCard } from "@/components/PoolProfitCard";
import { TransactionsTable } from "@/components/TransactionsTable";
import { SimulationDialog } from "@/components/dialogs/SimulationDialog";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [opportunities] = useState([
    {
      tokenA: "MATIC",
      tokenB: "USDC",
      profit: 0.5,
      dexA: "QuickSwap",
      dexB: "SushiSwap",
    },
    {
      tokenA: "USDT",
      tokenB: "USDC",
      profit: 0.2,
      dexA: "QuickSwap",
      dexB: "UniswapV3",
    },
    {
      tokenA: "ETH",
      tokenB: "USDC",
      profit: 0.3,
      dexA: "SushiSwap",
      dexB: "UniswapV3",
    },
    {
      tokenA: "WBTC",
      tokenB: "USDC",
      profit: 0.4,
      dexA: "QuickSwap",
      dexB: "SushiSwap",
    },
    {
      tokenA: "DAI",
      tokenB: "USDC",
      profit: 0.15,
      dexA: "UniswapV3",
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

  return (
    <div className="min-h-screen bg-[#1A1F2C] bg-gradient-to-b from-[#221F26] to-[#1A1F2C]">
      <SimulationDialog
        open={showSimulationDialog}
        onOpenChange={setShowSimulationDialog}
        simulationResult={simulationResult}
        isExecuting={false}
      />
      
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {opportunities.map((opp, index) => (
            <PoolProfitCard key={index} {...opp} />
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-polygon-purple mb-4">Histórico de Transações</h2>
          <TransactionsTable transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default Index;