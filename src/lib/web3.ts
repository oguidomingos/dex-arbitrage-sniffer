import { ethers } from 'ethers';
import { toast } from 'sonner';

// Array of backup RPC providers
const RPC_PROVIDERS = [
  'https://polygon-rpc.com',
  'https://rpc-mainnet.matic.network',
  'https://rpc-mainnet.maticvigil.com',
  'https://polygon.llamarpc.com'
];

const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

let currentProviderIndex = 0;
let lastProviderSwitch = Date.now();
const PROVIDER_SWITCH_COOLDOWN = 2000; // 2 seconds cooldown
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds delay between retries

const createProvider = (url: string) => {
  return new ethers.JsonRpcProvider(url, {
    chainId: 137,
    name: 'polygon'
  });
};

let providers = RPC_PROVIDERS.map(url => createProvider(url));
let currentProvider: ethers.Provider = providers[0];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getNextProvider = async () => {
  const now = Date.now();
  if (now - lastProviderSwitch < PROVIDER_SWITCH_COOLDOWN) {
    await delay(PROVIDER_SWITCH_COOLDOWN - (now - lastProviderSwitch));
  }

  currentProviderIndex = (currentProviderIndex + 1) % providers.length;
  lastProviderSwitch = Date.now();
  currentProvider = providers[currentProviderIndex];
  console.log(`Switching to RPC provider ${currentProviderIndex + 1}/${providers.length}`);
  return currentProvider;
};

const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  if (error.code && [429, -32005].includes(error.code)) return true;
  
  if (error.message && (
    error.message.toLowerCase().includes('rate limit') ||
    error.message.toLowerCase().includes('too many requests') ||
    error.message.toLowerCase().includes('exceeded') ||
    error.message.toLowerCase().includes('throttled')
  )) return true;
  
  if (error.status === 429) return true;
  
  return false;
};

export const provider = new Proxy({} as ethers.Provider, {
  get: (target, prop) => {
    const provider = currentProvider;
    const value = provider[prop as keyof ethers.Provider];
    
    if (typeof value === 'function') {
      return async (...args: any[]) => {
        let lastError;
        
        for (let retry = 0; retry < MAX_RETRIES; retry++) {
          try {
            const result = await value.apply(provider, args);
            return result;
          } catch (error: any) {
            lastError = error;
            console.error(`Provider error (attempt ${retry + 1}/${MAX_RETRIES}):`, error);
            
            if (isRateLimitError(error)) {
              console.log('Rate limit hit, switching providers...');
              currentProvider = await getNextProvider();
              await delay(RETRY_DELAY);
              continue;
            }
            
            throw error;
          }
        }
        
        console.error('All providers failed:', lastError);
        throw lastError;
      };
    }
    return value;
  }
});

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      toast.error('Please install MetaMask to use this app');
      return null;
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    toast.error('Failed to connect wallet');
    return null;
  }
};

async function getPriceFromDEX(
  routerAddress: string,
  tokenAddress: string,
  amount: bigint = ethers.parseEther("1")
): Promise<number> {
  try {
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    const path = [tokenAddress, USDC_ADDRESS];
    const amounts = await router.getAmountsOut(amount, path);
    return Number(ethers.formatUnits(amounts[1], 6)); // USDC has 6 decimals
  } catch (error) {
    console.error(`Error getting price from DEX:`, error);
    throw error;
  }
}

export const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    // Try QuickSwap first
    const priceQuickswap = await getPriceFromDEX(QUICKSWAP_ROUTER, tokenAddress);
    
    // Then try SushiSwap
    const priceSushiswap = await getPriceFromDEX(SUSHISWAP_ROUTER, tokenAddress);
    
    // Return the average of both prices
    return (priceQuickswap + priceSushiswap) / 2;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    // Return a fallback price if both DEXs fail
    return 1.0;
  }
};