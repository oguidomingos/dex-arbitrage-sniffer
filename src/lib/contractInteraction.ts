import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos tokens na rede Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

const ARBITRAGE_CONTRACT_ADDRESS = "0x123..."; // Substitua pelo endereço real do seu contrato após o deploy

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
    // Converte os símbolos dos tokens para endereços reais
    const tokenAAddress = tokenA === 'USDC' ? USDC_ADDRESS : WETH_ADDRESS;
    const tokenBAddress = tokenB === 'USDC' ? USDC_ADDRESS : WETH_ADDRESS;

    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    console.log('Executing arbitrage with params:', {
      tokenAAddress,
      tokenBAddress,
      amount
    });

    const tx = await contract.requestFlashLoan(
      tokenAAddress,
      ethers.parseUnits(amount, tokenA === 'USDC' ? 6 : 18),
      tokenAAddress,
      tokenBAddress,
      { gasLimit: 3000000 } // Adiciona um limite de gas explícito
    );

    await tx.wait();
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
    
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tx = await contract.withdraw(tokenAddress, { gasLimit: 1000000 });
    await tx.wait();
    toast.success("Lucro retirado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    toast.error("Erro ao retirar lucro. Verifique o console para mais detalhes.");
    return false;
  }
};