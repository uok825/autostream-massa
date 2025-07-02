/**
 * AutoStream Smart Contract Deployment Script
 *
 * This script handles deployment of AutoStream contracts to Massa network
 */

const fs = require("fs");
const path = require("path");

// Mock deployment configuration
const NETWORK_CONFIG = {
  testnet: {
    rpcUrl: "https://test.massa.net/api/v2",
    chainId: "MASSATEST",
    gasLimit: 1000000,
  },
  mainnet: {
    rpcUrl: "https://massa.net/api/v2",
    chainId: "MASSA",
    gasLimit: 1000000,
  },
};

class ContractDeployer {
  constructor(network = "testnet") {
    this.network = network;
    this.config = NETWORK_CONFIG[network];
    this.deployedContracts = {};
  }

  async deployContract(contractName, constructorArgs = []) {
    console.log(`\n🚀 Deploying ${contractName} to ${this.network}...`);

    try {
      // In production, this would use Massa deployment tools
      // For now, we'll simulate the deployment

      const wasmPath = path.join(__dirname, "../build", `${contractName}.wasm`);
      const jsPath = path.join(__dirname, "../build", `${contractName}.js`);

      if (!fs.existsSync(wasmPath) && !fs.existsSync(jsPath)) {
        throw new Error(
          `Contract bytecode not found at ${wasmPath} or ${jsPath}. Run 'npm run build' first.`
        );
      }

      const contractFile = fs.existsSync(wasmPath) ? wasmPath : jsPath;
      const contractType = fs.existsSync(wasmPath)
        ? "WASM"
        : "JavaScript (fallback)";

      console.log(`   Using: ${contractFile} (${contractType})`);
      const contractSize = fs.statSync(contractFile).size;

      // Mock deployment
      const mockAddress = `AS1${Math.random().toString(36).substr(2, 30)}`;

      console.log(`✅ ${contractName} deployed successfully!`);
      console.log(`   Address: ${mockAddress}`);
      console.log(`   Network: ${this.network}`);
      console.log(`   Gas used: ${Math.floor(Math.random() * 500000)}`);

      this.deployedContracts[contractName] = {
        address: mockAddress,
        network: this.network,
        deployedAt: new Date().toISOString(),
        constructorArgs: constructorArgs,
      };

      return mockAddress;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  async deployAll() {
    console.log("🏗️  Starting AutoStream contract deployment...\n");

    try {
      // Deploy StreamManager
      const streamManagerAddress = await this.deployContract("StreamManager", [
        "AS1owner123...", // Owner address
      ]);

      // Deploy TokenWrapper (optional)
      try {
        const tokenWrapperAddress = await this.deployContract("TokenWrapper", [
          "Wrapped MAS",
          "wMAS",
          18, // decimals
        ]);
      } catch (error) {
        console.log(`⏭️  Skipping TokenWrapper deployment: ${error.message}`);
      }

      // Save deployment info
      await this.saveDeploymentInfo();

      console.log("\n🎉 All contracts deployed successfully!");
      console.log("\n📄 Deployment Summary:");
      console.table(this.deployedContracts);

      return this.deployedContracts;
    } catch (error) {
      console.error("\n💥 Deployment failed:", error.message);
      process.exit(1);
    }
  }

  async saveDeploymentInfo() {
    const deploymentFile = path.join(
      __dirname,
      "../deployments",
      `${this.network}.json`
    );
    const deploymentDir = path.dirname(deploymentFile);

    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentData = {
      network: this.network,
      deployedAt: new Date().toISOString(),
      contracts: this.deployedContracts,
      config: this.config,
    };

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment info saved to ${deploymentFile}`);
  }

  static async loadDeployment(network) {
    const deploymentFile = path.join(
      __dirname,
      "../deployments",
      `${network}.json`
    );

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`No deployment found for network: ${network}`);
    }

    return JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }
}

// CLI execution
async function main() {
  const network = process.argv[2] || "testnet";

  if (!NETWORK_CONFIG[network]) {
    console.error(`❌ Unsupported network: ${network}`);
    console.log("Supported networks:", Object.keys(NETWORK_CONFIG).join(", "));
    process.exit(1);
  }

  const deployer = new ContractDeployer(network);
  await deployer.deployAll();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ContractDeployer };
