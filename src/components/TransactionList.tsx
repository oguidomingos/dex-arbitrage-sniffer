import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, TrendingUp, ArrowRightLeft, PiggyBank, Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw' | 'simulation';
  status: 'success' | 'failed' | 'pending';
  amount?: string;
  error?: string;
  profitEstimate?: number;
  txHash?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTxClick?: (txHash: string) => void;
}

export const TransactionList = ({ transactions, onTxClick }: TransactionListProps) => {
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

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
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
              onClick={() => tx.txHash && onTxClick?.(tx.txHash)}
              role={tx.txHash ? "button" : undefined}
              style={{ cursor: tx.txHash ? 'pointer' : 'default' }}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(tx.status)}
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
                {tx.txHash && (
                  <p className="text-xs text-blue-400 hover:underline">
                    Ver transação
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