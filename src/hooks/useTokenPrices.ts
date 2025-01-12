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
  const [prices, setPrices] = useState<TokenPrices>(() => {
    const initialPrices: TokenPrices = {};
    tokens.forEach(token => {
      initialPrices[token] = [];
    });
    return initialPrices;
  });

  const [lastMinute, setLastMinute] = useState<number>(() => 
    Math.floor(Date.now() / 60000)
  );

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const currentMinute = Math.floor(Date.now() / 60000);
        
        // Só registra se mudou o minuto
        if (currentMinute > lastMinute) {
          const newPrices: TokenPrices = {};
          
          for (const token of tokens) {
            const price = await getTokenPrice(token);
            const timestamp = currentMinute * 60000; // Converte minutos para millisegundos
            
            newPrices[token] = [
              ...(prices[token]?.slice(-30) || []), // Mantém últimos 30 pontos
              { timestamp, price }
            ];
          }
          
          setPrices(prevPrices => ({
            ...prevPrices,
            ...newPrices
          }));
          
          setLastMinute(currentMinute);
        }
      } catch (error) {
        console.error('Error fetching token prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 1000); // Ainda checa a cada segundo
    
    return () => clearInterval(interval);
  }, [tokens, lastMinute]); // Dependências atualizadas

  return prices;
};