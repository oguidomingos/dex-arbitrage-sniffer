import { ethers } from 'ethers';

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
    // Mapeia os símbolos dos tokens para seus endereços
    const tokenAddressMap: { [key: string]: string } = {
      'MATIC': WMATIC,
      'WETH': WETH,
      'USDC': USDC
    };

    // Se for passado um símbolo, converte para o endereço correspondente
    const actualTokenAddress = tokenAddressMap[tokenAddress] || tokenAddress;
    
    const provider = getProvider();
    const quickswapRouter = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
    const sushiswapRouter = new ethers.Contract(SUSHISWAP_ROUTER, ROUTER_ABI, provider);
    
    const amountIn = ethers.parseUnits("1", 18);
    let path: string[];
    
    // Se o token for USDC, inverte o path para obter o preço correto
    if (actualTokenAddress === USDC) {
      path = [WMATIC, USDC];
      const amountsQuickswap = await quickswapRouter.getAmountsOut.staticCall(amountIn, path);
      const amountsSushiswap = await sushiswapRouter.getAmountsOut.staticCall(amountIn, path);
      
      // Calcula o preço inverso para USDC
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