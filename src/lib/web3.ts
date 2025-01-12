import { ethers } from 'ethers';
import { toast } from 'sonner';

// Array of RPC providers for redundancy
const RPC_PROVIDERS = [
  `https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'eR0aPlWHb-7fYj7M25rCKh_XKTZZlQEY'}`,
  'https://polygon-rpc.com',
  'https://rpc-mainnet.matic.network',
  'https://rpc-mainnet.maticvigil.com'
];

let currentProviderIndex = 0;
let lastProviderSwitch = Date.now();
const PROVIDER_SWITCH_COOLDOWN = 1000; // 1 second cooldown

const createProvider = (url: string) => {
  return new ethers.JsonRpcProvider(url, {
    chainId: 137, // Polygon mainnet
    name: 'polygon'
  });
};

// Initialize providers
let providers = RPC_PROVIDERS.map(url => createProvider(url));
let currentProvider = providers[0];

const getNextProvider = () => {
  const now = Date.now();
  if (now - lastProviderSwitch < PROVIDER_SWITCH_COOLDOWN) {
    return currentProvider;
  }

  currentProviderIndex = (currentProviderIndex + 1) % providers.length;
  lastProviderSwitch = now;
  currentProvider = providers[currentProviderIndex];
  console.log(`Switching to RPC provider ${currentProviderIndex + 1}/${providers.length}`);
  return currentProvider;
};

export const provider = new Proxy({} as ethers.Provider, {
  get: (target, prop) => {
    const provider = currentProvider;
    
    // If the requested property is a function, wrap it with retry logic
    const value = provider[prop as keyof ethers.Provider];
    if (typeof value === 'function') {
      return async (...args: any[]) => {
        let lastError;
        for (let i = 0; i < providers.length; i++) {
          try {
            return await value.apply(provider, args);
          } catch (error: any) {
            lastError = error;
            if (error?.code === 429 || error?.message?.includes('failed to fetch')) {
              console.log(`Provider ${currentProviderIndex + 1} failed, trying next...`);
              currentProvider = getNextProvider();
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