import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRightLeft, DollarSign, TrendingUp } from "lucide-react";

interface ArbitrageMetricsProps {
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

export const ArbitrageMetrics = ({
  priceA,
  priceB,
  priceDiff,
  percentDiff,
  flashloanAmount,
  flashloanFee,
  gasCost,
  expectedProfit,
  isLoading,
}: ArbitrageMetricsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
        Carregando dados...
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
        {/* Preços Card */}
        <div className="bg-black/10 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Preços
          </h3>
          <div className="space-y-3">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Token A</div>
              <div className="text-lg font-medium">
                {priceA?.toFixed(6) || "0.00"} USDC
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Token B</div>
              <div className="text-lg font-medium">
                {priceB?.toFixed(6) || "0.00"} USDC
              </div>
            </div>
          </div>
        </div>

        {/* Diferença Card */}
        <div className="bg-black/10 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Diferença
          </h3>
          <div className="space-y-3">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Absoluta</span>
                <span className="font-medium">{priceDiff?.toFixed(6) || "0.00"} USDC</span>
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Percentual</span>
                <span className="font-medium">{percentDiff?.toFixed(2) || "0.00"}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custos Card */}
        <div className="bg-black/10 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Custos
          </h3>
          <div className="space-y-3">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Flashloan</span>
                <span className="font-medium">{flashloanAmount?.toFixed(2) || "0.00"} USDC</span>
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa (0.09%)</span>
                <span className="font-medium text-red-400">-{flashloanFee?.toFixed(4) || "0.00"} USDC</span>
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gas (est.)</span>
                <span className="font-medium text-red-400">-{gasCost?.toFixed(4) || "0.00"} MATIC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lucro Estimado Card - Full Width */}
        <div className="md:col-span-2 lg:col-span-3 bg-black/10 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Lucro Estimado</span>
            <span className={`text-lg font-medium ${expectedProfit && expectedProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {expectedProfit ? (expectedProfit > 0 ? '+' : '') + expectedProfit.toFixed(4) : "0.00"} USDC
            </span>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};