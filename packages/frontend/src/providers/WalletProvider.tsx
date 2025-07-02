import React, { createContext, useContext, useState, ReactNode } from 'react'

// Mock Massa wallet types for development
interface WalletContextType {
  isConnected: boolean
  address: string | null
  balance: string | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  sendTransaction: (to: string, amount: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = async () => {
    setIsConnecting(true)
    try {
      // Mock connection logic - replace with actual Massa wallet integration
      // In production, this would use @massalabs/wallet-provider
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsConnected(true)
      setAddress('AS12k3fg7hj8...xyz789')
      setBalance('1,234.56 MAS')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    setBalance(null)
    setIsConnecting(false)
  }

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    // Mock transaction - replace with actual Massa transaction logic
    console.log(`Sending ${amount} MAS to ${to}`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    return 'mock_tx_hash_123456'
  }

  const value: WalletContextType = {
    isConnected,
    address,
    balance,
    isConnecting,
    connect,
    disconnect,
    sendTransaction,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 