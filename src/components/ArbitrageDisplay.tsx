import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Add this import
import { ArbitrageHeader } from "./arbitrage/ArbitrageHeader";
import { ArbitrageMetrics } from "./arbitrage/ArbitrageMetrics";
import { ArbitrageActions } from "./arbitrage/ArbitrageActions";
import { TransactionHistory } from "./TransactionHistory";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";

const POL_TOKEN_ADDRESS = "0x455E53CBB86018Ac2B8092FdCd39d8444aFFC3F6";
const POL_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

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
  const [polBalance, setPolBalance] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'metrics' | 'chart' | 'history'>('metrics');

  const checkPolBalance = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          const polContract = new ethers.Contract(POL_TOKEN_ADDRESS, POL_ABI, provider);
          const balance = await polContract.balanceOf(accounts[0]);
          const decimals = await polContract.decimals();
          const formattedBalance = ethers.formatUnits(balance, decimals);
          setPolBalance(formattedBalance);
          return formattedBalance;
        }
      } catch (error) {
        console.error("Error checking POL balance:", error);
      }
    }
    return "0";
  };

  const checkRequirements = async () => {
    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return false;
    }

    const balance = await checkPolBalance();
    if (parseFloat(balance) < 0.1) {
      toast.error("Saldo de POL insuficiente. Mínimo necessário: 0.1 POL");
      return false;
    }

    return true;
  };

  useEffect(() => {
    checkPolBalance();
    const interval = setInterval(checkPolBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const getTokenPrice = (token: string) => {
    if (!prices || !prices[token] || prices[token].length === 0) return 0;
    return prices[token][prices[token].length - 1].price;
  };

  const priceA = getTokenPrice(tokenA);
  const priceB = getTokenPrice(tokenB);
  
  const priceDiff = Math.abs(priceA - priceB);
  const avgPrice = (priceA + priceB) / 2;
  const percentDiff = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

  const flashloanAmount = priceA * 50;
  const flashloanFee = flashloanAmount * 0.0009;
  const gasCost = 0.01;

  const calculatedProfit = simulationResult?.expectedProfit || 
    (percentDiff > 0 ? (flashloanAmount * (percentDiff / 100)) - flashloanFee - (gasCost * getTokenPrice('MATIC')) : 0);

  return (
    <div className="space-y-4">
      <Card className="w-full bg-[#1A1F2C] border-2 border-polygon-purple/20 hover:border-polygon-purple/50 transition-all duration-300 shadow-lg hover:shadow-polygon-purple/20">
        <ArbitrageHeader
          tokenA={tokenA}
          tokenB={tokenB}
          dexA={dexA}
          dexB={dexB}
          isPaused={isPaused}
          isSimulating={isSimulating}
          estimatedProfit={estimatedProfit}
          polBalance={polBalance}
        />
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedView === 'metrics' ? 'default' : 'outline'}
              onClick={() => setSelectedView('metrics')}
              className="flex-1"
            >
              Métricas
            </Button>
            <Button
              variant={selectedView === 'chart' ? 'default' : 'outline'}
              onClick={() => setSelectedView('chart')}
              className="flex-1"
            >
              Gráficos
            </Button>
            <Button
              variant={selectedView === 'history' ? 'default' : 'outline'}
              onClick={() => setSelectedView('history')}
              className="flex-1"
            >
              Histórico
            </Button>
          </div>

          {selectedView === 'metrics' && (
            <ArbitrageMetrics
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
          )}

          {selectedView === 'chart' && (
            <div className="space-y-4">
              {prices[tokenA]?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{tokenA} Price</h3>
                  <PriceChart data={prices[tokenA]} token={tokenA} />
                </div>
              )}
              {prices[tokenB]?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{tokenB} Price</h3>
                  <PriceChart data={prices[tokenB]} token={tokenB} />
                </div>
              )}
            </div>
          )}

          {selectedView === 'history' && (
            <TransactionHistory 
              transactions={transactions}
              prices={prices}
              tokenA={tokenA}
              tokenB={tokenB}
              showLogs={false}
              onTxClick={(txHash) => window.open(`https://polygonscan.com/tx/${txHash}`, '_blank')}
            />
          )}
        </CardContent>
        <ArbitrageActions
          isSimulating={isSimulating}
          isPaused={isPaused}
          onSimulate={async () => {
            if (await checkRequirements()) {
              onSimulate();
            }
          }}
          onWithdraw={async () => {
            if (await checkRequirements()) {
              onWithdraw();
            }
          }}
        />
      </Card>
    </div>
  );
};