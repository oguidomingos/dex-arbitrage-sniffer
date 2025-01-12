import { ethers } from 'ethers';
import { toast } from 'sonner';

export const ALCHEMY_API_KEY = 'eR0aPlWHb-7fYj7M25rCKh_XKTZZlQEY';
export const POLYGON_RPC = `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

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