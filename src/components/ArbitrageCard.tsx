import { simulateFlashloan } from "@/lib/flashloan";
import { executeRealArbitrage, withdrawArbitrageProfit } from "@/lib/arbitrageContract";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ethers } from "ethers";
import { SimulationDialog } from "./dialogs/SimulationDialog";
import { ArbitrageDisplay } from "./ArbitrageDisplay";

interface ArbitrageCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
  isPaused: boolean;
}

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw' | 'simulation';
  status: 'success' | 'failed';
  amount?: string;
  error?: string;
  profitEstimate?: number;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB, isPaused }: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [estimatedProfit, setEstimatedProfit] = useState<number | null>(null);
  const prices = useTokenPrices([tokenA, tokenB]);

  const isOpportunityProfitable = (result: any) => {
    const gasEstimate = 0.01;
    const slippagePercentage = 0.005;
    
    if (!result || !result.expectedProfit) return false;
    
    const slippageCost = result.initialAmount * slippagePercentage;
    const minimumProfitThreshold = 0.02;
    
    const netProfit = result.expectedProfit - slippageCost - gasEstimate;
    const profitPercentage = (netProfit / result.initialAmount) * 100;
    
    return profitPercentage > minimumProfitThreshold;
  };

  const addTransaction = (
    type: 'execute' | 'withdraw' | 'simulation',
    status: 'success' | 'failed',
    amount?: string,
    error?: string,
    profitEstimate?: number
  ) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      status,
      amount,
      error,
      profitEstimate
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  useEffect(() => {
    const updateSimulation = async () => {
      if (isPaused) return;
      
      const currentTime = Date.now();
      const oneMinute = 60000;
      
      if (currentTime - lastExecutionTime < oneMinute) {
        return;
      }
      
      try {
        const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
        setSimulationResult(result);
        setEstimatedProfit(result.expectedProfit);
        
        if (isOpportunityProfitable(result) && !isExecuting) {
          addTransaction('simulation', 'success', undefined, undefined, result.expectedProfit);
          setShowSimulationDialog(true);
          
          toast.success(`Oportunidade encontrada: ${tokenA}/${tokenB}`, {
            description: `Lucro esperado: ${result.expectedProfit.toFixed(2)} USDC`,
            duration: 3000
          });
          
          setLastExecutionTime(currentTime);
          
          setTimeout(() => {
            setShowSimulationDialog(false);
          }, 3000);
        }
      } catch (error) {
        console.error("Erro na simulação:", error);
        setEstimatedProfit(null);
        setIsSimulating(false);
      }
    };

    updateSimulation();
    const interval = setInterval(updateSimulation, 1000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB, dexA, dexB, isPaused, lastExecutionTime, isExecuting]);

  const handleSimulate = async () => {
    if (isPaused) {
      toast.error("Scanner está pausado");
      return;
    }
    
    setIsSimulating(true);
    try {
      const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
      setSimulationResult(result);
      setShowSimulationDialog(true);
      addTransaction('simulation', 'success', undefined, undefined, result.expectedProfit);
      toast.success("Simulação concluída com sucesso!");
      
      setTimeout(() => {
        setShowSimulationDialog(false);
      }, 3000);
    } catch (error) {
      console.error("Erro na simulação:", error);
      addTransaction('simulation', 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao simular operação");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleWithdrawProfit = async () => {
    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await withdrawArbitrageProfit(tokenA, signer);
      addTransaction('withdraw', 'success');
      toast.success("Lucro retirado com sucesso!");
    } catch (error) {
      addTransaction('withdraw', 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao retirar lucro");
    }
  };

  return (
    <>
      <SimulationDialog
        open={showSimulationDialog}
        onOpenChange={setShowSimulationDialog}
        simulationResult={simulationResult}
        isExecuting={isExecuting}
      />

      <ArbitrageDisplay
        tokenA={tokenA}
        tokenB={tokenB}
        dexA={dexA}
        dexB={dexB}
        isPaused={isPaused}
        transactions={transactions}
        prices={prices}
        estimatedProfit={estimatedProfit}
        isSimulating={isSimulating}
        isExecuting={isExecuting}
        onSimulate={handleSimulate}
        onWithdraw={handleWithdrawProfit}
        simulationResult={simulationResult}
      />
    </>
  );
};