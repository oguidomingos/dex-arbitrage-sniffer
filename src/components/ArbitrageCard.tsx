import { simulateFlashloan } from "@/lib/flashloan";
import { executeRealArbitrage, withdrawProfit } from "@/lib/arbitrageContract";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { ethers } from "ethers";
import { SimulationDialog } from "./dialogs/SimulationDialog";
import { ArbitrageDisplay } from "./ArbitrageDisplay";
import { validateArbitrageParameters } from "@/lib/validation";
import { OpportunityDialog } from "./dialogs/OpportunityDialog";

interface ArbitrageCardProps {
  tokenA: string;
  tokenB: string;
  profit: number;
  dexA: string;
  dexB: string;
  isPaused: boolean;
  onSimulationComplete?: (simulation: SimulationRecord) => void;
}

interface Transaction {
  id: string;
  timestamp: number;
  type: 'execute' | 'withdraw' | 'simulation';
  status: 'success' | 'failed' | 'pending';
  amount?: string;
  error?: string;
  profitEstimate?: number;
  txHash?: string;
}

const ARBITRAGE_CONTRACT_ADDRESS = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5";
const POL_TOKEN_ADDRESS = "0x455E53CBB86018Ac2B8092FdCd39d8444aFFC3F6";
const POL_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export const ArbitrageCard = ({ 
  tokenA, 
  tokenB, 
  profit, 
  dexA, 
  dexB, 
  isPaused,
  onSimulationComplete 
}: ArbitrageCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const [estimatedProfit, setEstimatedProfit] = useState<number | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<string>("0");
  const prices = useTokenPrices([tokenA, tokenB]);
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const checkContractBalance = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(ARBITRAGE_CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error checking contract balance:", error);
    }
  };

  const checkPolBalance = async () => {
    if (!window.ethereum) return "0";
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length === 0) return "0";
      
      const polContract = new ethers.Contract(POL_TOKEN_ADDRESS, POL_ABI, provider);
      const balance = await polContract.balanceOf(accounts[0]);
      const decimals = await polContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Erro ao verificar saldo de POL:", error);
      return "0";
    }
  };

  const isOpportunityProfitable = (result: any): boolean => {
    if (!result || !result.expectedProfit) return false;
    const minProfitThreshold = 0.01;
    return result.expectedProfit > minProfitThreshold;
  };

  const addTransaction = (
    type: 'execute' | 'withdraw' | 'simulation',
    status: 'success' | 'failed' | 'pending',
    txHash?: string,
    amount?: string,
    error?: string,
    profitEstimate?: number
  ) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      status,
      amount,
      error,
      profitEstimate,
      txHash
    };
    setTransactions(prev => [newTransaction, ...prev].slice(0, 10));
  };

  const executeArbitrage = async (result: any) => {
    if (isProcessingRef.current) {
      console.log('Já existe uma execução em andamento, ignorando...');
      return;
    }

    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    const polBalance = await checkPolBalance();
    if (parseFloat(polBalance) < 0.1) {
      toast.error("Saldo de POL insuficiente. Mínimo necessário: 0.1 POL");
      return;
    }

    try {
      isProcessingRef.current = true;
      setIsExecuting(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log("Iniciando execução da arbitragem:", {
        tokenA,
        tokenB,
        amount: result.initialAmount
      });

      addTransaction('execute', 'pending');

      const success = await executeRealArbitrage(
        tokenA,
        tokenB,
        result.initialAmount.toString(),
        signer
      );

      if (success) {
        addTransaction('execute', 'success', undefined, result.initialAmount.toString(), undefined, result.expectedProfit);
        toast.success("Arbitragem executada com sucesso!");
      } else {
        throw new Error("Falha na execução da arbitragem");
      }
    } catch (error) {
      console.error("Erro na execução:", error);
      addTransaction('execute', 'failed', undefined, undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao executar arbitragem", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsExecuting(false);
      setShowSimulationDialog(false);
      isProcessingRef.current = false;
    }
  };

  const handleWithdrawProfit = async () => {
    if (isProcessingRef.current) {
      console.log('Já existe uma operação em andamento, ignorando...');
      return;
    }

    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    try {
      isProcessingRef.current = true;
      console.log("Iniciando retirada de lucro para token:", tokenA);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const txHash = await withdrawProfit(tokenA, signer);
      console.log("Hash da transação de retirada:", txHash);
      
      addTransaction('withdraw', 'pending', txHash);
      
      const receipt = await provider.waitForTransaction(txHash);
      console.log("Recibo da transação:", receipt);
      
      if (receipt.status === 1) {
        addTransaction('withdraw', 'success', txHash);
        toast.success("Lucro retirado com sucesso!");
      } else {
        throw new Error("Transação falhou");
      }
    } catch (error) {
      console.error("Erro ao retirar lucro:", error);
      addTransaction('withdraw', 'failed', undefined, undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao retirar lucro", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleSimulationResult = async (result: any) => {
    if (result && result.expectedProfit > 0) {
      setEstimatedProfit(result.expectedProfit);
      
      addTransaction('simulation', 'success', undefined, undefined, undefined, result.expectedProfit);
      
      console.log('Taxas da operação:', {
        flashloanFee: result.flashloanFee,
        gasCost: result.gasCost,
        slippage: result.expectedProfit * 0.005 // 0.5% slippage
      });
      
      if (result.expectedProfit > 0.01) {
        setShowOpportunityDialog(true);
      }
    }
  };

  const handleSimulate = async () => {
    if (isProcessingRef.current) {
      console.log('Já existe uma simulação em andamento, ignorando...');
      return;
    }

    if (isPaused) {
      toast.error("Scanner está pausado");
      return;
    }

    if (!window.ethereum) {
      toast.error("Por favor, instale a MetaMask");
      return;
    }

    try {
      isProcessingRef.current = true;
      setIsSimulating(true);
      toast.info("Iniciando simulação...");
      
      console.log("Iniciando simulação para:", { tokenA, tokenB, dexA, dexB });
      const validationError = validateArbitrageParameters(tokenA, tokenB, dexA, dexB);
      if (validationError) {
        throw new Error(validationError);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts.length === 0) {
        throw new Error("Por favor, conecte sua carteira MetaMask");
      }

      const balance = await provider.getBalance(accounts[0]);
      const maticBalance = parseFloat(ethers.formatEther(balance));
      
      if (maticBalance < 0.1) {
        throw new Error("Saldo de MATIC insuficiente. Mínimo necessário: 0.1 MATIC");
      }

      console.log("Iniciando simulação de flashloan...");
      const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
      console.log("Resultado da simulação:", result);
      
      setSimulationResult(result);
      setShowSimulationDialog(true);
      
      await handleSimulationResult(result);

      // Registrar a simulação no histórico
      if (onSimulationComplete) {
        onSimulationComplete({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          tokenA,
          tokenB,
          dexA,
          dexB,
          expectedProfit: result.expectedProfit || 0,
          status: result.expectedProfit > 0 ? 'success' : 'failed'
        });
      }
    } catch (error) {
      console.error("Erro na simulação:", error);
      addTransaction('simulation', 'failed', undefined, undefined, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao simular operação", {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      // Registrar a simulação com erro
      if (onSimulationComplete) {
        onSimulationComplete({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          tokenA,
          tokenB,
          dexA,
          dexB,
          expectedProfit: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    } finally {
      setIsSimulating(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    checkContractBalance();
    const interval = setInterval(checkContractBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateSimulation = async () => {
      if (isPaused || isProcessingRef.current) return;
      
      const currentTime = Date.now();
      const oneMinute = 60000;
      
      if (currentTime - lastExecutionTime < oneMinute) {
        return;
      }

      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }

      simulationTimeoutRef.current = setTimeout(async () => {
        try {
          isProcessingRef.current = true;
          const validationError = validateArbitrageParameters(tokenA, tokenB, dexA, dexB);
          if (validationError) {
            console.error("Validation error:", validationError);
            return;
          }

          const polBalance = await checkPolBalance();
          if (parseFloat(polBalance) < 0.1) {
            console.log("Saldo de POL insuficiente para simulação");
            return;
          }

          const result = await simulateFlashloan(1, tokenA, tokenB, dexA, dexB);
          if (!isProcessingRef.current) return;
          
          setSimulationResult(result);
          await handleSimulationResult(result);
          
        } catch (error) {
          console.error("Erro na simulação:", error);
          setEstimatedProfit(null);
        } finally {
          isProcessingRef.current = false;
        }
      }, 1000);
    };

    updateSimulation();
    return () => {
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, [tokenA, tokenB, dexA, dexB, isPaused, lastExecutionTime]);

  return (
    <>
      <OpportunityDialog
        open={showOpportunityDialog}
        onOpenChange={setShowOpportunityDialog}
        tokenA={tokenA}
        tokenB={tokenB}
        dexA={dexA}
        dexB={dexB}
        expectedProfit={simulationResult?.expectedProfit}
        gasEstimate={gasEstimate}
        onProceed={() => {
          setShowOpportunityDialog(false);
          executeArbitrage(simulationResult);
        }}
      />

      <SimulationDialog
        open={showSimulationDialog}
        onOpenChange={setShowSimulationDialog}
        simulationResult={simulationResult}
        isExecuting={isExecuting}
        gasEstimate={gasEstimate}
        onExecute={() => executeArbitrage(simulationResult)}
      />

      <ArbitrageDisplay
        tokenA={tokenA}
        tokenB={tokenB}
        dexA={dexA}
        dexB={dexB}
        profit={profit}
        isPaused={isPaused}
        transactions={transactions}
        prices={prices}
        estimatedProfit={estimatedProfit}
        isSimulating={isSimulating}
        isExecuting={isExecuting}
        onSimulate={handleSimulate}
        onWithdraw={handleWithdrawProfit}
        simulationResult={simulationResult}
      />
    </>
  );
};
