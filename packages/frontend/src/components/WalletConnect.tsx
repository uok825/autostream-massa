import { useState } from "react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "../providers/WalletProvider";

export function WalletConnect() {
  const {
    isConnected,
    address,
    balance,
    isConnecting,
    connect,
    disconnect,
    availableWallets,
    selectedWallet,
    selectWallet,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (error) {
      console.error("Connection failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowDropdown(false);
    } catch (error) {
      console.error("Disconnection failed:", error);
    }
  };

  const handleWalletSelect = (wallet: any) => {
    selectWallet(wallet);
    setShowWalletSelector(false);
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        // Could add toast notification here
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Error display
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-xs">{error.slice(0, 30)}...</span>
        </div>
        <button
          onClick={() => setError(null)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Wallet selection dialog
  if (showWalletSelector && availableWallets.length > 0) {
    return (
      <div className="relative">
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900">
                Select Wallet
              </span>
            </div>
            {availableWallets.map((wallet, index) => (
              <button
                key={index}
                onClick={() => handleWalletSelect(wallet)}
                disabled={!wallet.enabled()}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wallet className="h-4 w-4 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{wallet.name()}</span>
                  {!wallet.enabled() && (
                    <span className="text-xs text-red-500">Not installed</span>
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowWalletSelector(false)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors border-t border-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletSelector(false)}
        />
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        {/* Wallet selector button */}
        {availableWallets.length > 1 && (
          <button
            onClick={() => setShowWalletSelector(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting || availableWallets.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : availableWallets.length === 0 ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              No Wallets
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              Connect {selectedWallet?.name() || "Wallet"}
            </>
          )}
        </button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
          <span className="font-mono">
            {address ? formatAddress(address) : "Connected"}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </div>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* Account Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Connected Account</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  {selectedWallet && (
                    <span className="text-xs text-gray-400">
                      {selectedWallet.name()}
                    </span>
                  )}
                </div>
              </div>
              {address && (
                <div className="mt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-900">
                      {formatAddress(address)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {balance && (
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      {balance}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() =>
                  window.open("https://massa.net/wallet", "_blank")
                }
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-3" />
                View in Explorer
              </button>

              {availableWallets.length > 1 && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowWalletSelector(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Wallet className="h-4 w-4 mr-3" />
                  Switch Wallet
                </button>
              )}

              <button
                onClick={handleDisconnect}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
