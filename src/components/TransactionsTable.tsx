import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, ArrowRightLeft, PiggyBank } from "lucide-react";

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw' | 'simulation';
  status: 'success' | 'failed';
  amount?: string;
  error?: string;
  profitEstimate?: number;
  tokenA?: string;
  tokenB?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
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
    <div className="rounded-lg border border-polygon-purple/20 bg-[#1A1F2C]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Lucro Estimado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getIcon(tx.type)}
                  <span>{getTypeLabel(tx.type)}</span>
                </div>
              </TableCell>
              <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                {tx.tokenA && tx.tokenB ? `${tx.tokenA}/${tx.tokenB}` : '-'}
              </TableCell>
              <TableCell>
                <span className={tx.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {tx.status === 'success' ? 'Sucesso' : 'Falha'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {tx.profitEstimate ? (
                  <span className="text-green-500">+{tx.profitEstimate.toFixed(2)} USDC</span>
                ) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};