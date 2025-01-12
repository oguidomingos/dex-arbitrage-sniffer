import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços na Mumbai Testnet
export const TESTNET_ADDRESSES = {
  AAVE_POOL: "0x0b913A76beFF3887d35073b8e5530755D60F78C7", // Aave V3 Pool Mumbai
  USDC: "0xe9DcE89B076BA6107Bb64EF30678efec11939234",      // Mumbai USDC
  WMATIC: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",    // Mumbai WMATIC
  WETH: "0x3C68CE8504087f89c640D02d133646d98e64ddd9"       // Mumbai WETH
};

export const validateTestnetSetup = async () => {
  try {
    if (!window.ethereum) {
      toast.error("MetaMask não encontrada! Instale a extensão.");
      return false;
    }

    // Verifica se está na rede Mumbai
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (network.chainId !== 80001n) { // Mumbai chainId
      toast.error("Por favor, conecte-se à rede Mumbai Testnet");
      
      // Tenta mudar para Mumbai
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }], // 80001 em hex
        });
        toast.success("Rede alterada para Mumbai Testnet");
      } catch (switchError: any) {
        // Se a rede não existe, adiciona
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13881',
                chainName: 'Mumbai Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com']
              }],
            });
          } catch (addError) {
            console.error('Erro ao adicionar rede:', addError);
            return false;
          }
        }
        return false;
      }
    }

    // Verifica saldo de MATIC
    const signer = await provider.getSigner();
    const balance = await provider.getBalance(signer.address);
    
    if (balance < ethers.parseEther("0.1")) {
      toast.error("Você precisa de pelo menos 0.1 MATIC para testes");
      toast.info("Pegue MATIC de teste em: https://faucet.polygon.technology/");
      return false;
    }

    console.log("Setup da testnet validado com sucesso!");
    toast.success("Ambiente de teste configurado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro na validação da testnet:", error);
    toast.error("Erro ao validar ambiente de teste");
    return false;
  }
};

export const getTestTokens = async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Links úteis para faucets
    console.log("Links para faucets de teste:");
    console.log("MATIC Faucet: https://faucet.polygon.technology/");
    console.log("USDC Faucet: https://calibration-faucet.filswan.com/");
    
    toast.info("Verifique o console para links de faucets", {
      duration: 5000,
    });

    return {
      address: await signer.getAddress(),
      provider,
      signer
    };
  } catch (error) {
    console.error("Erro ao obter tokens de teste:", error);
    toast.error("Erro ao configurar tokens de teste");
    throw error;
  }
};