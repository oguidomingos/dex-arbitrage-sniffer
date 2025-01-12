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
    // Obter preços reais das DEXs
    const priceA = await getTokenPrice(tokenA);
    const priceB = await getTokenPrice(tokenB);
    
    // Calcula diferença de preço entre DEXs
    const priceDiff = Math.abs(priceA - priceB);
    const avgPrice = (priceA + priceB) / 2;
    const percentDiff = (priceDiff / avgPrice) * 100;
    
    // Simula flashloan com valores reais
    const flashloanAmount = initialAmount * 50;
    const slippage = 0.002; // 0.2% slippage fixo
    const profitPercentage = percentDiff / 100;
    
    const amountWithFlashloan = initialAmount + flashloanAmount;
    const expectedFinalAmount = amountWithFlashloan * (1 + profitPercentage);
    const afterSlippage = expectedFinalAmount * (1 - slippage) * (1 - slippage);
    const flashloanFee = flashloanAmount * 0.0009; // 0.09% fee
    const gasCost = 0.01; // Custo estimado em MATIC
    
    const finalAmount = afterSlippage - flashloanAmount - flashloanFee - gasCost;
    const profit = finalAmount - initialAmount;

    console.log('Simulation results:', {
      percentDiff,
      profit,
      gasCost,
      flashloanFee
    });

    return {
      initialAmount,
      flashloanAmount,
      expectedProfit: profit,
      finalTokenAmount: finalAmount,
      dexRoute: [dexA, dexB],
      percentageDiff: percentDiff
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
}