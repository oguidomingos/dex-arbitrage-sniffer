export const validateArbitrageParameters = (
  tokenA: string,
  tokenB: string,
  dexA: string,
  dexB: string
): string | null => {
  // Validação dos tokens
  if (!tokenA || !tokenB) {
    return "Tokens inválidos";
  }

  // Validação das DEXs
  if (!dexA || !dexB) {
    return "DEXs inválidas";
  }

  // Verifica se as DEXs são diferentes
  if (dexA === dexB) {
    return "As DEXs precisam ser diferentes para arbitragem";
  }

  // Verifica se os tokens são diferentes
  if (tokenA === tokenB) {
    return "Os tokens precisam ser diferentes para arbitragem";
  }

  // Validação de tokens suportados
  const supportedTokens = ['MATIC', 'USDC', 'WETH', 'USDT'];
  if (!supportedTokens.includes(tokenA) || !supportedTokens.includes(tokenB)) {
    return "Token não suportado";
  }

  // Validação de DEXs suportadas
  const supportedDexs = ['QuickSwap', 'SushiSwap', 'UniswapV3'];
  if (!supportedDexs.includes(dexA) || !supportedDexs.includes(dexB)) {
    return "DEX não suportada";
  }

  return null;
};

export const validateTransactionParameters = (
  amount: string,
  gasPrice: bigint,
  balance: bigint
): string | null => {
  // Validação do valor da transação
  if (parseFloat(amount) <= 0) {
    return "Valor da transação deve ser maior que zero";
  }

  // Validação do preço do gas
  if (gasPrice <= 0n) {
    return "Preço do gas inválido";
  }

  // Validação do saldo
  if (balance <= 0n) {
    return "Saldo insuficiente";
  }

  return null;
};