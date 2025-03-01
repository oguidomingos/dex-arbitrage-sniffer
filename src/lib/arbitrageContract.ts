import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços dos tokens na rede Polygon
const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const MATIC_ADDRESS = "0x0000000000000000000000000000000000001010";

// Endereço do contrato de arbitragem na Polygon
const ARBITRAGE_CONTRACT_ADDRESS = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5";

const ARBITRAGE_ABI = [
  "function requestFlashLoan(address token, uint256 amount, address tokenA, address tokenB) external",
  "function withdraw(address token) external",
  "function withdrawProfit(address token) external"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Função auxiliar para adicionar delay entre tentativas
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para realizar retry com backoff exponencial
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const waitTime = baseDelay * Math.pow(2, i);
      console.log(`Tentativa ${i + 1} falhou, aguardando ${waitTime}ms antes de tentar novamente`);
      await delay(waitTime);
    }
  }
  throw new Error('Todas as tentativas falharam');
}

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

const getTokenDecimals = async (tokenAddress: string, signer: ethers.Signer): Promise<number> => {
  if (tokenAddress === MATIC_ADDRESS) return 18;
  
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  try {
    return await withRetry(() => tokenContract.decimals());
  } catch (error) {
    console.error('Erro ao obter decimais do token:', error);
    return 18;
  }
};

export const executeRealArbitrage = async (
  tokenA: string,
  tokenB: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    console.log('Iniciando execução da arbitragem com:', { tokenA, tokenB, amount });
    
    const contract = new ethers.Contract(
      ARBITRAGE_CONTRACT_ADDRESS,
      ARBITRAGE_ABI,
      signer
    );

    const tokenAAddress = getTokenAddress(tokenA);
    const tokenBAddress = getTokenAddress(tokenB);
    
    // Sempre usa WETH para flashloan
    const flashloanToken = WETH_ADDRESS;
    const decimals = await getTokenDecimals(flashloanToken, signer);
    const amountInWei = ethers.parseUnits(amount, decimals);

    console.log('Executando arbitragem com parâmetros:', {
      flashloanToken,
      tokenA: tokenAAddress,
      tokenB: tokenBAddress,
      amount: amountInWei.toString()
    });

    const tx = await withRetry(() => 
      contract.requestFlashLoan(
        flashloanToken,
        amountInWei,
        tokenAAddress,
        tokenBAddress,
        { 
          gasLimit: 500000n,
          maxFeePerGas: ethers.parseUnits('100', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      )
    );

    console.log('Transação enviada:', tx.hash);
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
    console.log('Iniciando retirada de lucro para token:', tokenAddress);

    const tx = await withRetry(() => 
      contract.withdrawProfit(tokenAddress, { 
        gasLimit: 200000n,
        maxFeePerGas: ethers.parseUnits('100', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      })
    );
    
    console.log('Transação de retirada enviada:', tx.hash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Erro ao retirar lucro:", error);
    throw error;
  }
};