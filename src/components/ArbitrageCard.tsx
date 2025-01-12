import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { simulateFlashloan } from "@/lib/flashloan";
import { useState } from "react";
import { toast } from "sonner";

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
          <p className="text-sm">Lucro Estimado: {profit}%</p>
          {simulationResult && (
            <div className="mt-4 space-y-2 text-sm">
              <p>Entrada Inicial: {simulationResult.initialAmount} USDC</p>
              <p>Valor do Flashloan: {simulationResult.flashloanAmount} USDC</p>
              <p>Lucro Esperado: {simulationResult.expectedProfit.toFixed(2)} USDC</p>
              <p className="text-xs text-muted-foreground">
                *Incluindo taxas do flashloan e slippage
              </p>
            </div>
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