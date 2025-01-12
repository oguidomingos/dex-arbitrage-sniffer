import { Button } from "@/components/ui/button";
import { validateTestnetSetup, getTestTokens } from "@/lib/testnet";
import { useState } from "react";
import { toast } from "sonner";

export const TestnetSetup = () => {
  const [isValidating, setIsValidating] = useState(false);

  const handleTestnetSetup = async () => {
    setIsValidating(true);
    try {
      const isValid = await validateTestnetSetup();
      if (isValid) {
        await getTestTokens();
      }
    } catch (error) {
      console.error("Erro na configuração da testnet:", error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Configuração Testnet</h3>
      <p className="text-sm text-muted-foreground">
        Configure seu ambiente de teste na rede Mumbai (Polygon Testnet)
      </p>
      <Button
        onClick={handleTestnetSetup}
        disabled={isValidating}
        className="w-full bg-polygon-purple hover:bg-polygon-purple/90"
      >
        {isValidating ? "Validando..." : "Configurar Testnet"}
      </Button>
      <div className="text-xs text-muted-foreground">
        <p>Requisitos:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>MetaMask instalado</li>
          <li>Rede Mumbai configurada</li>
          <li>MATIC de teste (mínimo 0.1)</li>
          <li>USDC de teste para operações</li>
        </ul>
      </div>
    </div>
  );
};