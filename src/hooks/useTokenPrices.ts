import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getTokenPrice } from '@/lib/web3';

interface PriceData {
  timestamp: number;
  price: number;
}

interface TokenPrices {
  [key: string]: PriceData[];
}

export const useTokenPrices = (tokens: string[]) => {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [lastMinute, setLastMinute] = useState(() => Math.floor(Date.now() / 60000));
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const currentMinute = Math.floor(Date.now() / 60000);
      
      if (currentMinute > lastMinute) {
        const newPrices: TokenPrices = { ...prices };
        
        for (const token of tokens) {
          try {
            const price = await getTokenPrice(token);
            const timestamp = currentMinute * 60000;
            
            newPrices[token] = [
              ...(newPrices[token] || []).slice(-30),
              { timestamp, price }
            ];
            
            console.log(`Preço atualizado para ${token}:`, price);
          } catch (error) {
            console.error(`Error fetching price for ${token}:`, error);
          }
        }
        
        setPrices(newPrices);
        setLastMinute(currentMinute);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tokens, lastMinute, prices, isLoading]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return prices;
};