import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateFlashloan } from "@/lib/flashloan";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";
import { useTokenPrices } from "@/hooks/useTokenPrices";

interface ArbitrageCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB }: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const prices = useTokenPrices([tokenA, tokenB]);

  useEffect(() => {
    const updateSimulation = async () => {
      try {
        const result = await simulateFlashloan(20, tokenA, tokenB, dexA, dexB);
        setSimulationResult(result);
      } catch (error) {
        console.error("Erro ao atualizar simulação:", error);
      }
    };

    // Executa a atualização imediatamente
    updateSimulation();
    
    // Configura o intervalo para atualizar a cada segundo
    const interval = setInterval(updateSimulation, 1000);
    
    return () => clearInterval(interval);
  }, [tokenA, tokenB, dexA, dexB]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateFlashloan(20, tokenA, tokenB, dexA, dexB);
      setSimulationResult(result);
      toast.success("Simulação concluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao simular operação");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          {tokenA}/{tokenB}
        </CardTitle>
        <CardDescription>
          Via {dexA} → {dexB}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {simulationResult && (
            <div className="mt-4 space-y-2 text-sm">
              <p>Quantidade Inicial: {simulationResult.initialAmount} {tokenA}</p>
              <p>Quantidade após Swap: {simulationResult.swapAmount} {tokenB}</p>
              <p>Lucro Esperado: {simulationResult.expectedProfit.toFixed(2)} USDC</p>
              <p className="text-xs text-muted-foreground">
                *Incluindo taxas do flashloan e slippage
              </p>
            </div>
          )}
          {prices[tokenA]?.length > 0 && (
            <>
              <h3 className="font-semibold mt-4">{tokenA} Price</h3>
              <PriceChart data={prices[tokenA]} token={tokenA} />
            </>
          )}
          {prices[tokenB]?.length > 0 && (
            <>
              <h3 className="font-semibold mt-4">{tokenB} Price</h3>
              <PriceChart data={prices[tokenB]} token={tokenB} />
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full bg-polygon-purple hover:bg-polygon-purple/90"
        >
          {isSimulating ? "Simulando..." : "Simular Flashloan"}
        </Button>
      </CardFooter>
    </Card>
  );
};