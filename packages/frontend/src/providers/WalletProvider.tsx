import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getWallets, Wallet, WalletName } from "@massalabs/wallet-provider";
import { IBalance, NetworkName } from "@massalabs/massa-web3";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  wallet: Wallet | null;
  provider: any | null;
  network: any | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  availableWallets: Wallet[];
  selectWallet: (wallet: Wallet) => void;
  selectedWallet: Wallet | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [network, setNetwork] = useState<any | null>(null);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  // Load available wallets on mount
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const wallets = await getWallets(1000); // 1 second delay to allow wallets to initialize
        setAvailableWallets(wallets);

        // Auto-select MassaStation if available
        const massaWallet = wallets.find(
          (w) => w.name() === WalletName.MassaWallet
        );
        if (massaWallet && massaWallet.enabled()) {
          setSelectedWallet(massaWallet);
        } else if (wallets.length > 0) {
          setSelectedWallet(wallets[0]); // Fallback to first available wallet
        }
      } catch (error) {
        console.error("Failed to load wallets:", error);
      }
    };

    loadWallets();
  }, []);

  const selectWallet = (newWallet: Wallet) => {
    setSelectedWallet(newWallet);
    // If currently connected to a different wallet, disconnect first
    if (wallet && wallet !== newWallet) {
      disconnect();
    }
  };

  const connect = async () => {
    if (!selectedWallet) {
      throw new Error("No wallet selected");
    }

    setIsConnecting(true);
    try {
      // Check if wallet is enabled
      if (!selectedWallet.enabled()) {
        throw new Error(
          `${selectedWallet.name()} wallet is not available. Please install the wallet extension.`
        );
      }

      // Connect to the wallet
      const connected = await selectedWallet.connect();
      if (!connected) {
        throw new Error("Failed to connect to wallet");
      }

      // Get accounts
      const accounts = await selectedWallet.accounts();
      if (accounts.length === 0) {
        throw new Error("No accounts found in wallet");
      }

      const firstAccount = accounts[0];

      // Get network info
      const networkInfo = await selectedWallet.networkInfos();

      // Get balance
      const accountBalance = await firstAccount.balance();

      setWallet(selectedWallet);
      setProvider(firstAccount);
      setNetwork(networkInfo);
      setIsConnected(true);
      setAddress(firstAccount.address);
      setBalance(`${(Number(accountBalance.final) / 1e9).toFixed(2)} MAS`); // Convert from nanoMAS to MAS

      // Listen for account changes
      selectedWallet.listenAccountChanges?.((newAddress: string) => {
        if (newAddress !== address) {
          // Account changed, refresh the connection
          connect();
        }
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
    }
    setIsConnected(false);
    setAddress(null);
    setBalance(null);
    setIsConnecting(false);
    setWallet(null);
    setProvider(null);
    setNetwork(null);
  };

  const sendTransaction = async (
    to: string,
    amount: string
  ): Promise<string> => {
    if (!provider) {
      throw new Error("No wallet connected");
    }

    try {
      // Convert amount from MAS to nanoMAS
      const amountInNanoMAS = BigInt(Math.floor(parseFloat(amount) * 1e9));

      // Send transaction
      const result = await provider.sendTransaction({
        recipientAddress: to,
        amount: amountInNanoMAS,
        fee: BigInt(1000000), // 0.001 MAS fee
      });

      return result.operationId;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      throw error;
    }
  };

  const value: WalletContextType = {
    isConnected,
    address,
    balance,
    isConnecting,
    wallet,
    provider,
    network,
    connect,
    disconnect,
    sendTransaction,
    availableWallets,
    selectWallet,
    selectedWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
