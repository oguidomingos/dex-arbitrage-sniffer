import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArbitrageHeader } from "./arbitrage/ArbitrageHeader";
import { ArbitrageMetrics } from "./arbitrage/ArbitrageMetrics";
import { ArbitrageActions } from "./arbitrage/ArbitrageActions";
import { TransactionHistory } from "./TransactionHistory";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, TrendingUp, Clock, DollarSign, Fuel, Percent } from "lucide-react";

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
  const [selectedView, setSelectedView] = useState<'metrics' | 'chart' | 'history'>('metrics');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [previousPriceA, setPreviousPriceA] = useState<number>(0);
  const [previousPriceB, setPreviousPriceB] = useState<number>(0);
  const [gasPriceGwei, setGasPriceGwei] = useState<string>("0");
  const [estimatedGasCost, setEstimatedGasCost] = useState<string>("0");
  const [operationAmount, setOperationAmount] = useState<string>("1000");
  const [calculatedProfit, setCalculatedProfit] = useState<number>(0);
  const [flashloanPercentage, setFlashloanPercentage] = useState<number>(0);
  const [flashloanFee, setFlashloanFee] = useState<number>(0);

  const checkWalletDetails = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const balance = await provider.getBalance(accounts[0]);
          setWalletBalance(ethers.formatEther(balance));
          
          const feeData = await provider.getFeeData();
          const gasPriceInGwei = ethers.formatUnits(feeData.gasPrice || 0n, "gwei");
          setGasPriceGwei(parseFloat(gasPriceInGwei).toFixed(2));
          
          const estimatedGas = (feeData.gasPrice || 0n) * BigInt(250000);
          setEstimatedGasCost(ethers.formatEther(estimatedGas));
        }
      } catch (error) {
        console.error("Error checking wallet details:", error);
      }
    }
  };

  useEffect(() => {
    checkWalletDetails();
    const interval = setInterval(checkWalletDetails, 10000);
    return () => clearInterval(interval);
  }, []);

  const getTokenPrice = (token: string) => {
    if (!prices || !prices[token] || prices[token].length === 0) return 0;
    return prices[token][prices[token].length - 1].price;
  };

  const priceA = getTokenPrice(tokenA);
  const priceB = getTokenPrice(tokenB);
  const priceDiff = Math.abs(priceA - priceB);
  const percentDiff = ((priceDiff / Math.min(priceA, priceB)) * 100) || 0;

  useEffect(() => {
    const amount = parseFloat(operationAmount) || 0;
    const flashloanFeeRate = 0.0009; // 0.09%
    const calculatedFee = amount * flashloanFeeRate;
    const gasInUsd = parseFloat(estimatedGasCost) * priceA; // Convert MATIC gas cost to USD
    
    const grossProfit = amount * (percentDiff / 100);
    const netProfit = grossProfit - calculatedFee - gasInUsd;
    
    const poolLiquidity = 1000000; // Example pool liquidity in USDC
    const flashloanPercent = (amount / poolLiquidity) * 100;
    
    setFlashloanFee(calculatedFee);
    setFlashloanPercentage(flashloanPercent);
    setCalculatedProfit(netProfit > 0 ? netProfit : 0);
    
    console.log('Cálculos da operação:', {
      amount,
      flashloanFee: calculatedFee,
      gasInUsd,
      grossProfit,
      netProfit,
      flashloanPercent
    });
  }, [operationAmount, percentDiff, estimatedGasCost, priceA]);

  useEffect(() => {
    if (priceA !== previousPriceA) {
      setPreviousPriceA(priceA);
    }
    if (priceB !== previousPriceB) {
      setPreviousPriceB(priceB);
    }
  }, [priceA, priceB]);

  const getPriceChangeClass = (current: number, previous: number) => {
    if (current > previous) return "text-green-500";
    if (current < previous) return "text-red-500";
    return "text-white";
  };

  return (
    <Card className="w-full bg-gradient-to-br from-[#1a1c2a] to-[#1E1E2D] border-[#2B2B40] hover:border-polygon-purple/30 transition-all duration-300 shadow-lg">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-polygon-purple/10 flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-polygon-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{tokenA}/{tokenB}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-black/20">
                  {dexA}
                </Badge>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs bg-black/20">
                  {dexB}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className={`text-lg font-semibold ${calculatedProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {calculatedProfit.toFixed(4)} USDC
              </span>
            </div>
            <span className="text-sm text-muted-foreground mt-1">
              Spread: {percentDiff.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4">
          <label htmlFor="operationAmount" className="block text-sm text-muted-foreground mb-2">
            Valor da Operação (USDC)
          </label>
          <Input
            id="operationAmount"
            type="number"
            value={operationAmount}
            onChange={(e) => setOperationAmount(e.target.value)}
            className="w-full bg-black/20 border-gray-700"
            placeholder="Digite o valor em USDC"
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Taxa Flashloan (0.09%):
            </span>
            <span className="text-red-400">
              -{flashloanFee.toFixed(4)} USDC
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              % do Pool:
            </span>
            <span className={`${flashloanPercentage > 30 ? 'text-red-400' : 'text-green-500'}`}>
              {flashloanPercentage.toFixed(2)}%
              {flashloanPercentage > 30 && (
                <span className="text-xs ml-2 text-red-400">(Risco Alto)</span>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Price {tokenA}</div>
            <div className={`text-lg font-medium ${getPriceChangeClass(priceA, previousPriceA)} transition-colors duration-300`}>
              ${priceA.toFixed(4)}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Price {tokenB}</div>
            <div className={`text-lg font-medium ${getPriceChangeClass(priceB, previousPriceB)} transition-colors duration-300`}>
              ${priceB.toFixed(4)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Update</span>
            </div>
            <div className="text-sm font-medium">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Gas Price</span>
            </div>
            <div className="text-sm font-medium">
              {gasPriceGwei} Gwei
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Est. Gas Cost</span>
            </div>
            <div className="text-sm font-medium text-yellow-500">
              {parseFloat(estimatedGasCost).toFixed(4)} MATIC
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSimulate}
            disabled={isSimulating || isPaused}
            className="flex-1 bg-polygon-purple hover:bg-polygon-purple/90"
          >
            {isSimulating ? 'Simulando...' : 'Simular Arbitragem'}
          </Button>
          <Button
            onClick={onWithdraw}
            variant="outline"
            className="flex-1"
          >
            Retirar Lucro
          </Button>
        </div>

        {transactions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Últimas Transações</h4>
            <div className="space-y-2">
              {transactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-black/20 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tx.status === 'success' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {tx.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {tx.profitEstimate && (
                    <span className={`text-sm ${tx.profitEstimate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.profitEstimate > 0 ? '+' : ''}{tx.profitEstimate.toFixed(4)} USDC
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
