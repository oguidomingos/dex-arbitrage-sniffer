import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Network, Alchemy } from "alchemy-sdk";

// Initialize Alchemy SDK
const alchemySettings = {
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || 'GassGtbTckoQXWh_D48Ksf25xTqXJdJU',
  network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(alchemySettings);

// Array of backup RPC providers
const BACKUP_RPC_PROVIDERS = [
  'https://polygon-rpc.com',
  'https://rpc-mainnet.matic.network',
  'https://rpc-mainnet.maticvigil.com'
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

// Initialize providers with Alchemy as primary and others as backup
const alchemyProvider = new ethers.AlchemyProvider(
  'matic',
  alchemySettings.apiKey
);

let backupProviders = BACKUP_RPC_PROVIDERS.map(url => createProvider(url));
let currentProvider = alchemyProvider;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getNextProvider = async () => {
  const now = Date.now();
  if (now - lastProviderSwitch < PROVIDER_SWITCH_COOLDOWN) {
    await delay(PROVIDER_SWITCH_COOLDOWN - (now - lastProviderSwitch));
  }

  currentProviderIndex = (currentProviderIndex + 1) % backupProviders.length;
  lastProviderSwitch = Date.now();
  currentProvider = backupProviders[currentProviderIndex];
  console.log(`Switching to backup RPC provider ${currentProviderIndex + 1}/${backupProviders.length}`);
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
        
        // First try with Alchemy SDK for specific methods that it supports
        if (prop === 'getBlock' || prop === 'getBalance' || prop === 'getTransactionCount') {
          try {
            // @ts-ignore - Alchemy SDK types are different but compatible
            const result = await alchemy.core[prop](...args);
            return result;
          } catch (error) {
            console.warn('Alchemy SDK failed, falling back to providers:', error);
          }
        }
        
        // Fall back to regular providers if Alchemy SDK doesn't support the method or failed
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