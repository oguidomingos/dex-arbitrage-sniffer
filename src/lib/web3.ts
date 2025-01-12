import { ethers } from 'ethers';
import { toast } from 'sonner';

// Array of RPC providers for redundancy with different weights
const RPC_PROVIDERS = [
  {
    url: `https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'GassGtbTckoQXWh_D48Ksf25xTqXJdJU'}`,
    weight: 1, // Lower weight for Alchemy due to rate limits
  },
  {
    url: 'https://polygon-rpc.com',
    weight: 3,
  },
  {
    url: 'https://rpc-mainnet.matic.network',
    weight: 3,
  },
  {
    url: 'https://rpc-mainnet.maticvigil.com',
    weight: 3,
  }
];

let currentProviderIndex = 0;
let lastProviderSwitch = Date.now();
const PROVIDER_SWITCH_COOLDOWN = 2000; // 2 seconds cooldown
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds delay between retries
const RATE_LIMIT_CODES = [429, -32005]; // Common rate limit error codes

// Create weighted provider list
const weightedProviders = RPC_PROVIDERS.flatMap(provider => 
  Array(provider.weight).fill(provider.url)
);

const createProvider = (url: string) => {
  return new ethers.JsonRpcProvider(url, {
    chainId: 137,
    name: 'polygon'
  });
};

// Initialize providers with weighted distribution
let providers = weightedProviders.map(url => createProvider(url));
let currentProvider = providers[0];

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
  
  // Check for specific rate limit error codes
  if (error.code && RATE_LIMIT_CODES.includes(error.code)) return true;
  
  // Check error message for rate limit indicators
  if (error.message && (
    error.message.includes('rate limit') ||
    error.message.includes('too many requests') ||
    error.message.includes('exceeded') ||
    error.message.includes('throttled')
  )) return true;
  
  // Check HTTP status code
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
              console.log(`Rate limit hit on provider ${currentProviderIndex + 1}, switching...`);
              currentProvider = await getNextProvider();
              await delay(RETRY_DELAY);
              continue;
            }
            
            // For non-rate-limit errors, throw immediately
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

// Preços base atualizados para refletir valores mais realistas
const basePrice: { [key: string]: number } = {
  'MATIC': 0.85,
  'USDC': 1.0,
  'WETH': 2500,
  'USDT': 1.0,
};

// Cache para armazenar o último preço gerado para cada token
const lastPrices: { [key: string]: number } = {};

export const getTokenPrice = async (tokenAddress: string) => {
  if (!lastPrices[tokenAddress]) {
    lastPrices[tokenAddress] = basePrice[tokenAddress] || 1.0;
  }

  // Gera uma variação mais significativa (±2%)
  const variation = (Math.random() - 0.5) * 0.04;
  
  // Atualiza o último preço com a variação
  lastPrices[tokenAddress] = lastPrices[tokenAddress] * (1 + variation);
  
  // Adiciona um pequeno atraso aleatório para simular latência da API
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  
  return lastPrices[tokenAddress];
};