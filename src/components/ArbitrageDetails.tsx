import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightLeft, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface ArbitrageDetailsProps {
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  priceA?: number;
  priceB?: number;
  priceDiff?: number;
  percentDiff?: number;
  flashloanAmount?: number;
  flashloanFee?: number;
  gasCost?: number;
  expectedProfit?: number;
  isLoading: boolean;
}

export const ArbitrageDetails = ({
  tokenA,
  tokenB,
  dexA,
  dexB,
  priceA,
  priceB,
  priceDiff,
  percentDiff,
  flashloanAmount,
  flashloanFee,
  gasCost,
  expectedProfit,
  isLoading,
}: ArbitrageDetailsProps) => {
  return (
    <Card className="w-full bg-[#1A1F2C] border-2 border-polygon-purple/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Detalhes da Operação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] rounded-md">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground animate-pulse">
                Carregando dados...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Preços</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground">{dexA}</div>
                      <div className="text-lg font-medium">
                        {priceA?.toFixed(6) || "0.00"} USDC
                      </div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground">{dexB}</div>
                      <div className="text-lg font-medium">
                        {priceB?.toFixed(6) || "0.00"} USDC
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Diferença</h3>
                  <div className="bg-black/20 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Absoluta</span>
                      <span className="font-medium">{priceDiff?.toFixed(6) || "0.00"} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Percentual</span>
                      <span className="font-medium">{percentDiff?.toFixed(2) || "0.00"}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Custos</h3>
                  <div className="bg-black/20 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Flashloan</span>
                      <span className="font-medium">{flashloanAmount?.toFixed(2) || "0.00"} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa Flashloan (0.09%)</span>
                      <span className="font-medium text-red-400">-{flashloanFee?.toFixed(4) || "0.00"} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gas (est.)</span>
                      <span className="font-medium text-red-400">-{gasCost?.toFixed(4) || "0.00"} MATIC</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Lucro Estimado</span>
                    <span className={`text-lg font-medium ${expectedProfit && expectedProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {expectedProfit ? (expectedProfit > 0 ? '+' : '') + expectedProfit.toFixed(4) : "0.00"} USDC
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};