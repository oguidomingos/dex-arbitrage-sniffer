import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Inicializa o objeto de preços para cada token
    const initialPrices: TokenPrices = {};
    tokens.forEach(token => {
      initialPrices[token] = [];
    });
    setPrices(initialPrices);

    const fetchPrices = async () => {
      try {
        const newPrices: TokenPrices = { ...prices };
        
        for (const token of tokens) {
          const price = await getTokenPrice(token);
          const timestamp = Date.now();
          
          newPrices[token] = [
            ...newPrices[token].slice(-30), // Mantém apenas os últimos 30 pontos
            { timestamp, price }
          ];
        }
        
        setPrices(newPrices);
      } catch (error) {
        console.error('Error fetching token prices:', error);
      }
    };

    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [tokens]);

  return prices;
};