import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowRightLeft, DollarSign, TrendingUp } from "lucide-react";

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  expectedProfit?: number;
}

export const OpportunityDialog = ({
  open,
  onOpenChange,
  tokenA,
  tokenB,
  dexA,
  dexB,
  expectedProfit,
}: OpportunityDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Oportunidade de Arbitragem Detectada!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 mt-4">
              <div className="bg-black/20 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Par de Tokens
                  </span>
                  <span className="font-medium text-white">{tokenA}/{tokenB}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Lucro Esperado
                  </span>
                  <span className="font-medium text-green-500">
                    +{expectedProfit?.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">DEXs</span>
                  <span className="font-medium text-white">{dexA} ↔ {dexB}</span>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};