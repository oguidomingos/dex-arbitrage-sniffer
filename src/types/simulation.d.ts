export interface SimulationRecord {
  id: string;
  timestamp: number;
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  expectedProfit: number;
  status: 'success' | 'failed';
  error?: string;
}