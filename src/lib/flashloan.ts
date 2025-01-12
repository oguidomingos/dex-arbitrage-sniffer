import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getTokenPrice } from './web3';

export const simulateFlashloan = async (
  initialAmount: number,
  tokenA: string,
  tokenB: string,
  dexA: string,
  dexB: string
): Promise<SimulationResult> => {
  try {
    console.log('Iniciando simulação para:', { tokenA, tokenB, dexA, dexB });
    
    // Obter preços dos tokens em ambas DEXs
    const priceADexA = await getTokenPrice(tokenA, dexA);
    const priceBDexA = await getTokenPrice(tokenB, dexA);
    const priceADexB = await getTokenPrice(tokenA, dexB);
    const priceBDexB = await getTokenPrice(tokenB, dexB);
    
    console.log('Preços obtidos:', { 
      priceADexA, priceBDexA, 
      priceADexB, priceBDexB 
    });
    
    // Simular rota 1: TokenA -> TokenB (DexA) -> TokenA (DexB)
    const route1Amount = initialAmount;
    const route1Step1 = route1Amount * (priceBDexA / priceADexA);
    const route1Final = route1Step1 * (priceADexB / priceBDexB);
    const route1Profit = route1Final - route1Amount;

    // Simular rota 2: TokenA -> TokenB (DexB) -> TokenA (DexA)
    const route2Amount = initialAmount;
    const route2Step1 = route2Amount * (priceBDexB / priceADexB);
    const route2Final = route2Step1 * (priceADexA / priceBDexA);
    const route2Profit = route2Final - route2Amount;

    // Escolher a melhor rota
    const bestRoute = route1Profit > route2Profit ? 1 : 2;
    const bestProfit = Math.max(route1Profit, route2Profit);
    
    // Calcular custos do flashloan
    const flashloanAmount = initialAmount;
    const flashloanFee = flashloanAmount * 0.0009; // 0.09% fee
    const gasCost = 0.01; // Custo estimado em MATIC
    const gasCostInToken = gasCost * (await getTokenPrice('MATIC', dexA));
    
    // Calcular lucro líquido
    const netProfit = bestProfit - flashloanFee - gasCostInToken;

    // Determinar se a operação é lucrativa
    const isProfitable = netProfit > 0;

    if (isProfitable) {
      console.log('Oportunidade lucrativa encontrada:', {
        route: bestRoute,
        profit: netProfit,
        details: {
          initialAmount,
          flashloanFee,
          gasCost: gasCostInToken,
          bestRoute,
          route1Profit,
          route2Profit
        }
      });
    }

    return {
      initialAmount,
      flashloanAmount,
      expectedProfit: netProfit,
      finalTokenAmount: initialAmount + netProfit,
      dexRoute: bestRoute === 1 ? [dexA, dexB] : [dexB, dexA],
      percentageDiff: (netProfit / initialAmount) * 100,
      priceA: bestRoute === 1 ? priceADexA : priceADexB,
      priceB: bestRoute === 1 ? priceBDexA : priceBDexB,
      priceDiff: Math.abs(priceADexA - priceADexB),
      percentDiff: Math.abs((priceADexA - priceADexB) / priceADexA) * 100,
      flashloanFee,
      gasCost: gasCostInToken,
      isProfitable,
      bestRoute,
      route1Profit,
      route2Profit
    };
  } catch (error) {
    console.error('Error in flashloan simulation:', error);
    throw error;
  }
};

export interface SimulationResult {
  initialAmount: number;
  flashloanAmount: number;
  expectedProfit: number;
  finalTokenAmount: number;
  dexRoute: string[];
  percentageDiff: number;
  priceA: number;
  priceB: number;
  priceDiff: number;
  percentDiff: number;
  flashloanFee: number;
  gasCost: number;
  isProfitable: boolean;
  bestRoute: number;
  route1Profit: number;
  route2Profit: number;
}