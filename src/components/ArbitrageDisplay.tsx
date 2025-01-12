import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Wallet, RefreshCcw, PiggyBank, TrendingUp } from "lucide-react";
import { TransactionHistory } from "./TransactionHistory";
import { toast } from "sonner";

interface ArbitrageDisplayProps {
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  profit: number;
  isPaused: boolean;
  transactions: Array<{
    id: string;
    timestamp: number;
    type: 'execute' | 'withdraw' | 'simulation';
    status: 'success' | 'failed';
    amount?: string;
    error?: string;
    profitEstimate?: number;
  }>;
  prices: any;
  estimatedProfit: number | null;
  isSimulating: boolean;
  isExecuting: boolean;
  onSimulate: () => void;
  onWithdraw: () => void;
  simulationResult: any;
}

export const ArbitrageDisplay = ({
  tokenA,
  tokenB,
  dexA,
  dexB,
  isPaused,
  transactions,
  prices,
  estimatedProfit,
  isSimulating,
  isExecuting,
  onSimulate,
  onWithdraw,
  simulationResult
}: ArbitrageDisplayProps) => {
  const isOpportunityProfitable = simulationResult && estimatedProfit && estimatedProfit > 0;

  return (
    <Card className="w-full bg-[#1A1F2C] border-2 border-polygon-purple/20 hover:border-polygon-purple/50 transition-all duration-300 shadow-lg hover:shadow-polygon-purple/20">
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
            {estimatedProfit !== null && isOpportunityProfitable && (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4" />
                <span>+{estimatedProfit.toFixed(2)} USDC</span>
              </div>
            )}
          </div>
        </div>
        <CardDescription>
          Arbitragem automática entre pools (1x/min)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionHistory 
          transactions={transactions}
          prices={prices}
          tokenA={tokenA}
          tokenB={tokenB}
          showLogs={false}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={onSimulate}
          disabled={isSimulating || isPaused}
          className="flex-1 bg-polygon-purple hover:bg-polygon-purple/90 transition-colors"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {isSimulating ? "Simulando..." : "Simular"}
        </Button>
        <Button 
          onClick={onWithdraw}
          className="flex-1 bg-green-600 hover:bg-green-700 transition-colors"
        >
          <PiggyBank className="h-4 w-4 mr-2" />
          Retirar Lucro
        </Button>
      </CardFooter>
    </Card>
  );
};