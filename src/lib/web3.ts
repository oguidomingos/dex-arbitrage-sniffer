import { ethers } from 'ethers';

const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error("No ethereum provider found");
};

export const connectWallet = async () => {
  try {
    const provider = getProvider();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length > 0) {
      return await provider.getSigner();
    }
    throw new Error("No accounts found");
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

export const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    if (tokenAddress.toLowerCase() === "MATIC".toLowerCase()) {
      tokenAddress = WMATIC;
    }

    const provider = getProvider();
    const quickswapRouter = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
    const sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, ROUTER_ABI, provider);
    
    const amountIn = ethers.parseUnits("1", 18);
    const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

    let priceQuickswap = 0n;
    let priceSushiswap = 0n;

    try {
      const amountsQuickswap = await quickswapRouter.getAmountsOut.staticCall(
        amountIn,
        [tokenAddress, USDC]
      );
      priceQuickswap = amountsQuickswap[1];
    } catch (error) {
      console.error('Error getting QuickSwap price:', error);
    }

    try {
      const amountsSushiswap = await sushiswapRouter.getAmountsOut.staticCall(
        amountIn,
        [tokenAddress, USDC]
      );
      priceSushiswap = amountsSushiswap[1];
    } catch (error) {
      console.error('Error getting SushiSwap price:', error);
    }

    const avgPrice = Number(ethers.formatUnits((priceQuickswap + priceSushiswap) / 2n, 6));
    
    console.log(`Preços obtidos para ${tokenAddress}:`, {
      quickswap: ethers.formatUnits(priceQuickswap, 6),
      sushiswap: ethers.formatUnits(priceSushiswap, 6),
      average: avgPrice
    });
    
    return avgPrice;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return 0;
  }
};

export const getPriceFromDEX = async (
  router: ethers.Contract,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<bigint> => {
  try {
    const amounts = await router.getAmountsOut.staticCall(amountIn, [tokenIn, tokenOut]);
    return amounts[1];
  } catch (error) {
    console.error(`Error getting price from DEX:`, error);
    return 0n;
  }
};

export class PriceMonitor {
  private quickswapRouter: ethers.Contract;
  private sushiswapRouter: ethers.Contract;

  constructor() {
    const provider = getProvider();
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
    if (tokenA.toLowerCase() === "MATIC".toLowerCase()) {
      tokenA = WMATIC;
    }

    const priceQuickswap = await getPriceFromDEX(
      this.quickswapRouter,
      tokenA,
      tokenB,
      amount
    );

    const priceSushiswap = await getPriceFromDEX(
      this.sushiswapRouter,
      tokenA,
      tokenB,
      amount
    );

    const profit = priceSushiswap > priceQuickswap 
      ? priceSushiswap - priceQuickswap
      : priceQuickswap - priceSushiswap;

    const gasCost = ethers.parseEther("0.01");
    const flashLoanFee = amount * 9n / 10000n; // 0.09% as bigint

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