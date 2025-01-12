import { ethers } from 'ethers';
import { provider } from '@/lib/web3';

const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

export const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    const priceQuickswap = await getPriceFromDEX(QUICKSWAP_ROUTER, tokenAddress);
    const priceSushiswap = await getPriceFromDEX(SUSHISWAP_ROUTER, tokenAddress);
    
    const avgPrice = (priceQuickswap + priceSushiswap) / 2;
    
    console.log(`Preços obtidos para ${tokenAddress}:`, {
      quickswap: priceQuickswap,
      sushiswap: priceSushiswap,
      average: avgPrice
    });
    
    return avgPrice || 0;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return 0;
  }
};

export const getPriceFromDEX = async (
  dexRouter: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<bigint> => {
  try {
    const path = [tokenIn, tokenOut];
    const amounts = await dexRouter.getAmountsOut(amountIn, path);
    return amounts[1];
  } catch (error) {
    console.error(`Error getting price from DEX:`, error);
    throw error;
  }
};

export class PriceMonitor {
  private quickswapRouter: ethers.Contract;
  private sushiswapRouter: ethers.Contract;

  constructor() {
    this.quickswapRouter = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
    this.sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, ROUTER_ABI, provider);
  }

  async checkArbitrageProfitability(
    tokenA: string,
    tokenB: string,
    amount: bigint
  ): Promise<{
    profitable: boolean;
    expectedProfit: bigint;
    route: string[];
  }> {
    const priceQuickswap = await this.getPriceFromDEX(
      this.quickswapRouter,
      tokenA,
      tokenB,
      amount
    );

    const priceSushiswap = await this.getPriceFromDEX(
      this.sushiswapRouter,
      tokenA,
      tokenB,
      amount
    );

    const profit = priceSushiswap > priceQuickswap 
      ? priceSushiswap - priceQuickswap
      : priceQuickswap - priceSushiswap;

    const gasCost = ethers.parseEther("0.01");
    const flashLoanFee = amount * BigInt(9) / BigInt(10000);

    const netProfit = profit - gasCost - flashLoanFee;

    return {
      profitable: netProfit > 0n,
      expectedProfit: netProfit,
      route: priceSushiswap > priceQuickswap 
        ? ["QuickSwap", "SushiSwap"]
        : ["SushiSwap", "QuickSwap"]
    };
  }
}
