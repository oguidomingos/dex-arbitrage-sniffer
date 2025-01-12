import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { PiggyBank, RefreshCcw } from "lucide-react";

interface ArbitrageActionsProps {
  isSimulating: boolean;
  isPaused: boolean;
  onSimulate: () => void;
  onWithdraw: () => void;
}

export const ArbitrageActions = ({
  isSimulating,
  isPaused,
  onSimulate,
  onWithdraw,
}: ArbitrageActionsProps) => {
  return (
    <CardFooter className="flex gap-2">
      <Button 
        onClick={onSimulate}
        disabled={isSimulating || isPaused}
        className="flex-1 bg-polygon-purple hover:bg-polygon-purple/90 transition-colors"
      >
        <RefreshCcw className={`h-4 w-4 mr-2 ${isSimulating ? 'animate-spin' : ''}`} />
        {isSimulating ? "Simulando..." : "Simular"}
      </Button>
      <Button 
        onClick={onWithdraw}
        className="flex-1 bg-green-600 hover:bg-green-700 transition-colors"
      >
        <PiggyBank className="h-4 w-4 mr-2" />
        Retirar Lucro
      </Button>
    </CardFooter>
  );
};