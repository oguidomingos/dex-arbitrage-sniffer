import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArbitrageCard } from "@/components/ArbitrageCard";
import { connectWallet } from "@/lib/web3";
import { toast } from "sonner";
import { Pause, Play } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { OperationsHistory } from "@/components/operations/OperationsHistory";
import { SimulationRecord } from "@/types/simulation";
import { TestnetSetup } from "@/components/TestnetSetup";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSection, setActiveSection] = useState("opportunities");
  const [simulationHistory, setSimulationHistory] = useState<SimulationRecord[]>([]);
  const [opportunities] = useState([
    {
      tokenA: "MATIC",
      tokenB: "USDC",
      profit: 0.5,
      dexA: "QuickSwap",
      dexB: "SushiSwap",
    },
    {
      tokenA: "WETH",
      tokenB: "USDC",
      profit: 0.3,
      dexA: "SushiSwap",
      dexB: "UniswapV3",
    }
  ]);

  const handleConnect = async () => {
    const signer = await connectWallet();
    if (signer) {
      setConnected(true);
      toast.success("Carteira conectada com sucesso!");
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    toast.success(isPaused ? "Scanner retomado" : "Scanner pausado");
  };

  const handleSimulationComplete = (simulation: SimulationRecord) => {
    setSimulationHistory(prev => [simulation, ...prev]);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnected(true);
          const userAddress = accounts[0].toLowerCase();
          const contractAddress = "0xd6B6C965aAC635B626f8fcF75785645ed6CbbDB5".toLowerCase();
          if (userAddress !== contractAddress) {
            toast.warning("Por favor, conecte a carteira correta que contém os tokens MATIC e WETH");
          }
        }
      }
    };
    checkConnection();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "opportunities";
      setActiveSection(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#1A1F2C] bg-gradient-to-b from-[#221F26] to-[#1A1F2C]">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="container max-w-[1600px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-3xl font-bold text-polygon-purple">
                  {activeSection === "opportunities" && "Oportunidades de Arbitragem"}
                  {activeSection === "operations" && "Operações em Andamento"}
                  {activeSection === "profits" && "Histórico de Lucros"}
                  {activeSection === "settings" && "Configurações"}
                </h1>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={togglePause}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Retomar
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleConnect}
                  variant={connected ? "secondary" : "default"}
                  className="bg-polygon-purple hover:bg-polygon-purple/90 text-white"
                >
                  {connected ? "Conectado" : "Conectar Carteira"}
                </Button>
              </div>
            </div>

            {activeSection === "opportunities" && (
              <div className="space-y-6">
                <TestnetSetup />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opportunities.map((opp, index) => (
                    <ArbitrageCard 
                      key={index} 
                      {...opp} 
                      isPaused={isPaused}
                      onSimulationComplete={handleSimulationComplete}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeSection === "operations" && (
              <OperationsHistory simulations={simulationHistory} />
            )}

            {activeSection === "profits" && (
              <div className="bg-black/20 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Histórico de Lucros</h2>
              </div>
            )}

            {activeSection === "settings" && (
              <div className="bg-black/20 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Configurações</h2>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
