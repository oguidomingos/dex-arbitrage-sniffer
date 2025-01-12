import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateFlashloan } from "@/lib/flashloan";
import { executeArbitrage, withdrawProfit } from "@/lib/contractInteraction";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ArrowRightLeft, Wallet, RefreshCcw, PiggyBank, TrendingUp } from "lucide-react";
import { ethers } from "ethers";
import { SimulationDialog } from "./dialogs/SimulationDialog";

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
    
    console.log("Análise de Rentabilidade:", {
      expectedProfit: result.expectedProfit,
      slippageCost,
      gasEstimate,
      netProfit,
      profitPercentage: `${profitPercentage.toFixed(2)}%`,
      isRentável: profitPercentage > minimumProfitThreshold
    });
    
    return profitPercentage > minimumProfitThreshold;
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

  const handleExecuteArbitrage = async () => {
    if (isPaused) {
      console.log("Execução bloqueada: scanner pausado");
      toast.error("Scanner está pausado");
      return;
    }

    if (!window.ethereum) {
      console.log("MetaMask não encontrada");
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    setIsExecuting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      await executeArbitrage(tokenA, tokenB, "1", signer);
      addTransaction('execute', 'success', simulationResult?.expectedProfit?.toFixed(2));
      toast.success("Arbitragem executada com sucesso!");
      setShowSimulationDialog(false);
    } catch (error) {
      console.error("Erro detalhado na execução da arbitragem:", error);
      addTransaction('execute', 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao executar arbitragem");
    } finally {
      setIsExecuting(false);
      setShowSimulationDialog(false);
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
      await withdrawProfit(tokenA, signer);
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
              {estimatedProfit !== null && isOpportunityProfitable(simulationResult) && (
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
          {/* Removed TransactionHistory component */}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={handleSimulate}
            disabled={isSimulating || isPaused}
            className="flex-1 bg-polygon-purple hover:bg-polygon-purple/90 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {isSimulating ? "Simulando..." : "Simular"}
          </Button>
          <Button 
            onClick={handleWithdrawProfit}
            className="flex-1 bg-green-600 hover:bg-green-700 transition-colors"
          >
            <PiggyBank className="h-4 w-4 mr-2" />
            Retirar Lucro
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};
