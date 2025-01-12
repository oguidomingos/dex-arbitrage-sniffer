import { ethers } from 'ethers';
import { getProvider } from '@/lib/web3';

const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

export class PriceMonitor {
  private quickswapRouter: ethers.Contract;
  private sushiswapRouter: ethers.Contract;

  constructor() {
    const provider = getProvider();
    this.quickswapRouter = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
    this.sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, ROUTER_ABI, provider);
  }

  async getPriceFromDEX(
    dexRouter: ethers.Contract,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    try {
      const path = [tokenIn, tokenOut];
      const amounts = await dexRouter.getAmountsOut(amountIn, path);
      return amounts[1];
    } catch (error) {
      console.error(`Error getting price from DEX:`, error);
      throw error;
    }
  }
}