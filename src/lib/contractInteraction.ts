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
      console.log('Aprovando token com aprovação infinita...');
      const approveTx = await tokenContract.approve(
        spenderAddress,
        ethers.MaxUint256, // Aprovação infinita
        {
          gasLimit: 100000n,
          maxFeePerGas: ethers.parseUnits('500', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      );
      await approveTx.wait(1);
      console.log('Token aprovado com sucesso! (aprovação infinita)');
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

    // Aprova o token antes da operação
    await approveToken(tokenAAddress, ARBITRAGE_CONTRACT_ADDRESS, amountInWei, signer);

    console.log('Executing arbitrage with params:', {
      tokenAAddress,
      tokenBAddress,
      amountInWei: amountInWei.toString(),
      decimals,
    });

    const tx = await contract.requestFlashLoan(
      tokenAAddress,
      amountInWei,
      tokenAAddress,
      tokenBAddress,
      { 
        gasLimit: 5000000n,
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      }
    );

    await tx.wait(1);
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

    const tx = await contract.withdraw(tokenAddress, { 
      gasLimit: 500000n,
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
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
