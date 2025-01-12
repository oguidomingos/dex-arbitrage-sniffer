import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { simulateFlashloan } from "@/lib/flashloan";
import { executeArbitrage, withdrawProfit } from "@/lib/contractInteraction";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";
import { TransactionList } from "./TransactionList";
import { LogDisplay } from "./LogDisplay";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ArrowRightLeft, Wallet, RefreshCcw, PiggyBank, TrendingUp, DollarSign } from "lucide-react";
import { ethers } from "ethers";

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
  type: 'execute' | 'withdraw';
  status: 'success' | 'failed';
  amount?: string;
  error?: string;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB, isPaused }: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const prices = useTokenPrices([tokenA, tokenB]);

  useEffect(() => {
    const updateSimulation = async () => {
      if (isPaused) {
        console.log("Scanner está pausado");
        return;
      }
      
      const currentTime = Date.now();
      const oneMinute = 60000;
      
      if (currentTime - lastExecutionTime < oneMinute) {
        console.log("Aguardando tempo mínimo entre execuções...");
        return;
      }
      
      try {
        console.log("Iniciando simulação...", new Date().toLocaleTimeString());
        const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
        console.log("Resultado da simulação:", {
          lucroEsperado: result.expectedProfit,
          valorInicial: result.initialAmount,
          valorFinal: result.initialAmount + result.expectedProfit
        });
        setSimulationResult(result);
        
        if (result.expectedProfit > 0 && !isExecuting && !isPaused) {
          console.log("Oportunidade lucrativa encontrada! Executando arbitragem...");
          setShowOpportunityDialog(true);
          handleExecuteArbitrage();
          setLastExecutionTime(currentTime);
        } else {
          console.log("Sem oportunidade lucrativa neste momento");
        }
      } catch (error) {
        console.error("Erro detalhado na simulação:", error);
      }
    };

    const interval = setInterval(updateSimulation, 10000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB, dexA, dexB, isPaused, lastExecutionTime, isExecuting]);

  const addTransaction = (type: 'execute' | 'withdraw', status: 'success' | 'failed', amount?: string, error?: string) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      status,
      amount,
      error
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
      toast.success("Simulação concluída com sucesso!");
    } catch (error) {
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
      console.log("Iniciando execução da arbitragem...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log("Parâmetros da arbitragem:", {
        tokenA,
        tokenB,
        amount: "1",
        signer: await signer.getAddress()
      });
      
      await executeArbitrage(
        tokenA,
        tokenB,
        "1",
        signer
      );
      console.log("Arbitragem executada com sucesso!");
      addTransaction('execute', 'success', simulationResult?.expectedProfit?.toFixed(2));
      toast.success("Arbitragem executada com sucesso!");
    } catch (error) {
      console.error("Erro detalhado na execução da arbitragem:", error);
      addTransaction('execute', 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao executar arbitragem");
    } finally {
      setIsExecuting(false);
      setShowOpportunityDialog(false);
    }
  };

  const handleWithdrawProfit = async () => {
    if (!window.ethereum) {
      console.log("MetaMask não encontrada");
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    try {
      console.log("Iniciando retirada de lucro...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log("Parâmetros da retirada:", {
        tokenA,
        signer: await signer.getAddress()
      });
      
      await withdrawProfit(tokenA, signer);
      console.log("Lucro retirado com sucesso!");
      addTransaction('withdraw', 'success');
      toast.success("Lucro retirado com sucesso!");
    } catch (error) {
      console.error("Erro detalhado na retirada:", error);
      addTransaction('withdraw', 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao retirar lucro");
    }
  };

  return (
    <>
      <Dialog open={showOpportunityDialog} onOpenChange={setShowOpportunityDialog}>
        <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Oportunidade de Arbitragem Detectada!
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="bg-black/20 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      Par de Tokens
                    </span>
                    <span className="font-medium text-white">{tokenA}/{tokenB}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Lucro Esperado
                    </span>
                    <span className="font-medium text-green-500">
                      +{simulationResult?.expectedProfit?.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">DEXs</span>
                    <span className="font-medium text-white">{dexA} ↔ {dexB}</span>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Card className="w-full bg-[#1A1F2C] border-2 border-polygon-purple/20 hover:border-polygon-purple/50 transition-all duration-300 shadow-lg hover:shadow-polygon-purple/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-polygon-purple flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {tokenA}/{tokenB}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-3 py-1 rounded-full">
              <span>{dexA}</span>
              <ArrowRightLeft className="h-4 w-4 text-polygon-purple" />
              <span>{dexB}</span>
            </div>
          </div>
          <CardDescription>
            Arbitragem automática entre pools (1x/min)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {simulationResult && (
              <div className="space-y-3">
                <div className="bg-black/20 p-4 rounded-lg space-y-2 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Entrada</span>
                    <span className="font-medium text-white">{simulationResult.initialAmount} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantidade Final</span>
                    <span className="font-medium text-polygon-purple">
                      {(simulationResult.initialAmount + simulationResult.expectedProfit).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lucro Esperado</span>
                    <span className="font-medium text-green-500">
                      +{simulationResult.expectedProfit.toFixed(2)} USDC
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Histórico de Transações</h3>
              <TransactionList transactions={transactions} />
            </div>
            <LogDisplay />
            {prices[tokenA]?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">{tokenA} Price</h3>
                <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm">
                  <PriceChart data={prices[tokenA]} token={tokenA} />
                </div>
              </div>
            )}
            {prices[tokenB]?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">{tokenB} Price</h3>
                <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm">
                  <PriceChart data={prices[tokenB]} token={tokenB} />
                </div>
              </div>
            )}
          </div>
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
