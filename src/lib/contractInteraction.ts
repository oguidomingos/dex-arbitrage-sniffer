import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos tokens na rede Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

// Endereço do contrato de arbitragem na Polygon
const ARBITRAGE_CONTRACT_ADDRESS = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5";

const ARBITRAGE_ABI = [
  "function requestFlashLoan(address token, uint256 amount, address tokenA, address tokenB) external",
  "function withdraw(address token) external"
];

export const executeArbitrage = async (
  tokenA: string,
  tokenB: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    const tokenAAddress = tokenA === 'USDC' ? USDC_ADDRESS : WETH_ADDRESS;
    const tokenBAddress = tokenB === 'USDC' ? USDC_ADDRESS : WETH_ADDRESS;

    if (!ethers.isAddress(ARBITRAGE_CONTRACT_ADDRESS)) {
      throw new Error("Endereço do contrato inválido");
    }

    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const decimals = tokenA === 'USDC' ? 6 : 18;
    const amountInWei = ethers.parseUnits(amount, decimals);

    // Configurações agressivas de gás
    const gasPrice = await signer.provider?.getFeeData();
    const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas ?? ethers.parseUnits('100', 'gwei');
    const maxFeePerGas = gasPrice?.maxFeePerGas ?? ethers.parseUnits('200', 'gwei');

    console.log('Executing arbitrage with params:', {
      tokenAAddress,
      tokenBAddress,
      amountInWei: amountInWei.toString(),
      decimals,
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString()
    });

    const tx = await contract.requestFlashLoan(
      tokenAAddress,
      amountInWei,
      tokenAAddress,
      tokenBAddress,
      { 
        maxFeePerGas: maxFeePerGas.mul(2), // Dobra o gas fee máximo
        maxPriorityFeePerGas: maxPriorityFeePerGas.mul(2), // Dobra a prioridade
        gasLimit: 5000000, // Aumenta o limite de gás
      }
    );

    await tx.wait(1); // Espera apenas 1 confirmação para ser mais rápido
    toast.success("Arbitragem executada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao executar arbitragem:", error);
    toast.error("Erro ao executar arbitragem. Verifique o console para mais detalhes.");
    return false;
  }
};

export const withdrawProfit = async (
  token: string,
  signer: ethers.Signer
) => {
  try {
    const tokenAddress = token === 'USDC' ? USDC_ADDRESS : WETH_ADDRESS;
    
    if (!ethers.isAddress(ARBITRAGE_CONTRACT_ADDRESS)) {
      throw new Error("Endereço do contrato inválido");
    }

    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    // Configurações agressivas de gás para retirada
    const gasPrice = await signer.provider?.getFeeData();
    const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas ?? ethers.parseUnits('100', 'gwei');
    const maxFeePerGas = gasPrice?.maxFeePerGas ?? ethers.parseUnits('200', 'gwei');

    const tx = await contract.withdraw(tokenAddress, { 
      maxFeePerGas: maxFeePerGas.mul(2),
      maxPriorityFeePerGas: maxPriorityFeePerGas.mul(2),
      gasLimit: 2000000,
    });
    
    await tx.wait(1);
    toast.success("Lucro retirado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    toast.error("Erro ao retirar lucro. Verifique o console para mais detalhes.");
    return false;
  }
};