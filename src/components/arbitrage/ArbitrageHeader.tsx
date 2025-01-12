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
  polBalance: string | null;
}

export const ArbitrageHeader = ({
  tokenA,
  tokenB,
  dexA,
  dexB,
  isPaused,
  isSimulating,
  estimatedProfit,
  polBalance,
}: ArbitrageHeaderProps) => {
  return (
    <CardHeader className="space-y-1">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl font-bold text-polygon-purple flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {tokenA}/{tokenB}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground bg-black/20 px-3 py-1 rounded-full">
            <span>{dexA}</span>
            <ArrowRightLeft className="h-4 w-4 text-polygon-purple inline mx-2" />
            <span>{dexB}</span>
          </div>
          {!isPaused && !isSimulating && (
            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full animate-pulse">
              <Search className="h-4 w-4" />
              <span>Buscando oportunidades...</span>
            </div>
          )}
          {estimatedProfit !== null && (
            <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span>+{estimatedProfit.toFixed(2)} USDC</span>
            </div>
          )}
        </div>
      </div>
      <CardDescription className="space-y-2">
        <div>Arbitragem automática entre pools (1x/min)</div>
        {polBalance && (
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>Saldo POL: {parseFloat(polBalance).toFixed(4)} POL</span>
          </div>
        )}
      </CardDescription>
    </CardHeader>
  );
};