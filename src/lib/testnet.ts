import { ethers } from 'ethers';
import { toast } from 'sonner';

// Endereços na Mumbai Testnet
export const TESTNET_ADDRESSES = {
  AAVE_POOL: "0x0b913A76beFF3887d35073b8e5530755D60F78C7", // Aave V3 Pool Mumbai
  USDC: "0xe9DcE89B076BA6107Bb64EF30678efec11939234",      // Mumbai USDC
  WMATIC: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",    // Mumbai WMATIC
  WETH: "0x3C68CE8504087f89c640D02d133646d98e64ddd9"       // Mumbai WETH
};

// Mumbai network configuration
const MUMBAI_NETWORK = {
  chainId: '0x13881', // 80001 in hex
  chainName: 'Mumbai',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
};

export const validateTestnetSetup = async () => {
  try {
    if (!window.ethereum) {
      toast.error("MetaMask não encontrada! Instale a extensão.");
      return false;
    }

    // Solicita acesso à carteira
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("Por favor, conecte sua carteira MetaMask");
      } else {
        toast.error("Erro ao conectar carteira");
      }
      return false;
    }

    // Verifica se está na rede Mumbai
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (network.chainId !== 80001n) {
      toast.loading("Alterando para rede Mumbai...", { duration: 2000 });
      
      try {
        // Tenta mudar para Mumbai
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MUMBAI_NETWORK.chainId }],
        });
        toast.success("Rede alterada para Mumbai Testnet");
      } catch (switchError: any) {
        // Se a rede não existe, adiciona
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [MUMBAI_NETWORK],
            });
            toast.success("Rede Mumbai adicionada com sucesso");
          } catch (addError: any) {
            console.error('Erro ao adicionar rede:', addError);
            toast.error("Erro ao adicionar rede Mumbai. Tente adicionar manualmente.");
            return false;
          }
        } else {
          console.error('Erro ao mudar rede:', switchError);
          toast.error("Erro ao mudar para rede Mumbai. Tente mudar manualmente.");
          return false;
        }
      }

      // Verifica novamente se a rede foi alterada
      const updatedNetwork = await provider.getNetwork();
      if (updatedNetwork.chainId !== 80001n) {
        toast.error("Falha ao mudar para rede Mumbai");
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