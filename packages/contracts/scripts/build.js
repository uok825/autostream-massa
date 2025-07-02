/**
 * AutoStream Contract Build Script
 * Compiles TypeScript contracts to WASM using Massa toolchain
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class ContractBuilder {
  constructor() {
    this.contractsDir = path.join(__dirname, "../assembly/contracts");
    this.buildDir = path.join(__dirname, "../build");
    this.builtContracts = [];

    // Ensure build directory exists
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
  }

  async buildContract(contractName) {
    console.log(`\n🔨 Building ${contractName}...`);

    try {
      const contractPath = path.join(this.contractsDir, `${contractName}.ts`);
      const outputPath = path.join(this.buildDir, `${contractName}.wasm`);

      if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract source not found: ${contractPath}`);
      }

      // Check if massa-sc-compiler is available
      try {
        execSync("which massa-sc-compiler", { stdio: "ignore" });
      } catch (error) {
        console.log(`⚠️  massa-sc-compiler not found globally.`);
        console.log(`   Trying with npx...`);
      }

      // Compile contract using massa-sc-compiler
      const command = `npx massa-sc-compiler ${contractPath} --output ${outputPath}`;

      console.log(`   Running: ${command}`);

      const result = execSync(command, {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
        encoding: "utf-8",
      });

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✅ ${contractName} compiled successfully!`);
        console.log(`   Output: ${outputPath}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);

        this.builtContracts.push({
          name: contractName,
          path: outputPath,
          size: stats.size,
          timestamp: new Date().toISOString(),
        });

        return outputPath;
      } else {
        throw new Error("Compilation completed but WASM file not found");
      }
    } catch (error) {
      console.error(`❌ Failed to build ${contractName}:`);
      console.error(`   Error: ${error.message}`);

      // If massa-sc-compiler fails, create a fallback JavaScript version
      await this.createFallbackBuild(contractName);
      throw error;
    }
  }

  async createFallbackBuild(contractName) {
    console.log(
      `\n🔄 Creating fallback JavaScript build for ${contractName}...`
    );

    try {
      const contractPath = path.join(this.contractsDir, `${contractName}.ts`);
      const fallbackPath = path.join(this.buildDir, `${contractName}.js`);

      // Simple TypeScript to JavaScript compilation
      const command = `npx tsc ${contractPath} --outDir ${this.buildDir} --target ES2020 --module CommonJS`;

      execSync(command, {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
      });

      if (fs.existsSync(fallbackPath)) {
        console.log(`✅ Fallback JavaScript build created: ${fallbackPath}`);

        this.builtContracts.push({
          name: contractName,
          path: fallbackPath,
          type: "fallback-js",
          size: fs.statSync(fallbackPath).size,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback build also failed: ${fallbackError.message}`);
    }
  }

  async buildAll() {
    console.log("🏗️  AutoStream Contract Build Pipeline");
    console.log("════════════════════════════════════════\n");

    // List available contracts
    const contracts = fs
      .readdirSync(this.contractsDir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => file.replace(".ts", ""));

    console.log(`Found ${contracts.length} contracts to build:`);
    contracts.forEach((contract) => console.log(`  📄 ${contract}`));

    // Build each contract
    for (const contract of contracts) {
      try {
        await this.buildContract(contract);
      } catch (error) {
        console.log(`⚠️  Continuing with remaining contracts...\n`);
      }
    }

    // Generate build summary
    this.generateBuildSummary();
  }

  generateBuildSummary() {
    console.log("\n📊 Build Summary");
    console.log("══════════════════");

    if (this.builtContracts.length === 0) {
      console.log("❌ No contracts were successfully built.");
      console.log("\n💡 Troubleshooting:");
      console.log(
        "1. Install massa-sc-compiler: npm install -g @massalabs/massa-sc-compiler"
      );
      console.log(
        "2. Check that contract source files exist in assembly/contracts/"
      );
      console.log("3. Verify TypeScript syntax is correct");
      return;
    }

    this.builtContracts.forEach((contract) => {
      const sizeKB = (contract.size / 1024).toFixed(2);
      const type = contract.type || "wasm";
      console.log(
        `✅ ${contract.name.padEnd(20)} ${sizeKB.padStart(8)} KB (${type})`
      );
    });

    const totalSize = this.builtContracts.reduce((sum, c) => sum + c.size, 0);
    console.log(`\n📦 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`🎯 Contracts built: ${this.builtContracts.length}`);

    // Save build manifest
    this.saveBuildManifest();

    console.log("\n🎉 Build completed!");
    console.log("📁 Output directory: build/");
    console.log("📋 Next steps:");
    console.log("  1. Run tests: npm run test");
    console.log("  2. Deploy contracts: npm run deploy:testnet");
  }

  saveBuildManifest() {
    const manifest = {
      buildTime: new Date().toISOString(),
      contracts: this.builtContracts,
      totalSize: this.builtContracts.reduce((sum, c) => sum + c.size, 0),
    };

    const manifestPath = path.join(this.buildDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📄 Build manifest saved: ${manifestPath}`);
  }

  static async clean() {
    const buildDir = path.join(__dirname, "../build");
    const deploymentsDir = path.join(__dirname, "../deployments");

    console.log("🧹 Cleaning build artifacts...");

    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true });
      console.log("✅ Removed build/ directory");
    }

    if (fs.existsSync(deploymentsDir)) {
      fs.rmSync(deploymentsDir, { recursive: true });
      console.log("✅ Removed deployments/ directory");
    }

    console.log("🎉 Clean completed!");
  }
}

// CLI execution
async function main() {
  const command = process.argv[2] || "build";

  try {
    switch (command) {
      case "build":
        const builder = new ContractBuilder();
        await builder.buildAll();
        break;

      case "clean":
        await ContractBuilder.clean();
        break;

      case "rebuild":
        await ContractBuilder.clean();
        const rebuilder = new ContractBuilder();
        await rebuilder.buildAll();
        break;

      default:
        console.log("Usage:");
        console.log("  node build.js build    - Build all contracts");
        console.log("  node build.js clean    - Clean build artifacts");
        console.log("  node build.js rebuild  - Clean and build");
    }
  } catch (error) {
    console.error(`❌ Build failed:`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ContractBuilder };
