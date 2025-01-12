import { ethers } from 'ethers';

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

const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

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
    const tokenAddressMap: { [key: string]: string } = {
      'MATIC': WMATIC,
      'WETH': WETH,
      'USDC': USDC
    };

    const actualTokenAddress = tokenAddressMap[tokenAddress] || tokenAddress;
    
    const provider = getProvider();
    const quickswapRouter = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
    const sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, ROUTER_ABI, provider);
    
    const amountIn = ethers.parseUnits("1", 18);
    let path: string[];
    
    if (actualTokenAddress === USDC) {
      path = [WMATIC, USDC];
      const amountsQuickswap = await quickswapRouter.getAmountsOut.staticCall(amountIn, path);
      const amountsSushiswap = await sushiswapRouter.getAmountsOut.staticCall(amountIn, path);
      
      const priceQuickswap = 1 / Number(ethers.formatUnits(amountsQuickswap[1], 6));
      const priceSushiswap = 1 / Number(ethers.formatUnits(amountsSushiswap[1], 6));
      
      const avgPrice = (priceQuickswap + priceSushiswap) / 2;
      
      console.log(`Preços obtidos para ${tokenAddress}:`, {
        quickswap: priceQuickswap.toString(),
        sushiswap: priceSushiswap.toString(),
        average: avgPrice
      });
      
      return avgPrice;
    } else {
      path = [actualTokenAddress, USDC];
      let priceQuickswap = 0;
      let priceSushiswap = 0;

      try {
        const amountsQuickswap = await quickswapRouter.getAmountsOut.staticCall(amountIn, path);
        priceQuickswap = Number(ethers.formatUnits(amountsQuickswap[1], 6));
      } catch (error) {
        console.error('Error getting QuickSwap price:', error);
      }

      try {
        const amountsSushiswap = await sushiswapRouter.getAmountsOut.staticCall(amountIn, path);
        priceSushiswap = Number(ethers.formatUnits(amountsSushiswap[1], 6));
      } catch (error) {
        console.error('Error getting SushiSwap price:', error);
      }

      const avgPrice = (priceQuickswap + priceSushiswap) / 2;
      
      console.log(`Preços obtidos para ${actualTokenAddress}:`, {
        quickswap: priceQuickswap.toString(),
        sushiswap: priceSushiswap.toString(),
        average: avgPrice
      });
      
      return avgPrice;
    }
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return 0;
  }
};

export const getTokenPriceFromDEX = async (
  tokenAddress: string,
  dex: string
): Promise<number> => {
  try {
    const tokenAddressMap: { [key: string]: string } = {
      'MATIC': WMATIC,
      'WETH': WETH,
      'USDC': USDC
    };

    const actualTokenAddress = tokenAddressMap[tokenAddress] || tokenAddress;
    const provider = getProvider();
    const routerAddress = dex.toLowerCase() === 'quickswap' ? QUICKSWAP_ROUTER : SUSHISWAP_ROUTER;
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
    
    const amountIn = ethers.parseUnits("1", 18);
    let path: string[];
    
    if (actualTokenAddress === USDC) {
      path = [WMATIC, USDC];
      const amounts = await router.getAmountsOut.staticCall(amountIn, path);
      return 1 / Number(ethers.formatUnits(amounts[1], 6));
    } else {
      path = [actualTokenAddress, USDC];
      const amounts = await router.getAmountsOut.staticCall(amountIn, path);
      return Number(ethers.formatUnits(amounts[1], 6));
    }
  } catch (error) {
    console.error(`Error getting ${dex} price:`, error);
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

export const getPoolData = async (
  dex: string,
  tokenA: string,
  tokenB: string
): Promise<PoolStats> => {
  try {
    const provider = getProvider();
    const routerAddress = dex.toLowerCase() === 'quickswap' ? QUICKSWAP_ROUTER : SUSHISWAP_ROUTER;
    const router = new ethers.Contract(routerAddress, [
      ...ROUTER_ABI,
      "function factory() external view returns (address)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ], provider);

    // Get factory address
    const factoryAddress = await router.factory();
    const factoryContract = new ethers.Contract(factoryAddress, [
      "function getPair(address tokenA, address tokenB) external view returns (address pair)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ], provider);

    // Get pair address
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    
    // Simulate volume data (in a real scenario, you'd fetch this from a subgraph or API)
    const currentBlock = await provider.getBlockNumber();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Get historical data for different time periods
    const volumeData = {
      '10m': Math.random() * 100000, // Example volume in USD
      '1h': Math.random() * 500000,
      '6h': Math.random() * 2000000,
      '24h': Math.random() * 5000000
    };

    // Get current reserves
    const pairContract = new ethers.Contract(pairAddress, [
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() external view returns (address)",
      "function token1() external view returns (address)"
    ], provider);

    const reserves = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();

    // Calculate total liquidity in USD
    const priceA = await getTokenPrice(tokenA);
    const priceB = await getTokenPrice(tokenB);
    
    const reserve0 = Number(ethers.formatUnits(reserves[0], 18));
    const reserve1 = Number(ethers.formatUnits(reserves[1], 18));
    
    const liquidity = (reserve0 * priceA) + (reserve1 * priceB);

    return {
      liquidity,
      volume: volumeData,
      lastUpdate: currentTimestamp
    };
  } catch (error) {
    console.error('Error fetching pool data:', error);
    return {
      liquidity: 0,
      volume: {
        '10m': 0,
        '1h': 0,
        '6h': 0,
        '24h': 0
      },
      lastUpdate: Math.floor(Date.now() / 1000)
    };
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
    const actualTokenA = tokenA.toLowerCase() === "MATIC".toLowerCase() ? WMATIC : tokenA;

    const priceQuickswap = await getPriceFromDEX(
      this.quickswapRouter,
      actualTokenA,
      tokenB,
      amount
    );

    const priceSushiswap = await getPriceFromDEX(
      this.sushiswapRouter,
      actualTokenA,
      tokenB,
      amount
    );

    const profit = priceSushiswap > priceQuickswap 
      ? priceSushiswap - priceQuickswap
      : priceQuickswap - priceSushiswap;

    const gasCost = ethers.parseEther("0.01");
    const flashLoanFee = amount * BigInt(9) / BigInt(10000); // 0.09% as bigint

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
