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

// Simula variações de preço para demonstração
const basePrice: { [key: string]: number } = {
  'MATIC': 1.5,
  'USDC': 1.0,
  'WETH': 3000,
  'USDT': 1.0,
};

export const getTokenPrice = async (tokenAddress: string) => {
  const base = basePrice[tokenAddress] || 1.0;
  const variation = (Math.random() - 0.5) * 0.02; // Variação de ±1%
  return base * (1 + variation);
};