import { Card } from "@/components/ui/card";
import { TrendingUp, ArrowRightLeft } from "lucide-react";

interface PoolProfitCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
}

export const PoolProfitCard = ({ tokenA, tokenB, profit, dexA, dexB }: PoolProfitCardProps) => {
  return (
    <Card className="bg-[#1A1F2C] border-2 border-polygon-purple/20 hover:border-polygon-purple/50 transition-all duration-300 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-polygon-purple" />
          <span className="font-medium">
            {tokenA}/{tokenB}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded-full flex items-center gap-1">
            <span>{dexA}</span>
            <ArrowRightLeft className="h-3 w-3 text-polygon-purple" />
            <span>{dexB}</span>
          </div>
          <div className="text-xs font-medium text-green-500">
            +{profit.toFixed(2)}%
          </div>
        </div>
      </div>
    </Card>
  );
};