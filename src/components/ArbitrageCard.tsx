import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateFlashloan } from "@/lib/flashloan";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PriceChart } from "./PriceChart";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ArrowRightLeft, Wallet } from "lucide-react";

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

    updateSimulation();
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
    <Card className="w-full bg-gradient-to-br from-background to-muted/50 border-2 hover:border-polygon-purple/50 transition-all duration-300">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-polygon-purple flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {tokenA}/{tokenB}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{dexA}</span>
            <ArrowRightLeft className="h-4 w-4 text-polygon-purple" />
            <span>{dexB}</span>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Arbitragem entre pools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {simulationResult && (
            <div className="space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Entrada</span>
                  <span className="font-medium">{simulationResult.initialAmount} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantidade Final Esperada</span>
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
              <PriceChart data={prices[tokenA]} token={tokenA} />
            </div>
          )}
          {prices[tokenB]?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">{tokenB} Price</h3>
              <PriceChart data={prices[tokenB]} token={tokenB} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full bg-polygon-purple hover:bg-polygon-purple/90 transition-colors"
        >
          {isSimulating ? "Simulando..." : "Simular Flashloan"}
        </Button>
      </CardFooter>
    </Card>
  );
};