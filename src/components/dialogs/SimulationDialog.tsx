import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, DollarSign, TrendingUp, Check } from "lucide-react";

interface SimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationResult: any;
  onExecute: () => void;
  isExecuting: boolean;
}

export const SimulationDialog = ({
  open,
  onOpenChange,
  simulationResult,
  onExecute,
  isExecuting,
}: SimulationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
            <Check className="h-6 w-6" />
            Simulação Concluída
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
              <Button 
                onClick={onExecute}
                disabled={isExecuting}
                className="w-full bg-polygon-purple hover:bg-polygon-purple/90"
              >
                {isExecuting ? "Executando..." : "Executar Arbitragem"}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};