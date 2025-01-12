import { useState, useEffect } from 'react';
import { getPoolData } from '@/lib/web3';

export interface PoolStats {
  liquidity: number;
  volume: {
    '10m': number;
    '1h': number;
    '6h': number;
    '24h': number;
  };
  lastUpdate: number;
}

export const usePoolData = (dex: string, tokenA: string, tokenB: string) => {
  const [poolData, setPoolData] = useState<PoolStats>({
    liquidity: 0,
    volume: {
      '10m': 0,
      '1h': 0,
      '6h': 0,
      '24h': 0
    },
    lastUpdate: Date.now()
  });

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const data = await getPoolData(dex, tokenA, tokenB);
        setPoolData(prev => ({
          ...data,
          lastUpdate: Date.now()
        }));
      } catch (error) {
        console.error(`Error fetching pool data for ${dex}:`, error);
      }
    };

    fetchPoolData();
    const interval = setInterval(fetchPoolData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [dex, tokenA, tokenB]);

  return poolData;
};