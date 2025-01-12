import { useState, useEffect } from 'react';
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
  const [prices, setPrices] = useState<TokenPrices>(() => {
    const initialPrices: TokenPrices = {};
    tokens.forEach(token => {
      initialPrices[token] = [];
    });
    return initialPrices;
  });

  const [priceMonitor] = useState(() => new PriceMonitor());
  const [lastMinute, setLastMinute] = useState<number>(() => 
    Math.floor(Date.now() / 60000)
  );

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const currentMinute = Math.floor(Date.now() / 60000);
        
        if (currentMinute > lastMinute) {
          const newPrices: TokenPrices = {};
          
          for (const token of tokens) {
            // Use 1 MATIC como quantidade base para cotação
            const baseAmount = ethers.parseEther("1");
            const result = await priceMonitor.checkArbitrageProfitability(
              token,
              "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
              baseAmount
            );
            
            const price = Number(ethers.formatEther(result.expectedProfit));
            const timestamp = currentMinute * 60000;
            
            newPrices[token] = [
              ...(prices[token]?.slice(-30) || []),
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
    const interval = setInterval(fetchPrices, 1000);
    
    return () => clearInterval(interval);
  }, [tokens, lastMinute, priceMonitor, prices]);

  return prices;
};