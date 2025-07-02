/**
 * StreamManager Unit Tests
 * Comprehensive test suite for AutoStream smart contracts
 */

const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require("./test-framework");

// Mock contract implementation for testing
class MockStreamManager {
  constructor() {
    this.streams = new Map();
    this.streamCounter = 0;
    this.currentTime = Date.now();
  }

  setCurrentTime(timestamp) {
    this.currentTime = timestamp;
  }

  createStream(recipient, duration, streamType, interval, totalAmount) {
    const streamId = this.streamCounter++;
    const stream = {
      id: streamId,
      sender: "AS1TestSender123",
      recipient: recipient,
      totalAmount: totalAmount,
      withdrawnAmount: 0,
      startTime: this.currentTime,
      endTime: this.currentTime + duration * 1000,
      ratePerSecond: totalAmount / duration,
      streamType: streamType,
      interval: interval,
      isPaused: false,
      isCancelled: false,
      lastWithdrawTime: this.currentTime,
    };

    this.streams.set(streamId, stream);
    return streamId;
  }

  getStream(streamId) {
    return this.streams.get(streamId);
  }

  pauseStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream && !stream.isCancelled) {
      stream.isPaused = true;
      return true;
    }
    return false;
  }

  resumeStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream && !stream.isCancelled) {
      stream.isPaused = false;
      return true;
    }
    return false;
  }

  cancelStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.isCancelled = true;
      return true;
    }
    return false;
  }

  getWithdrawableAmount(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream || stream.isCancelled || stream.isPaused) {
      return 0;
    }

    const elapsed = Math.min(
      this.currentTime - stream.lastWithdrawTime,
      stream.endTime - stream.startTime
    );
    const elapsedSeconds = elapsed / 1000;
    const withdrawable = Math.floor(elapsedSeconds * stream.ratePerSecond);

    return Math.min(withdrawable, stream.totalAmount - stream.withdrawnAmount);
  }

  processStreamPayment(streamId) {
    const withdrawable = this.getWithdrawableAmount(streamId);
    if (withdrawable > 0) {
      const stream = this.streams.get(streamId);
      stream.withdrawnAmount += withdrawable;
      stream.lastWithdrawTime = this.currentTime;
      return withdrawable;
    }
    return 0;
  }

  getAllStreams() {
    return Array.from(this.streams.values());
  }

  getStreamCount() {
    return this.streams.size;
  }
}

// Global contract instance for all tests
let contract;

// Initialize contract before each test - this runs for ALL tests
beforeEach(() => {
  contract = new MockStreamManager();
});

describe("Stream Creation", () => {
  it("should create a new stream with correct parameters", () => {
    const recipient = "AS1RecipientTest123";
    const duration = 3600; // 1 hour
    const totalAmount = 1000;

    const streamId = contract.createStream(
      recipient,
      duration,
      0,
      60,
      totalAmount
    );

    const stream = contract.getStream(streamId);
    expect(stream).toBeDefined();
    expect(stream.recipient).toBe(recipient);
    expect(stream.totalAmount).toBe(totalAmount);
    expect(stream.withdrawnAmount).toBe(0);
    expect(stream.isPaused).toBe(false);
    expect(stream.isCancelled).toBe(false);
  });

  it("should calculate correct rate per second", () => {
    const duration = 3600; // 1 hour
    const totalAmount = 3600; // 1 token per second

    const streamId = contract.createStream(
      "AS1Test",
      duration,
      0,
      60,
      totalAmount
    );
    const stream = contract.getStream(streamId);

    expect(stream.ratePerSecond).toBe(1); // 1 token per second
  });

  it("should increment stream counter", () => {
    expect(contract.getStreamCount()).toBe(0);

    contract.createStream("AS1Test1", 3600, 0, 60, 1000);
    expect(contract.getStreamCount()).toBe(1);

    contract.createStream("AS1Test2", 1800, 0, 30, 500);
    expect(contract.getStreamCount()).toBe(2);
  });
});

describe("Stream Control", () => {
  it("should pause a stream", () => {
    // Create stream within the test
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 1000);

    const result = contract.pauseStream(streamId);
    const stream = contract.getStream(streamId);

    expect(result).toBe(true);
    expect(stream.isPaused).toBe(true);
  });

  it("should resume a paused stream", () => {
    // Create stream within the test
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 1000);

    contract.pauseStream(streamId);
    const result = contract.resumeStream(streamId);
    const stream = contract.getStream(streamId);

    expect(result).toBe(true);
    expect(stream.isPaused).toBe(false);
  });

  it("should cancel a stream", () => {
    // Create stream within the test
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 1000);

    const result = contract.cancelStream(streamId);
    const stream = contract.getStream(streamId);

    expect(result).toBe(true);
    expect(stream.isCancelled).toBe(true);
  });

  it("should not allow operations on cancelled stream", () => {
    // Create stream within the test
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 1000);

    contract.cancelStream(streamId);

    const pauseResult = contract.pauseStream(streamId);
    const resumeResult = contract.resumeStream(streamId);

    expect(pauseResult).toBe(false);
    expect(resumeResult).toBe(false);
  });
});

describe("Payment Processing", () => {
  it("should calculate withdrawable amount correctly", () => {
    // Create stream: 3600 tokens over 3600 seconds = 1 token/second
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 3600);

    // Simulate 60 seconds passing
    contract.setCurrentTime(contract.currentTime + 60000);

    const withdrawable = contract.getWithdrawableAmount(streamId);
    expect(withdrawable).toBe(60); // 60 seconds * 1 token/second
  });

  it("should process payments correctly", () => {
    // Create stream: 3600 tokens over 3600 seconds = 1 token/second
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 3600);

    // Simulate 120 seconds passing
    contract.setCurrentTime(contract.currentTime + 120000);

    const processed = contract.processStreamPayment(streamId);
    const stream = contract.getStream(streamId);

    expect(processed).toBe(120);
    expect(stream.withdrawnAmount).toBe(120);
  });

  it("should not allow withdrawal from paused stream", () => {
    // Create stream: 3600 tokens over 3600 seconds = 1 token/second
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 3600);

    contract.pauseStream(streamId);
    contract.setCurrentTime(contract.currentTime + 60000);

    const withdrawable = contract.getWithdrawableAmount(streamId);
    expect(withdrawable).toBe(0);
  });

  it("should not allow withdrawal from cancelled stream", () => {
    // Create stream: 3600 tokens over 3600 seconds = 1 token/second
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 3600);

    contract.cancelStream(streamId);
    contract.setCurrentTime(contract.currentTime + 60000);

    const withdrawable = contract.getWithdrawableAmount(streamId);
    expect(withdrawable).toBe(0);
  });

  it("should not exceed total stream amount", () => {
    // Create stream: 3600 tokens over 3600 seconds = 1 token/second
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 3600);

    // Simulate time passing beyond stream duration
    contract.setCurrentTime(contract.currentTime + 7200000); // 2 hours

    const withdrawable = contract.getWithdrawableAmount(streamId);
    expect(withdrawable).toBeLessThanOrEqual(3600); // Total amount
  });
});

describe("Edge Cases", () => {
  it("should handle invalid stream IDs gracefully", () => {
    const stream = contract.getStream(999);
    expect(stream).toBeUndefined();

    const pauseResult = contract.pauseStream(999);
    expect(pauseResult).toBe(false);
  });

  it("should handle zero amount streams", () => {
    const streamId = contract.createStream("AS1Test", 3600, 0, 60, 0);
    const stream = contract.getStream(streamId);

    expect(stream.totalAmount).toBe(0);
    expect(stream.ratePerSecond).toBe(0);
  });

  it("should handle very short duration streams", () => {
    const streamId = contract.createStream("AS1Test", 1, 0, 1, 100);
    const stream = contract.getStream(streamId);

    expect(stream.ratePerSecond).toBe(100);
  });
});

describe("Multiple Streams", () => {
  it("should handle multiple concurrent streams", () => {
    const stream1 = contract.createStream("AS1Test1", 3600, 0, 60, 1000);
    const stream2 = contract.createStream("AS1Test2", 1800, 0, 30, 500);
    const stream3 = contract.createStream("AS1Test3", 7200, 0, 120, 2000);

    expect(contract.getStreamCount()).toBe(3);

    const allStreams = contract.getAllStreams();
    expect(allStreams.length).toBe(3);
    expect(allStreams[0].recipient).toBe("AS1Test1");
    expect(allStreams[1].recipient).toBe("AS1Test2");
    expect(allStreams[2].recipient).toBe("AS1Test3");
  });

  it("should process payments independently for multiple streams", () => {
    const stream1 = contract.createStream("AS1Test1", 3600, 0, 60, 3600);
    const stream2 = contract.createStream("AS1Test2", 1800, 0, 30, 1800);

    // Simulate 60 seconds
    contract.setCurrentTime(contract.currentTime + 60000);

    const payment1 = contract.processStreamPayment(stream1);
    const payment2 = contract.processStreamPayment(stream2);

    expect(payment1).toBe(60); // 1 token/second * 60 seconds
    expect(payment2).toBe(60); // 1 token/second * 60 seconds
  });
});

// Export for other test files
module.exports = { MockStreamManager };
