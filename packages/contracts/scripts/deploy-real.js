/**
 * Real AutoStream Contract Deployment Script
 * Uses actual Massa deployment tools for testnet/mainnet deployment
 */

const fs = require("fs");
const path = require("path");
const {
  DeployContractState,
  deployContract,
  executeFunction,
} = require("@massalabs/massa-sc-deployer");

// Network configurations
const NETWORKS = {
  testnet: {
    name: "testnet",
    rpcUrl: "https://test.massa.net/api/v2",
    chainId: 77658377,
    minimumFee: 100000,
    gasPrice: 1,
  },
  buildnet: {
    name: "buildnet",
    rpcUrl: "https://buildnet.massa.net/api/v2",
    chainId: 77658378, // Assuming a different chain ID for buildnet
    minimumFee: 100000,
    gasPrice: 1,
  },
  mainnet: {
    name: "mainnet",
    rpcUrl: "https://massa.net/api/v2",
    chainId: 77658366,
    minimumFee: 100000,
    gasPrice: 1,
  },
  localnet: {
    name: "localnet",
    rpcUrl: "http://127.0.0.1:33035",
    chainId: 77658377,
    minimumFee: 100000,
    gasPrice: 1,
  },
};

class MassaContractDeployer {
  constructor(network = "testnet", privateKey = null) {
    this.network = NETWORKS[network];
    if (!this.network) {
      throw new Error(
        `Unsupported network: ${network}. Supported: ${Object.keys(NETWORKS).join(", ")}`
      );
    }

    this.privateKey = privateKey || process.env.MASSA_PRIVATE_KEY;
    if (!this.privateKey) {
      throw new Error(
        "Private key required. Set MASSA_PRIVATE_KEY environment variable or pass as parameter."
      );
    }

    this.deployedContracts = {};
    this.deploymentDir = path.join(__dirname, "../deployments");

    // Ensure deployment directory exists
    if (!fs.existsSync(this.deploymentDir)) {
      fs.mkdirSync(this.deploymentDir, { recursive: true });
    }

    console.log(`🌐 Deploying to ${this.network.name}`);
    console.log(`🔗 RPC URL: ${this.network.rpcUrl}`);
  }

  async deployStreamManager() {
    console.log("\n🚀 Deploying StreamManager contract...");

    try {
      // Read the compiled contract bytecode
      const contractPath = path.join(
        __dirname,
        "../build/StreamManagerClean.wasm"
      );

      if (!fs.existsSync(contractPath)) {
        throw new Error(
          `Contract bytecode not found at ${contractPath}. Run 'npm run build' first.`
        );
      }

      const bytecode = fs.readFileSync(contractPath);

      // Deploy contract
      const deployResult = await deployContract({
        byteCode: bytecode,
        maxGas: 3000000, // 3M gas limit
        gasPrice: this.network.gasPrice,
        coins: 0, // No coins sent with deployment
        rpcUrl: this.network.rpcUrl,
        chainId: this.network.chainId,
        privateKey: this.privateKey,
        unsafeParameters: [], // Constructor parameters if any
      });

      if (deployResult.isError) {
        throw new Error(`Deployment failed: ${deployResult.error}`);
      }

      const contractAddress = deployResult.contractAddress;
      const operationId = deployResult.operationId;

      console.log(`✅ StreamManager deployed successfully!`);
      console.log(`   📍 Address: ${contractAddress}`);
      console.log(`   🔍 Operation ID: ${operationId}`);
      console.log(`   ⛽ Gas used: ${deployResult.gasUsed || "Unknown"}`);

      this.deployedContracts.StreamManager = {
        address: contractAddress,
        operationId: operationId,
        deployedAt: new Date().toISOString(),
        gasUsed: deployResult.gasUsed,
        network: this.network.name,
      };

      return contractAddress;
    } catch (error) {
      console.error(`❌ StreamManager deployment failed:`, error.message);
      throw error;
    }
  }

  async deployTokenWrapper() {
    console.log("\n🪙 Deploying TokenWrapper contract...");

    try {
      // For now, we'll skip TokenWrapper as it's optional
      // In a real deployment, you'd have a separate TokenWrapper.wasm file
      console.log("⏭️  Skipping TokenWrapper deployment (not implemented yet)");

      return null;
    } catch (error) {
      console.error(`❌ TokenWrapper deployment failed:`, error.message);
      throw error;
    }
  }

  async verifyDeployment(contractAddress) {
    console.log(`\n🔍 Verifying deployment of ${contractAddress}...`);

    try {
      // Test contract by calling a read-only function
      const result = await executeFunction({
        targetContract: contractAddress,
        targetFunction: "getStreamCount",
        parameter: [],
        callerPrivateKey: this.privateKey,
        maxGas: 1000000,
        gasPrice: this.network.gasPrice,
        coins: 0,
        rpcUrl: this.network.rpcUrl,
        chainId: this.network.chainId,
      });

      if (result.isError) {
        throw new Error(`Verification failed: ${result.error}`);
      }

      console.log(`✅ Contract verification successful!`);
      console.log(`   📊 Initial stream count: ${result.returnValue || "0"}`);

      return true;
    } catch (error) {
      console.error(`❌ Contract verification failed:`, error.message);
      return false;
    }
  }

  async deployAll() {
    console.log("🏗️  Starting AutoStream deployment pipeline...\n");

    try {
      // Deploy StreamManager
      const streamManagerAddress = await this.deployStreamManager();

      // Verify deployment
      const isVerified = await this.verifyDeployment(streamManagerAddress);
      if (!isVerified) {
        throw new Error("Contract verification failed");
      }

      // Deploy TokenWrapper (optional)
      await this.deployTokenWrapper();

      // Save deployment information
      await this.saveDeploymentInfo();

      // Display summary
      this.displayDeploymentSummary();

      return this.deployedContracts;
    } catch (error) {
      console.error("\n💥 Deployment pipeline failed:", error.message);
      throw error;
    }
  }

  async saveDeploymentInfo() {
    const deploymentFile = path.join(
      this.deploymentDir,
      `${this.network.name}.json`
    );

    const deploymentData = {
      network: this.network.name,
      networkConfig: this.network,
      deployedAt: new Date().toISOString(),
      contracts: this.deployedContracts,
      deployer: {
        // Don't save private key, just a hint
        publicKeyHint: this.privateKey.slice(0, 10) + "...",
      },
    };

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment info saved to ${deploymentFile}`);
  }

  displayDeploymentSummary() {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║                 DEPLOYMENT SUMMARY               ║");
    console.log("╠══════════════════════════════════════════════════╣");

    Object.entries(this.deployedContracts).forEach(([name, info]) => {
      console.log(`║ ${name.padEnd(20)} │ ${info.address.slice(0, 20)}... ║`);
    });

    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`\n🌐 Network: ${this.network.name}`);
    console.log(
      `📁 Deployment details saved in: deployments/${this.network.name}.json`
    );
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend with contract addresses");
    console.log("2. Test contract functions");
    console.log("3. Set up monitoring and alerts");
    console.log("4. Document API endpoints for dApp integration");
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

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log(`📖 Loaded deployment for ${network}:`);
    console.table(deployment.contracts);

    return deployment;
  }

  static async callContractFunction(
    network,
    contractName,
    functionName,
    parameters = []
  ) {
    const deployment = await this.loadDeployment(network);
    const contract = deployment.contracts[contractName];

    if (!contract) {
      throw new Error(
        `Contract ${contractName} not found in ${network} deployment`
      );
    }

    const networkConfig = NETWORKS[network];
    const privateKey = process.env.MASSA_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("MASSA_PRIVATE_KEY environment variable required");
    }

    console.log(`📞 Calling ${contractName}.${functionName}()...`);

    const result = await executeFunction({
      targetContract: contract.address,
      targetFunction: functionName,
      parameter: parameters,
      callerPrivateKey: privateKey,
      maxGas: 2000000,
      gasPrice: networkConfig.gasPrice,
      coins: 0,
      rpcUrl: networkConfig.rpcUrl,
      chainId: networkConfig.chainId,
    });

    if (result.isError) {
      throw new Error(`Function call failed: ${result.error}`);
    }

    console.log(`✅ Function call successful`);
    console.log(`📤 Return value: ${result.returnValue}`);
    console.log(`⛽ Gas used: ${result.gasUsed}`);

    return result;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "deploy";
  const network = args[1] || "testnet";

  try {
    switch (command) {
      case "deploy":
        const deployer = new MassaContractDeployer(network);
        await deployer.deployAll();
        break;

      case "verify":
        const contractAddress = args[2];
        if (!contractAddress) {
          throw new Error("Contract address required for verification");
        }
        const verifier = new MassaContractDeployer(network);
        await verifier.verifyDeployment(contractAddress);
        break;

      case "load":
        await MassaContractDeployer.loadDeployment(network);
        break;

      case "call":
        const contractName = args[2];
        const functionName = args[3];
        const parameters = args.slice(4);
        await MassaContractDeployer.callContractFunction(
          network,
          contractName,
          functionName,
          parameters
        );
        break;

      default:
        console.log("Usage:");
        console.log(
          "  node deploy-real.js deploy [network]     - Deploy contracts"
        );
        console.log(
          "  node deploy-real.js verify [network] [address] - Verify contract"
        );
        console.log(
          "  node deploy-real.js load [network]      - Load deployment info"
        );
        console.log(
          "  node deploy-real.js call [network] [contract] [function] [args...] - Call function"
        );
        console.log("");
        console.log("Networks: testnet, buildnet, mainnet, localnet");
        console.log("Environment: Set MASSA_PRIVATE_KEY");
    }
  } catch (error) {
    console.error(`❌ Command failed:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MassaContractDeployer };
