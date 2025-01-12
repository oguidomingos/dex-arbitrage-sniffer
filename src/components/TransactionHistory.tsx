import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionList } from "./TransactionList";
import { LogDisplay } from "./LogDisplay";
import { PriceChart } from "./PriceChart";

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    timestamp: number;
    type: 'execute' | 'withdraw' | 'simulation';
    status: 'success' | 'failed';
    amount?: string;
    error?: string;
    profitEstimate?: number;
  }>;
  prices: any;
  tokenA: string;
  tokenB: string;
  showLogs?: boolean;
}

export const TransactionHistory = ({
  transactions,
  prices,
  tokenA,
  tokenB,
  showLogs = true,
}: TransactionHistoryProps) => {
  return (
    <Card className="w-full bg-[#1A1F2C] border-2 border-polygon-purple/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TransactionList transactions={transactions} />
        {showLogs && <LogDisplay />}
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
      </CardContent>
    </Card>
  );
};