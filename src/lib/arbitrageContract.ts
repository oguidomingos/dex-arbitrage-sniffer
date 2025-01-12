import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos contratos na Polygon Mainnet
const ARBITRAGE_CONTRACT = "0x..."; // Endereço do contrato de arbitragem
const AAVE_LENDING_POOL = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf"; // Aave V3 na Polygon

const ARBITRAGE_ABI = [
  "function executeArbitrage(address tokenA, address tokenB, uint256 amount) external",
  "function withdrawProfit(address token) external",
  "function getExpectedReturn(address tokenA, address tokenB, uint256 amount) external view returns (uint256)",
];

export const executeRealArbitrage = async (
  tokenA: string,
  tokenB: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    const contract = new ethers.Contract(ARBITRAGE_CONTRACT, ARBITRAGE_ABI, signer);
    
    // Primeiro, simula o retorno esperado
    const expectedReturn = await contract.getExpectedReturn(tokenA, tokenB, ethers.parseEther(amount));
    
    // Se o retorno esperado for menor que o custo do gás + slippage, aborta
    if (expectedReturn.lt(ethers.parseEther('0.02'))) {
      toast.error("Retorno esperado muito baixo para cobrir custos");
      return false;
    }

    // Executa a arbitragem
    const tx = await contract.executeArbitrage(
      tokenA,
      tokenB,
      ethers.parseEther(amount),
      {
        gasLimit: 500000,
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
      }
    );

    await tx.wait();
    toast.success("Arbitragem executada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro na execução da arbitragem:", error);
    toast.error("Erro ao executar arbitragem");
    return false;
  }
};

export const withdrawArbitrageProfit = async (
  token: string,
  signer: ethers.Signer
) => {
  try {
    const contract = new ethers.Contract(ARBITRAGE_CONTRACT, ARBITRAGE_ABI, signer);
    const tx = await contract.withdrawProfit(token);
    await tx.wait();
    toast.success("Lucro retirado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    toast.error("Erro ao retirar lucro");
    return false;
  }
};