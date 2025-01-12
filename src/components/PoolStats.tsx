import { usePoolData } from "@/hooks/usePoolData";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Activity, DollarSign, Clock, TrendingUp } from "lucide-react";

interface PoolStatsProps {
  dex: string;
  tokenA: string;
  tokenB: string;
}

export const PoolStats = ({ dex, tokenA, tokenB }: PoolStatsProps) => {
  const poolData = usePoolData(dex, tokenA, tokenB);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Pool Stats ({dex})</h3>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-black/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Liquidity</span>
          </div>
          {poolData.liquidity > 0 ? (
            <span className="text-lg font-medium">
              {formatCurrency(poolData.liquidity)}
            </span>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </Card>

        <Card className="p-4 bg-black/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Volume (24h)</span>
          </div>
          {poolData.volume['24h'] > 0 ? (
            <span className="text-lg font-medium">
              {formatCurrency(poolData.volume['24h'])}
            </span>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </Card>
      </div>

      <Card className="p-4 bg-black/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Volume por Período</span>
        </div>
        <div className="space-y-3">
          {Object.entries(poolData.volume).map(([period, volume]) => (
            <div key={period} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {period === '10m' ? '10 minutos' :
                 period === '1h' ? '1 hora' :
                 period === '6h' ? '6 horas' : '24 horas'}
              </span>
              {volume > 0 ? (
                <span className="font-medium">{formatCurrency(volume)}</span>
              ) : (
                <Skeleton className="h-4 w-20" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Última atualização: {new Date(poolData.lastUpdate * 1000).toLocaleTimeString()}
        </div>
      </Card>
    </div>
  );
};