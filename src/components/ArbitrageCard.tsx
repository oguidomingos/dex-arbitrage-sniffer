import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ArbitrageCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
}

export const ArbitrageCard = ({ tokenA, tokenB, profit, dexA, dexB }: ArbitrageCardProps) => {
  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {tokenA}/{tokenB}
        </CardTitle>
        <Badge variant={profit > 0 ? "default" : "secondary"}>
          {profit.toFixed(2)}% Profit
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Buy on: {dexA}</p>
          <p>Sell on: {dexB}</p>
        </div>
      </CardContent>
    </Card>
  );
};