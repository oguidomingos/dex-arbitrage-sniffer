import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, DollarSign, Zap } from "lucide-react";

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  expectedProfit?: number;
  gasEstimate?: string | null;
  bestRoute?: number;
  route1Profit?: number;
  route2Profit?: number;
  onProceed: () => void;
}

export const OpportunityDialog = ({
  open,
  onOpenChange,
  tokenA,
  tokenB,
  dexA,
  dexB,
  expectedProfit,
  gasEstimate,
  bestRoute,
  route1Profit,
  route2Profit,
  onProceed,
}: OpportunityDialogProps) => {
  const slippagePercentage = 0.5;
  const slippageCost = expectedProfit ? (expectedProfit * slippagePercentage) / 100 : 0;
  const estimatedNetProfit = expectedProfit ? expectedProfit - slippageCost : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] border-2 border-polygon-purple animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-polygon-purple flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Oportunidade de Arbitragem Detectada!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 mt-4">
              <div className="bg-black/20 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Melhor Rota
                  </span>
                  <span className="font-medium text-white">
                    {bestRoute === 1 ? `${dexA} → ${dexB}` : `${dexB} → ${dexA}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Par de Tokens</span>
                  <span className="font-medium text-white">{tokenA}/{tokenB}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rota 1 (Profit)</span>
                  <span className={`font-medium ${route1Profit && route1Profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {route1Profit?.toFixed(4)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rota 2 (Profit)</span>
                  <span className={`font-medium ${route2Profit && route2Profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {route2Profit?.toFixed(4)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Lucro Bruto Esperado
                  </span>
                  <span className="font-medium text-green-500">
                    +{expectedProfit?.toFixed(4)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Gas Fee (est.)</span>
                  <span className="font-medium text-red-400">
                    -{gasEstimate || '0.01'} MATIC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Slippage ({slippagePercentage}%)</span>
                  <span className="font-medium text-red-400">
                    -{slippageCost.toFixed(4)} USDC
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lucro Líquido (est.)</span>
                    <span className="font-medium text-green-500">
                      +{estimatedNetProfit.toFixed(4)} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onProceed}
            className="w-full bg-polygon-purple hover:bg-polygon-purple/90"
          >
            Executar Arbitragem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};