import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateFlashloan } from "@/lib/flashloan";
import { executeArbitrage, withdrawProfit } from "@/lib/contractInteraction";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ArrowRightLeft, Wallet, RefreshCcw, PiggyBank } from "lucide-react";
import { ethers } from "ethers";

interface ArbitrageCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
  isPaused: boolean;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB, isPaused }: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const prices = useTokenPrices([tokenA, tokenB]);

  useEffect(() => {
    const updateSimulation = async () => {
      if (isPaused) return; // Não executa se estiver pausado
      
      try {
        const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
        setSimulationResult(result);
        
        // Auto-execute if profitable and not paused
        if (result.expectedProfit > 0 && !isExecuting && !isPaused) {
          handleExecuteArbitrage();
        }
      } catch (error) {
        console.error("Erro ao atualizar simulação:", error);
      }
    };

    const interval = setInterval(updateSimulation, 1000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB, dexA, dexB, isPaused]);

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
      toast.error("Scanner está pausado");
      return;
    }

    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    setIsExecuting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      await executeArbitrage(
        tokenA,
        tokenB,
        "1",
        signer
      );
    } catch (error) {
      console.error("Erro ao executar arbitragem:", error);
      toast.error("Erro ao executar arbitragem");
    } finally {
      setIsExecuting(false);
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
    } catch (error) {
      console.error("Erro ao retirar lucro:", error);
      toast.error("Erro ao retirar lucro");
    }
  };

  return (
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
        <CardDescription className="text-sm text-muted-foreground">
          Arbitragem automática entre pools
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
  );
};