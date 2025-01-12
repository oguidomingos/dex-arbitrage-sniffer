import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, TrendingUp } from "lucide-react";
import type { SimulationRecord } from "@/types/simulation";

interface OperationsHistoryProps {
  simulations: SimulationRecord[];
}

export const OperationsHistory = ({ simulations }: OperationsHistoryProps) => {
  return (
    <Card className="w-full bg-black/20">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Histórico de Simulações</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full pr-4">
          {simulations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma simulação registrada
            </div>
          ) : (
            <div className="space-y-4">
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-black/20 rounded-lg p-4 border border-polygon-purple/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-polygon-purple" />
                      <span className="font-medium">
                        {sim.tokenA}/{sim.tokenB}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sim.status === 'success' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${
                          sim.status === 'success' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {sim.status === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">DEX Origem</p>
                      <p className="font-medium">{sim.dexA}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DEX Destino</p>
                      <p className="font-medium">{sim.dexB}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lucro Esperado</p>
                      <p className="font-medium text-green-500">
                        +{sim.expectedProfit.toFixed(4)} USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {new Date(sim.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {sim.error && (
                    <p className="mt-2 text-sm text-red-400">{sim.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};