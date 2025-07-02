/**
 * Simple Test Framework for AutoStream Contracts
 * Provides Jest-like testing functionality without external dependencies
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.describes = [];
    this.currentDescribe = null;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  describe(description, fn) {
    const oldDescribe = this.currentDescribe;
    this.currentDescribe = description;

    console.log(`\n📋 ${description}`);
    console.log("─".repeat(description.length + 4));

    try {
      fn();
    } catch (error) {
      console.error(`❌ Error in describe block: ${error.message}`);
    }

    this.currentDescribe = oldDescribe;
  }

  it(description, fn) {
    const testName = this.currentDescribe
      ? `${this.currentDescribe}: ${description}`
      : description;
    this.tests.push({ name: testName, fn, description });
  }

  beforeEach(fn) {
    this.beforeEachFn = fn;
  }

  afterEach(fn) {
    this.afterEachFn = fn;
  }

  async runTests() {
    console.log("\n🧪 AutoStream Contract Test Suite");
    console.log("══════════════════════════════════");

    for (const test of this.tests) {
      this.stats.total++;

      try {
        // Run beforeEach if defined
        if (this.beforeEachFn) {
          await this.beforeEachFn();
        }

        // Run the actual test
        await test.fn();

        // Run afterEach if defined
        if (this.afterEachFn) {
          await this.afterEachFn();
        }

        console.log(`  ✅ ${test.description}`);
        this.stats.passed++;
      } catch (error) {
        console.log(`  ❌ ${test.description}`);
        console.log(`     Error: ${error.message}`);
        this.stats.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log("\n📊 Test Results");
    console.log("════════════════");
    console.log(`Total: ${this.stats.total}`);
    console.log(`✅ Passed: ${this.stats.passed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);

    const percentage =
      this.stats.total > 0
        ? ((this.stats.passed / this.stats.total) * 100).toFixed(1)
        : 0;
    console.log(`📈 Success Rate: ${percentage}%`);

    if (this.stats.failed > 0) {
      console.log(
        "\n💡 Some tests failed. Check the output above for details."
      );
      process.exit(1);
    } else {
      console.log("\n🎉 All tests passed!");
    }
  }
}

// Assertion functions
class Expect {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${this.actual}`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected undefined, but got ${this.actual}`);
    }
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected value to be defined, but got undefined`);
    }
  }

  toBeLessThan(expected) {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected) {
    if (this.actual > expected) {
      throw new Error(
        `Expected ${this.actual} to be less than or equal to ${expected}`
      );
    }
  }

  toBeGreaterThan(expected) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }

  toEqual(expected) {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`
      );
    }
  }

  toContain(expected) {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    } else if (typeof this.actual === "string") {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected string to contain ${expected}`);
      }
    } else {
      throw new Error(`toContain can only be used with arrays or strings`);
    }
  }

  toThrow(expectedMessage) {
    if (typeof this.actual !== "function") {
      throw new Error("toThrow can only be used with functions");
    }

    let threwError = false;
    let errorMessage = "";

    try {
      this.actual();
    } catch (error) {
      threwError = true;
      errorMessage = error.message;
    }

    if (!threwError) {
      throw new Error("Expected function to throw an error, but it did not");
    }

    if (expectedMessage && !errorMessage.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}", but got "${errorMessage}"`
      );
    }
  }
}

// Global test runner instance
const testRunner = new TestRunner();

// Export testing functions
const describe = (description, fn) => testRunner.describe(description, fn);
const it = (description, fn) => testRunner.it(description, fn);
const expect = (actual) => new Expect(actual);
const beforeEach = (fn) => testRunner.beforeEach(fn);
const afterEach = (fn) => testRunner.afterEach(fn);

// Export test runner for external use
// Use run-tests.js to avoid circular dependencies

module.exports = {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  testRunner,
};
