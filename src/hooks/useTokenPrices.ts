import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const newPrices: TokenPrices = { ...prices };
      
      for (const token of tokens) {
        try {
          const price = await getTokenPrice(token);
          
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
    } catch (error) {
      console.error('Error fetching token prices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tokens, prices, isLoading]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return prices;
};