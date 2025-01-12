import { simulateFlashloan } from "@/lib/flashloan";
import { executeRealArbitrage, withdrawArbitrageProfit } from "@/lib/arbitrageContract";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ethers } from "ethers";
import { SimulationDialog } from "./dialogs/SimulationDialog";
import { ArbitrageDisplay } from "./ArbitrageDisplay";
import { validateArbitrageParameters } from "@/lib/validation";

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
  status: 'success' | 'failed' | 'pending';
  amount?: string;
  error?: string;
  profitEstimate?: number;
  txHash?: string;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB, isPaused }: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [estimatedProfit, setEstimatedProfit] = useState<number | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const prices = useTokenPrices([tokenA, tokenB]);

  const isOpportunityProfitable = (result: any): boolean => {
    if (!result || !result.expectedProfit) return false;
    const minProfitThreshold = 0.01; // 0.01 USDC minimum profit
    return result.expectedProfit > minProfitThreshold;
  };

  const addTransaction = (
    type: 'execute' | 'withdraw' | 'simulation',
    status: 'success' | 'failed' | 'pending',
    txHash?: string,
    amount?: string,
    error?: string,
    profitEstimate?: number
  ) => {
    console.log(`Adding transaction: Type=${type}, Status=${status}, Hash=${txHash}`);
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      status,
      amount,
      error,
      profitEstimate,
      txHash
    };
    setTransactions(prev => [newTransaction, ...prev].slice(0, 10));
  };

  const handleSimulate = async () => {
    if (isPaused) {
      toast.error("Scanner está pausado");
      return;
    }
    
    setIsSimulating(true);
    try {
      console.log("Iniciando simulação para:", { tokenA, tokenB, dexA, dexB });
      const validationError = validateArbitrageParameters(tokenA, tokenB, dexA, dexB);
      if (validationError) {
        throw new Error(validationError);
      }

      const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
      console.log("Resultado da simulação:", result);
      setSimulationResult(result);
      setShowSimulationDialog(true);
      
      if (result && result.expectedProfit) {
        addTransaction('simulation', 'success', undefined, undefined, undefined, result.expectedProfit);
        toast.success("Simulação concluída com sucesso!", {
          description: `Lucro estimado: ${result.expectedProfit.toFixed(2)} USDC`
        });
      }
    } catch (error) {
      console.error("Erro na simulação:", error);
      addTransaction('simulation', 'failed', undefined, undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao simular operação", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
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
      console.log("Iniciando retirada de lucro para token:", tokenA);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const txHash = await withdrawArbitrageProfit(tokenA, signer);
      console.log("Hash da transação de retirada:", txHash);
      
      addTransaction('withdraw', 'pending', txHash);
      
      // Aguarda confirmação da transação
      const receipt = await provider.waitForTransaction(txHash);
      console.log("Recibo da transação:", receipt);
      
      if (receipt.status === 1) {
        addTransaction('withdraw', 'success', txHash);
        toast.success("Lucro retirado com sucesso!");
      } else {
        throw new Error("Transação falhou");
      }
    } catch (error) {
      console.error("Erro ao retirar lucro:", error);
      addTransaction('withdraw', 'failed', undefined, undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao retirar lucro", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
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
        const validationError = validateArbitrageParameters(tokenA, tokenB, dexA, dexB);
        if (validationError) {
          console.error("Validation error:", validationError);
          return;
        }

        const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
        setSimulationResult(result);
        setEstimatedProfit(result.expectedProfit);
        
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const gasPrice = await provider.getFeeData();
          const estimatedGas = ethers.formatEther(gasPrice.maxFeePerGas || 0n);
          setGasEstimate(estimatedGas);
        }
        
        if (isOpportunityProfitable(result)) {
          if (result && result.expectedProfit) {
            addTransaction('simulation', 'success', undefined, undefined, undefined, result.expectedProfit);
            setShowSimulationDialog(true);
            
            toast.success(`Oportunidade encontrada: ${tokenA}/${tokenB}`, {
              description: `Lucro esperado: ${result.expectedProfit.toFixed(2)} USDC`,
              duration: 3000
            });
          }
          
          setLastExecutionTime(currentTime);
        }
      } catch (error) {
        console.error("Erro na simulação:", error);
        setEstimatedProfit(null);
        setIsSimulating(false);
        
        if (error instanceof Error) {
          toast.error("Erro na simulação", {
            description: error.message
          });
        }
      }
    };

    updateSimulation();
    const interval = setInterval(updateSimulation, 1000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB, dexA, dexB, isPaused, lastExecutionTime]);

  return (
    <>
      <SimulationDialog
        open={showSimulationDialog}
        onOpenChange={setShowSimulationDialog}
        simulationResult={simulationResult}
        isExecuting={isExecuting}
        gasEstimate={gasEstimate}
      />

      <ArbitrageDisplay
        tokenA={tokenA}
        tokenB={tokenB}
        dexA={dexA}
        dexB={dexB}
        profit={profit}
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