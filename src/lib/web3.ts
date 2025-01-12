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

export const getTokenPrice = async (tokenAddress: string) => {
  // Implement price fetching logic here
  return 0;
};