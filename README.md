# 💧 AutoStream: Fully On-Chain Token Streaming Protocol on Massa

![AutoStream Banner](https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=AutoStream%3A+On-Chain+Token+Streaming)

## 🚀 Overview

AutoStream is a revolutionary decentralized smart contract system that enables automatic, recurring token payments (streams) on the Massa blockchain. Built with **Autonomous Smart Contracts (ASCs)** and **Deferred Calls**, streams operate entirely on-chain without requiring external bots, backends, or user intervention after setup.

### ✨ Key Features

- 🔄 **Fully Autonomous**: No external keepers or oracles needed
- ⚡ **Instant Setup**: Create streams in seconds
- 🛡️ **Completely On-Chain**: Built on Massa's unique ASC technology  
- 🎯 **Flexible Intervals**: Per-second, per-block, or custom intervals
- 💼 **Multiple Use Cases**: Payroll, vesting, subscriptions, donations
- 🌐 **DeWeb Frontend**: Hosted entirely on-chain

## 🏗️ Architecture

```
AutoStream/
├── packages/
│   ├── contracts/          # Massa Smart Contracts (AssemblyScript)
│   │   ├── StreamManager    # Main contract managing all streams
│   │   ├── Stream          # Individual stream logic
│   │   └── TokenWrapper    # MAS/ERC20 token support
│   └── frontend/           # DeWeb Frontend (React + Vite)
│       ├── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Application pages
│       └── providers/      # Massa wallet integration
```

## 🎯 Use Cases

| Use Case | Description |
|----------|-------------|
| 💼 **Payroll Automation** | DAOs stream salaries per block/week/month |
| 🛠️ **Contributor Vesting** | Gradual token release for developers |
| 💸 **Subscriptions** | Small recurring fees for on-chain services |
| 🎓 **Scholarships** | Monthly payments from funding DAOs |
| 🌍 **Micro-donations** | 0.01 MAS/day to public goods |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Massa wallet (Bearby or Station)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/uok825/autostream-massa
cd autostream-massa
```

2. **Install dependencies**
```bash
npm install
```

3. **Build all packages**
```bash
npm run build
```

4. **Start development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📦 Package Scripts

### Root Scripts
```bash
npm run build           # Build all packages
npm run test           # Run all tests
npm run dev            # Start frontend dev server
npm run clean          # Clean all build artifacts
```

### Smart Contracts
```bash
npm run contracts:build    # Build all contracts
npm run contracts:test     # Run contract tests
npm run contracts:deploy   # Deploy to Massa network
```

### Frontend
```bash
npm run frontend:dev       # Start dev server
npm run frontend:build     # Build for production
npm run frontend:preview   # Preview production build
```

## 🔧 Development

### Smart Contracts Development

The contracts are written in **AssemblyScript** for the Massa blockchain:

```typescript
// Create a new stream
export function createStream(
  recipient: Address,
  duration: u64,
  streamType: u8,
  intervalSeconds: u64
): u64
```

Key contracts:
- **StreamManager.ts**: Main contract handling stream creation and management
- **Stream.ts**: Individual stream logic with deferred execution
- **TokenWrapper.ts**: MAS and ERC20-like token support

### Frontend Development

Built with **React + Vite** for optimal DeWeb performance:

- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Massa Web3** for blockchain integration

## 🌐 Deployment

### Smart Contracts

Deploy to Massa testnet:
```bash
cd packages/contracts
npm run deploy
```

### DeWeb Frontend

Build for DeWeb deployment:
```bash
npm run frontend:build
```

The `dist/` folder contains the complete frontend ready for DeWeb hosting.

## 🧪 Testing

### Contract Tests
```bash
npm run contracts:test
```

### Frontend Tests
```bash
npm run frontend:test
```

### E2E Tests
```bash
npm run test:e2e
```

## 🛠️ Technical Implementation

### Deferred Execution Flow

1. **Stream Creation**: User calls `createStream()` with parameters
2. **Escrow**: Total amount locked in contract
3. **Auto-execution**: Deferred calls trigger payments automatically
4. **Payment Processing**: Tokens transferred at each interval
5. **Completion**: Stream ends automatically or via cancellation

### Data Structures

```typescript
struct StreamData {
  sender: Address;
  recipient: Address;
  startTime: u64;
  endTime: u64;
  ratePerSecond: u64;
  lastPaymentTime: u64;
  totalAmount: u64;
  withdrawnAmount: u64;
  isPaused: bool;
  isCancelled: bool;
  streamType: u8;
  intervalSeconds: u64;
}
```

## 🔐 Security Features

- ✅ **Pausable Streams**: Creators can pause/resume
- ✅ **Cancellation**: Early termination with refunds
- ✅ **Access Control**: Only stream creators can modify
- ✅ **Overflow Protection**: Safe math operations
- ✅ **Reentrancy Guards**: Protected state changes

## 🚧 Roadmap

### Phase 1: Core Features ✅
- [x] Basic streaming functionality
- [x] Deferred call integration
- [x] Frontend interface
- [x] Wallet integration

### Phase 2: Advanced Features 🚧
- [ ] Multi-token support
- [ ] NFT streams
- [ ] Conditional logic
- [ ] IPFS metadata

### Phase 3: Ecosystem 🔮
- [ ] DEX integration
- [ ] DAO tooling
- [ ] Mobile app
- [ ] Analytics dashboard

---

*"Making token streaming as simple as turning on a faucet"* 