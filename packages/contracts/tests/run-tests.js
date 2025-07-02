/**
 * Test Runner for AutoStream Contracts
 * Separate runner to avoid circular dependency issues
 */

const path = require("path");

// Import test framework
const { testRunner } = require("./test-framework");

async function runTests() {
  const testFiles = process.argv.slice(2);

  if (testFiles.length === 0) {
    console.log("❌ No test files specified");
    console.log("Usage: node run-tests.js [test-file1] [test-file2] ...");
    process.exit(1);
  }

  console.log("🔄 Loading test files...");

  // Load each test file
  for (const testFile of testFiles) {
    try {
      const absolutePath = path.resolve(testFile);
      console.log(`   Loading: ${testFile}`);
      require(absolutePath);
    } catch (error) {
      console.error(`❌ Failed to load test file ${testFile}:`, error.message);
    }
  }

  // Run all loaded tests
  console.log("\n🚀 Starting test execution...\n");
  await testRunner.runTests();
}

// Run tests
runTests().catch(console.error);
