import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw';
  status: 'success' | 'failed';
  amount?: string;
  error?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
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
                <div>
                  <p className="text-sm font-medium">
                    {tx.type === 'execute' ? 'Arbitragem' : 'Retirada'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
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