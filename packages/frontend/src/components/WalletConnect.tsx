import React, { useState, useEffect } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react'

// Mock wallet state for development
interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  isConnecting: boolean
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
  })
  const [showDropdown, setShowDropdown] = useState(false)

  // Mock wallet connection - replace with actual Massa wallet integration
  const connectWallet = async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }))
    
    // Simulate connection delay
    setTimeout(() => {
      setWallet({
        isConnected: true,
        address: 'AS12k3fg7hj8...xyz789',
        balance: '1,234.56 MAS',
        isConnecting: false,
      })
    }, 1500)
  }

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
    })
    setShowDropdown(false)
  }

  const copyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address)
      // Show toast notification here
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (!wallet.isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={wallet.isConnecting}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {wallet.isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
          <span className="font-mono">{formatAddress(wallet.address!)}</span>
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
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-900">
                    {formatAddress(wallet.address!)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {wallet.balance}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => window.open('https://massa.net/wallet', '_blank')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-3" />
                View in Explorer
              </button>
              <button
                onClick={disconnectWallet}
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
  )
} 