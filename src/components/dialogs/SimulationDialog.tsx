import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Check, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface SimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationResult: any;
  isExecuting: boolean;
  gasEstimate: string | null;
}

export const SimulationDialog = ({
  open,
  onOpenChange,
  simulationResult,
  isExecuting,
  gasEstimate,
}: SimulationDialogProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setProgress(0);
      const duration = 3000;
      const interval = 10;
      const step = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + step;
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(() => onOpenChange(false), 100);
            return 100;
          }
          return next;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [open, onOpenChange]);

  const calculateNetProfit = () => {
    if (!simulationResult?.expectedProfit) return 0;
    
    const gasCost = gasEstimate ? parseFloat(gasEstimate) : 0.01;
    const slippageCost = simulationResult.initialAmount * 0.005; // 0.5% slippage
    return simulationResult.expectedProfit - gasCost - slippageCost;
  };

  const netProfit = calculateNetProfit();
  const isProfitable = netProfit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
            {isProfitable ? (
              <Check className="h-6 w-6 text-green-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
            {isProfitable ? "Oportunidade Detectada" : "Simulação Concluída"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 mt-4">
              <div className="bg-black/20 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="font-medium text-white">
                    {simulationResult?.initialAmount} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantidade Final</span>
                  <span className="font-medium text-polygon-purple">
                    {(simulationResult?.initialAmount + simulationResult?.expectedProfit).toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lucro Bruto</span>
                  <span className="font-medium text-green-500">
                    +{simulationResult?.expectedProfit?.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Custo de Gas (est.)</span>
                  <span className="font-medium text-red-400">
                    -{gasEstimate || '0.01'} MATIC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Slippage (0.5%)</span>
                  <span className="font-medium text-red-400">
                    -{(simulationResult?.initialAmount * 0.005).toFixed(4)} USDC
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lucro Líquido</span>
                    <span className={`font-medium ${netProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {netProfit > 0 ? '+' : ''}{netProfit.toFixed(4)} USDC
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {isExecuting ? 'Executando' : `Executando em ${((100 - progress) * 0.03).toFixed(1)}s`}
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};