import { ArrowRightLeft, Search, TrendingUp, Wallet } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ArbitrageHeaderProps {
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  isPaused: boolean;
  isSimulating: boolean;
  estimatedProfit: number | null;
  walletBalance: string | null;
  walletAddress: string | null;
}

export const ArbitrageHeader = ({
  tokenA,
  tokenB,
  dexA,
  dexB,
  isPaused,
  isSimulating,
  estimatedProfit,
  walletBalance,
  walletAddress,
}: ArbitrageHeaderProps) => {
  return (
    <CardHeader className="space-y-4">
      {/* First Row - Token Pair and DEX Info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl font-bold text-polygon-purple flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span>{tokenA}/{tokenB}</span>
        </CardTitle>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="text-sm text-muted-foreground bg-black/20 px-3 py-1.5 rounded-full flex items-center">
            <span>{dexA}</span>
            <ArrowRightLeft className="h-4 w-4 text-polygon-purple mx-2" />
            <span>{dexB}</span>
          </div>
        </div>
      </div>

      {/* Second Row - Status Indicators */}
      <div className="flex flex-wrap gap-2">
        {!isPaused && !isSimulating && (
          <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full animate-pulse">
            <Search className="h-4 w-4" />
            <span className="text-sm">Buscando oportunidades...</span>
          </div>
        )}
        {estimatedProfit !== null && (
          <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">+{estimatedProfit.toFixed(2)} USDC</span>
          </div>
        )}
      </div>

      {/* Third Row - Wallet Info */}
      <CardDescription className="space-y-2">
        <div className="text-sm">Arbitragem automática entre pools (1x/min)</div>
        {walletAddress && (
          <div className="flex flex-col gap-2 bg-black/10 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </span>
            </div>
            {walletBalance && (
              <div className="text-sm text-muted-foreground">
                Saldo: {parseFloat(walletBalance).toFixed(4)} MATIC
              </div>
            )}
          </div>
        )}
      </CardDescription>
    </CardHeader>
  );
};