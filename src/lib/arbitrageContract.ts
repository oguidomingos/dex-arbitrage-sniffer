import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos tokens na rede Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const MATIC_ADDRESS = "0x0000000000000000000000000000000000001010";
const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

// Endereço do contrato de arbitragem na Polygon
const ARBITRAGE_CONTRACT_ADDRESS = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5";

const ARBITRAGE_ABI = [
  "function requestFlashLoan(address token, uint256 amount, address tokenA, address tokenB) external",
  "function withdraw(address token) external",
  "function withdrawProfit(address token) external"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const getTokenAddress = (token: string): string => {
  switch (token.toUpperCase()) {
    case 'MATIC':
      return MATIC_ADDRESS;
    case 'WETH':
      return WETH_ADDRESS;
    case 'USDC':
      return USDC_ADDRESS;
    default:
      if (ethers.isAddress(token)) {
        return token;
      }
      throw new Error(`Token não suportado: ${token}`);
  }
};

const checkAndApproveToken = async (
  tokenAddress: string,
  signer: ethers.Signer,
  amount: bigint
): Promise<boolean> => {
  try {
    if (tokenAddress === MATIC_ADDRESS) return true; // MATIC nativo não precisa de aprovação
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const signerAddress = await signer.getAddress();
    
    console.log('Verificando aprovação para:', {
      token: tokenAddress,
      owner: signerAddress,
      spender: ARBITRAGE_CONTRACT_ADDRESS
    });

    const allowance = await tokenContract.allowance(signerAddress, ARBITRAGE_CONTRACT_ADDRESS);
    
    if (allowance >= amount) {
      console.log('Aprovação já existente:', allowance.toString());
      return true;
    }

    console.log('Solicitando aprovação para:', amount.toString());
    const approveTx = await tokenContract.approve(
      ARBITRAGE_CONTRACT_ADDRESS,
      ethers.MaxUint256, // Aprova o máximo possível para evitar futuras aprovações
      {
        gasLimit: 100000n,
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
      }
    );

    await approveTx.wait(1);
    console.log('Aprovação concluída');
    return true;
  } catch (error) {
    console.error('Erro ao aprovar token:', error);
    toast.error('Erro ao aprovar token. Por favor, tente novamente.');
    return false;
  }
};

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
    const tokenAAddress = getTokenAddress(tokenA);
    const tokenBAddress = getTokenAddress(tokenB);
    
    // Verifica e aprova os tokens necessários
    const approvalNeeded = [USDC_ADDRESS, tokenAAddress, tokenBAddress];
    for (const tokenAddress of approvalNeeded) {
      const approved = await checkAndApproveToken(tokenAddress, signer, amountInWei);
      if (!approved) {
        throw new Error('Falha na aprovação dos tokens');
      }
    }
    
    console.log('Executing arbitrage with params:', {
      tokenA: tokenAAddress,
      tokenB: tokenBAddress,
      amount: amountInWei.toString()
    });

    const tx = await contract.requestFlashLoan(
      USDC_ADDRESS,
      amountInWei,
      tokenAAddress,
      tokenBAddress,
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

    const tokenAddress = getTokenAddress(token);

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