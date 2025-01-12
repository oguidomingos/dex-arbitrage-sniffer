import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getTokenPriceFromDEX } from './web3';

interface SimulationResult {
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

export const simulateFlashloan = async (
  initialAmount: number,
  tokenA: string,
  tokenB: string,
  dexA: string,
  dexB: string
): Promise<SimulationResult> => {
  try {
    console.log('Iniciando simulação para:', { tokenA, tokenB, dexA, dexB, initialAmount });
    
    // Obter preços dos tokens em ambas DEXs
    const priceAInDexA = await getTokenPriceFromDEX(tokenA, dexA);
    const priceBInDexA = await getTokenPriceFromDEX(tokenB, dexA);
    const priceAInDexB = await getTokenPriceFromDEX(tokenA, dexB);
    const priceBInDexB = await getTokenPriceFromDEX(tokenB, dexB);
    
    console.log('Preços obtidos:', {
      [`${tokenA} em ${dexA}`]: priceAInDexA,
      [`${tokenB} em ${dexA}`]: priceBInDexA,
      [`${tokenA} em ${dexB}`]: priceAInDexB,
      [`${tokenB} em ${dexB}`]: priceBInDexB
    });

    // Aumentar o valor inicial para ter mais impacto
    const scaledInitialAmount = initialAmount * 1000; // Usar 1000 unidades do token

    // Simular rota 1: TokenA -> TokenB (DexA) -> TokenA (DexB)
    const route1Step1Amount = scaledInitialAmount / priceAInDexA * priceBInDexA;
    const route1FinalAmount = route1Step1Amount / priceBInDexB * priceAInDexB;
    const route1Profit = route1FinalAmount - scaledInitialAmount;

    // Simular rota 2: TokenA -> TokenB (DexB) -> TokenA (DexA)
    const route2Step1Amount = scaledInitialAmount / priceAInDexB * priceBInDexB;
    const route2FinalAmount = route2Step1Amount / priceBInDexA * priceAInDexA;
    const route2Profit = route2FinalAmount - scaledInitialAmount;

    console.log('Resultados das rotas:', {
      rota1: {
        initialAmount: scaledInitialAmount,
        step1: route1Step1Amount,
        final: route1FinalAmount,
        profit: route1Profit
      },
      rota2: {
        initialAmount: scaledInitialAmount,
        step1: route2Step1Amount,
        final: route2FinalAmount,
        profit: route2Profit
      }
    });

    // Escolher a melhor rota
    const bestRoute = route1Profit > route2Profit ? 1 : 2;
    const bestProfit = Math.max(route1Profit, route2Profit);
    
    // Calcular custos
    const flashloanFee = scaledInitialAmount * 0.0009; // 0.09% fee
    const gasCost = 0.01; // Custo estimado em MATIC
    const gasCostInToken = gasCost * priceAInDexA;
    
    // Calcular lucro líquido
    const netProfit = bestProfit - flashloanFee - gasCostInToken;
    const isProfitable = netProfit > 0;

    // Calcular diferenças percentuais
    const priceDiff = Math.abs(priceAInDexA - priceAInDexB);
    const avgPrice = (priceAInDexA + priceAInDexB) / 2;
    const percentDiff = (priceDiff / avgPrice) * 100;

    if (isProfitable) {
      console.log('Oportunidade lucrativa encontrada:', {
        route: bestRoute,
        profit: netProfit,
        details: {
          initialAmount: scaledInitialAmount,
          flashloanFee,
          gasCost: gasCostInToken,
          bestRoute,
          route1Profit,
          route2Profit,
          percentDiff
        }
      });
    }

    return {
      initialAmount: scaledInitialAmount,
      flashloanAmount: scaledInitialAmount,
      expectedProfit: netProfit,
      finalTokenAmount: scaledInitialAmount + netProfit,
      dexRoute: bestRoute === 1 ? [dexA, dexB] : [dexB, dexA],
      percentageDiff: (netProfit / scaledInitialAmount) * 100,
      priceA: bestRoute === 1 ? priceAInDexA : priceAInDexB,
      priceB: bestRoute === 1 ? priceBInDexA : priceBInDexB,
      priceDiff,
      percentDiff,
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