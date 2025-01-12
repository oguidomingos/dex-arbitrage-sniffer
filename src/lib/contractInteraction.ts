import { ethers } from 'ethers';
import { toast } from 'sonner';

const ARBITRAGE_CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
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
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tx = await contract.requestFlashLoan(
      tokenA,
      ethers.parseUnits(amount, 18),
      tokenA,
      tokenB
    );

    await tx.wait();
    toast.success("Arbitrage executado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao executar arbitragem:", error);
    toast.error("Erro ao executar arbitragem");
    return false;
  }
};

export const withdrawProfit = async (
  token: string,
  signer: ethers.Signer
) => {
  try {
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tx = await contract.withdraw(token);
    await tx.wait();
    toast.success("Lucro retirado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    toast.error("Erro ao retirar lucro");
    return false;
  }
};