import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos tokens na rede Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const MATIC_ADDRESS = "0x0000000000000000000000000000000000001010";

// Endereço do contrato de arbitragem na Polygon
const ARBITRAGE_CONTRACT_ADDRESS = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5";

const ARBITRAGE_ABI = [
  "function requestFlashLoan(address token, uint256 amount, address tokenA, address tokenB) external",
  "function withdraw(address token) external",
  "function withdrawProfit(address token) external"
];

export const executeRealArbitrage = async (
  tokenA: string,
  tokenB: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const amountInWei = ethers.parseUnits(amount, 6);
    
    console.log('Executing arbitrage with params:', {
      tokenA,
      tokenB,
      amount: amountInWei.toString()
    });

    const tx = await contract.requestFlashLoan(
      USDC_ADDRESS,
      amountInWei,
      tokenA === 'MATIC' ? MATIC_ADDRESS : tokenA,
      tokenB === 'MATIC' ? MATIC_ADDRESS : tokenB,
      { 
        gasLimit: 200000n,
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
      }
    );

    await tx.wait(1);
    return true;
  } catch (error) {
    console.error("Erro ao executar arbitragem:", error);
    throw error;
  }
};

export const withdrawProfit = async (
  token: string,
  signer: ethers.Signer
): Promise<string> => {
  try {
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tokenAddress = token === 'MATIC' ? MATIC_ADDRESS : USDC_ADDRESS;

    const tx = await contract.withdrawProfit(tokenAddress, { 
      gasLimit: 150000n,
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
    });
    
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    throw error;
  }
};