import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface SimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationResult: any;
  isExecuting: boolean;
}

export const SimulationDialog = ({
  open,
  onOpenChange,
  simulationResult,
  isExecuting,
}: SimulationDialogProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setProgress(0);
      const duration = 3000; // 3 seconds
      const interval = 10; // Update every 10ms
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
            <Check className="h-6 w-6" />
            Oportunidade Detectada
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
                  <span className="text-muted-foreground">Lucro Esperado</span>
                  <span className="font-medium text-green-500">
                    +{simulationResult?.expectedProfit?.toFixed(2)} USDC
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Executando em {((100 - progress) * 0.03).toFixed(1)}s
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};