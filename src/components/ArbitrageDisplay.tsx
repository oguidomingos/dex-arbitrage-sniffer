import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Wallet, RefreshCcw, PiggyBank, TrendingUp, AlertCircle } from "lucide-react";
import { TransactionHistory } from "./TransactionHistory";
import { ArbitrageDetails } from "./ArbitrageDetails";
import { toast } from "sonner";
import { ethers } from "ethers";
import { useState, useEffect } from "react";

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
    status: 'success' | 'failed' | 'pending';
    amount?: string;
    error?: string;
    profitEstimate?: number;
    txHash?: string;
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
  const [maticBalance, setMaticBalance] = useState<string | null>(null);
  const isOpportunityProfitable = simulationResult && estimatedProfit && estimatedProfit > 0;

  // Get price for tokenA from prices object
  const getTokenPrice = (token: string) => {
    if (!prices || !prices[token] || prices[token].length === 0) return 0;
    return prices[token][prices[token].length - 1].price;
  };

  const priceA = getTokenPrice(tokenA);
  const priceB = getTokenPrice(tokenB);
  
  // Calculate price difference and percentage
  const priceDiff = Math.abs(priceA - priceB);
  const avgPrice = (priceA + priceB) / 2;
  const percentDiff = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

  // Calculate flashloan details
  const flashloanAmount = priceA * 50; // 50x leverage
  const flashloanFee = flashloanAmount * 0.0009; // 0.09% fee
  const gasCost = 0.01; // Estimated gas cost in MATIC

  // Calculate expected profit
  const calculatedProfit = simulationResult?.expectedProfit || 
    (percentDiff > 0 ? (flashloanAmount * (percentDiff / 100)) - flashloanFee - (gasCost * getTokenPrice('MATIC')) : 0);

  useEffect(() => {
    const checkMaticBalance = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const balance = await provider.getBalance(accounts[0]);
            setMaticBalance(ethers.formatEther(balance));
          }
        } catch (error) {
          console.error("Error checking MATIC balance:", error);
        }
      }
    };

    checkMaticBalance();
    const interval = setInterval(checkMaticBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkRequirements = () => {
    if (!window.ethereum) {
      toast.error("MetaMask não está instalada");
      return false;
    }

    if (!maticBalance || parseFloat(maticBalance) < 0.1) {
      toast.error("Saldo de MATIC insuficiente para gas fees (mínimo 0.1 MATIC)");
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-4">
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
          <CardDescription className="space-y-2">
            <div>Arbitragem automática entre pools (1x/min)</div>
            {maticBalance && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Saldo MATIC: {parseFloat(maticBalance).toFixed(4)} MATIC</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArbitrageDetails
            tokenA={tokenA}
            tokenB={tokenB}
            dexA={dexA}
            dexB={dexB}
            priceA={priceA}
            priceB={priceB}
            priceDiff={priceDiff}
            percentDiff={percentDiff}
            flashloanAmount={flashloanAmount}
            flashloanFee={flashloanFee}
            gasCost={gasCost}
            expectedProfit={calculatedProfit}
            isLoading={isSimulating}
          />
          <TransactionHistory 
            transactions={transactions}
            prices={prices}
            tokenA={tokenA}
            tokenB={tokenB}
            showLogs={false}
            onTxClick={(txHash) => window.open(`https://polygonscan.com/tx/${txHash}`, '_blank')}
          />
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={() => {
              if (checkRequirements()) {
                onSimulate();
              }
            }}
            disabled={isSimulating || isPaused}
            className="flex-1 bg-polygon-purple hover:bg-polygon-purple/90 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {isSimulating ? "Simulando..." : "Simular"}
          </Button>
          <Button 
            onClick={() => {
              if (checkRequirements()) {
                onWithdraw();
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 transition-colors"
          >
            <PiggyBank className="h-4 w-4 mr-2" />
            Retirar Lucro
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};