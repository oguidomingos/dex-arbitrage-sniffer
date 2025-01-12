import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, TrendingUp, ArrowRightLeft, PiggyBank } from "lucide-react";

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw' | 'simulation';
  status: 'success' | 'failed';
  amount?: string;
  error?: string;
  profitEstimate?: number;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'execute':
        return <ArrowRightLeft className="h-4 w-4 text-polygon-purple" />;
      case 'withdraw':
        return <PiggyBank className="h-4 w-4 text-green-500" />;
      case 'simulation':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'execute':
        return 'Arbitragem';
      case 'withdraw':
        return 'Retirada';
      case 'simulation':
        return 'Simulação';
    }
  };

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      {transactions.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Nenhuma transação realizada
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-black/20"
            >
              <div className="flex items-center gap-2">
                {tx.status === 'success' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <div className="flex items-center gap-2">
                  {getIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium">
                      {getTypeLabel(tx.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {tx.profitEstimate && (
                  <p className="text-sm font-medium text-green-500">
                    +{tx.profitEstimate.toFixed(2)} USDC
                  </p>
                )}
                {tx.amount && (
                  <p className="text-sm font-medium">
                    {tx.amount} USDC
                  </p>
                )}
                {tx.error && (
                  <p className="text-xs text-red-400">
                    {tx.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
};