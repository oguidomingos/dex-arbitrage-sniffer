import { useState, useEffect, useCallback } from 'react';
import { PriceMonitor } from '@/services/priceMonitor';
import { ethers } from 'ethers';

interface PriceData {
  timestamp: number;
  price: number;
}

interface TokenPrices {
  [key: string]: PriceData[];
}

export const useTokenPrices = (tokens: string[]) => {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [priceMonitor] = useState(() => new PriceMonitor());
  const [lastMinute, setLastMinute] = useState(() => Math.floor(Date.now() / 60000));

  const fetchPrices = useCallback(async () => {
    try {
      const currentMinute = Math.floor(Date.now() / 60000);
      
      if (currentMinute > lastMinute) {
        const newPrices: TokenPrices = { ...prices };
        
        for (const token of tokens) {
          const baseAmount = ethers.parseEther("1");
          const result = await priceMonitor.checkArbitrageProfitability(
            token,
            "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
            baseAmount
          );
          
          const price = Number(ethers.formatEther(result.expectedProfit));
          const timestamp = currentMinute * 60000;
          
          if (!newPrices[token]) {
            newPrices[token] = [];
          }
          
          newPrices[token] = [
            ...newPrices[token].slice(-30),
            { timestamp, price }
          ];
        }
        
        setPrices(newPrices);
        setLastMinute(currentMinute);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
  }, [tokens, lastMinute, priceMonitor, prices]);

  useEffect(() => {
    // Inicializa os preços imediatamente
    const initializePrices = () => {
      const initialPrices: TokenPrices = {};
      tokens.forEach(token => {
        initialPrices[token] = [];
      });
      setPrices(initialPrices);
    };

    initializePrices();
    
    // Configura o intervalo para atualização
    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return prices;
};