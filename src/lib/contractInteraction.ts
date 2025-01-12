import { ethers } from 'ethers';
import { toast } from 'sonner';

const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const MATIC_ADDRESS = "0x0000000000000000000000000000000000001010";
const ARBITRAGE_CONTRACT_ADDRESS = "0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827";

const ARBITRAGE_ABI = [
  "function requestFlashLoan(address token, uint256 amount, address tokenA, address tokenB) external",
  "function withdraw(address token) external"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const approveToken = async (
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
  signer: ethers.Signer
) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  try {
    const currentAllowance = await tokenContract.allowance(await signer.getAddress(), spenderAddress);
    
    if (currentAllowance < amount) {
      console.log('Aprovando token...');
      const approveTx = await tokenContract.approve(
        spenderAddress,
        ethers.MaxUint256,
        {
          value: ethers.parseEther("0.1"), // Paga fees em MATIC
          gasLimit: 100000n,
          maxFeePerGas: ethers.parseUnits('50', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
        }
      );
      await approveTx.wait(1);
      console.log('Token aprovado com sucesso!');
    } else {
      console.log('Token já possui aprovação suficiente');
    }
  } catch (error) {
    console.error('Erro ao aprovar token:', error);
    throw new Error('Falha na aprovação do token');
  }
};

export const executeArbitrage = async (
  tokenA: string,
  tokenB: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    const tokenAAddress = tokenA === 'MATIC' ? MATIC_ADDRESS : USDC_ADDRESS;
    const tokenBAddress = USDC_ADDRESS;

    if (!ethers.isAddress(ARBITRAGE_CONTRACT_ADDRESS)) {
      throw new Error("Endereço do contrato inválido");
    }

    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const amountInWei = ethers.parseUnits(amount, 6);

    console.log('Executing arbitrage with params:', {
      tokenAAddress,
      amountInWei: amountInWei.toString(),
      tokenBAddress,
      decimals: 6,
    });

    const tx = await contract.requestFlashLoan(
      tokenBAddress,
      amountInWei,
      tokenAAddress,
      tokenBAddress,
      { 
        value: ethers.parseEther("0.1"), // Paga fees em MATIC
        gasLimit: 200000n,
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
      }
    );

    await tx.wait(1);
    toast.success("Arbitragem executada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao executar arbitragem:", error);
    if (error instanceof Error) {
      toast.error(`Erro ao executar arbitragem: ${error.message}`);
    } else {
      toast.error("Erro ao executar arbitragem. Verifique o console para mais detalhes.");
    }
    return false;
  }
};

export const withdrawProfit = async (
  token: string,
  signer: ethers.Signer
) => {
  try {
    const tokenAddress = token === 'MATIC' ? MATIC_ADDRESS : USDC_ADDRESS;
    
    if (!ethers.isAddress(ARBITRAGE_CONTRACT_ADDRESS)) {
      throw new Error("Endereço do contrato inválido");
    }

    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tx = await contract.withdraw(tokenAddress, { 
      value: ethers.parseEther("0.1"), // Paga fees em MATIC
      gasLimit: 150000n,
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
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