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
    
    // Obter preços reais das DEXs
    const priceA = await getTokenPrice(tokenA, dexA);
    const priceB = await getTokenPrice(tokenA, dexB);
    
    console.log('Preços obtidos:', { priceA, priceB });
    
    // Calcula diferença de preço entre DEXs
    const priceDiff = Math.abs(priceA - priceB);
    const avgPrice = (priceA + priceB) / 2;
    const percentDiff = (priceDiff / avgPrice) * 100;
    
    console.log('Diferenças calculadas:', { priceDiff, percentDiff });
    
    // Simula flashloan com valores reais
    const flashloanAmount = initialAmount * 50; // Alavancagem de 50x
    const slippage = 0.002; // 0.2% slippage
    const profitPercentage = percentDiff / 100;
    const flashloanFee = flashloanAmount * 0.0009; // 0.09% fee
    const gasCost = 0.01; // Custo estimado em MATIC
    
    const amountWithFlashloan = initialAmount + flashloanAmount;
    const expectedFinalAmount = amountWithFlashloan * (1 + profitPercentage);
    const afterSlippage = expectedFinalAmount * (1 - slippage) * (1 - slippage);
    
    const finalAmount = afterSlippage - flashloanAmount - flashloanFee - gasCost;
    const profit = finalAmount - initialAmount;

    console.log('Resultados calculados:', {
      flashloanAmount,
      flashloanFee,
      gasCost,
      profit
    });

    return {
      initialAmount,
      flashloanAmount,
      expectedProfit: profit,
      finalTokenAmount: finalAmount,
      dexRoute: [dexA, dexB],
      percentageDiff: percentDiff,
      priceA,
      priceB,
      priceDiff,
      percentDiff,
      flashloanFee,
      gasCost
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
}