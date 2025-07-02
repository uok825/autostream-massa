/**
 * AutoStream Contract Demo - Pure JavaScript
 * Demonstrates the streaming contract functionality without compilation
 */

// Stream data structure
class StreamData {
  constructor() {
    this.sender = "";
    this.recipient = "";
    this.startTime = 0;
    this.endTime = 0;
    this.ratePerSecond = 0;
    this.lastPaymentTime = 0;
    this.totalAmount = 0;
    this.withdrawnAmount = 0;
    this.isPaused = false;
    this.isCancelled = false;
    this.streamType = 0; // 0: time-based, 1: block-based
    this.intervalSeconds = 1;
  }
}

// Storage simulation
let streams = new Map();
let streamCounter = 0;
let contractOwner = "";

// Events (simplified logging)
function logEvent(eventName, data) {
  console.log(`Event: ${eventName} - ${data.join(", ")}`);
}

/**
 * Initialize the StreamManager contract
 */
function constructor() {
  contractOwner = "owner_address";
  streamCounter = 0;
  logEvent("StreamManagerInitialized", [contractOwner]);
}

/**
 * Create a new token stream
 */
function createStream(
  recipient,
  duration,
  streamType,
  intervalSeconds,
  totalAmount
) {
  // Validate inputs
  if (totalAmount <= 0) throw new Error("Total amount must be positive");
  if (duration <= 0) throw new Error("Duration must be positive");
  if (intervalSeconds <= 0) throw new Error("Interval must be positive");

  // Calculate rate per second
  const ratePerSecond = totalAmount / duration;
  if (ratePerSecond <= 0) throw new Error("Rate per second must be positive");

  // Get next stream ID
  const streamId = ++streamCounter;

  // Create stream data
  const currentTime = Date.now();
  const stream = new StreamData();
  stream.sender = "caller_address"; // In production: Context.caller()
  stream.recipient = recipient;
  stream.startTime = currentTime;
  stream.endTime = currentTime + duration * 1000;
  stream.ratePerSecond = ratePerSecond;
  stream.lastPaymentTime = currentTime;
  stream.totalAmount = totalAmount;
  stream.withdrawnAmount = 0;
  stream.isPaused = false;
  stream.isCancelled = false;
  stream.streamType = streamType;
  stream.intervalSeconds = intervalSeconds;

  // Store the stream
  streams.set(streamId, stream);

  // Log stream creation
  logEvent("StreamCreated", [
    streamId.toString(),
    stream.sender,
    recipient,
    totalAmount.toString(),
    duration.toString(),
  ]);

  return streamId;
}

/**
 * Process a stream payment (called by deferred calls)
 */
function processStreamPayment(streamId) {
  const stream = streams.get(streamId);
  if (!stream) {
    console.log("Stream not found: " + streamId.toString());
    return;
  }

  if (stream.isCancelled || stream.isPaused) {
    return; // Skip processing
  }

  const currentTime = Date.now();

  // Check if stream has ended
  if (currentTime >= stream.endTime) {
    // Final payment
    const remainingAmount = stream.totalAmount - stream.withdrawnAmount;
    if (remainingAmount > 0) {
      mockTransfer(stream.recipient, remainingAmount);
      stream.withdrawnAmount = stream.totalAmount;
      logEvent("StreamPayment", [
        streamId.toString(),
        stream.recipient,
        remainingAmount.toString(),
        "final",
      ]);
    }

    // Mark stream as completed
    stream.isCancelled = true;
    streams.set(streamId, stream);
    return;
  }

  // Calculate payment amount
  const timeSinceLastPayment = currentTime - stream.lastPaymentTime;
  const paymentAmount = (timeSinceLastPayment * stream.ratePerSecond) / 1000;

  if (
    paymentAmount > 0 &&
    stream.withdrawnAmount + paymentAmount <= stream.totalAmount
  ) {
    // Transfer payment
    mockTransfer(stream.recipient, paymentAmount);

    // Update stream state
    stream.withdrawnAmount += paymentAmount;
    stream.lastPaymentTime = currentTime;
    streams.set(streamId, stream);

    logEvent("StreamPayment", [
      streamId.toString(),
      stream.recipient,
      paymentAmount.toString(),
      "regular",
    ]);
  }
}

/**
 * Cancel a stream
 */
function cancelStream(streamId) {
  const stream = streams.get(streamId);
  if (!stream) {
    console.log("Stream not found: " + streamId.toString());
    return;
  }

  if (stream.isCancelled) {
    console.log("Stream already cancelled");
    return;
  }

  // Calculate refund amount
  const remainingAmount = stream.totalAmount - stream.withdrawnAmount;

  // Mark as cancelled
  stream.isCancelled = true;
  streams.set(streamId, stream);

  // Refund remaining amount to sender
  if (remainingAmount > 0) {
    mockTransfer(stream.sender, remainingAmount);
  }

  logEvent("StreamCancelled", [
    streamId.toString(),
    stream.sender,
    remainingAmount.toString(),
  ]);
}

/**
 * Pause a stream
 */
function pauseStream(streamId) {
  const stream = streams.get(streamId);
  if (!stream) {
    console.log("Stream not found: " + streamId.toString());
    return;
  }

  if (stream.isCancelled) {
    console.log("Stream is cancelled");
    return;
  }

  if (stream.isPaused) {
    console.log("Stream already paused");
    return;
  }

  stream.isPaused = true;
  streams.set(streamId, stream);
  logEvent("StreamPaused", [streamId.toString()]);
}

/**
 * Resume a paused stream
 */
function resumeStream(streamId) {
  const stream = streams.get(streamId);
  if (!stream) {
    console.log("Stream not found: " + streamId.toString());
    return;
  }

  if (stream.isCancelled) {
    console.log("Stream is cancelled");
    return;
  }

  if (!stream.isPaused) {
    console.log("Stream is not paused");
    return;
  }

  stream.isPaused = false;
  stream.lastPaymentTime = Date.now(); // Reset payment time
  streams.set(streamId, stream);

  logEvent("StreamResumed", [streamId.toString()]);
}

/**
 * Get stream information
 */
function getStream(streamId) {
  return streams.get(streamId) || null;
}

/**
 * Get total number of streams
 */
function getStreamCount() {
  return streamCounter;
}

/**
 * Calculate withdrawable amount for a stream
 */
function getWithdrawableAmount(streamId) {
  const stream = streams.get(streamId);
  if (!stream) {
    return 0;
  }

  if (stream.isCancelled || stream.isPaused) {
    return 0;
  }

  const currentTime = Date.now();
  const elapsedTime = currentTime - stream.lastPaymentTime;
  const earnedAmount = (elapsedTime * stream.ratePerSecond) / 1000;
  const maxWithdrawable = stream.totalAmount - stream.withdrawnAmount;

  return earnedAmount > maxWithdrawable ? maxWithdrawable : earnedAmount;
}

/**
 * Get all streams (for debugging)
 */
function getAllStreams() {
  const allStreams = [];
  const keys = Array.from(streams.keys());

  for (let i = 0; i < keys.length; i++) {
    const stream = streams.get(keys[i]);
    if (stream) {
      allStreams.push(stream);
    }
  }

  return allStreams;
}

/**
 * Mock transfer function
 * In production, this would use Massa's transferCoins
 */
function mockTransfer(to, amount) {
  console.log(`💸 Transferred ${amount.toFixed(6)} tokens to ${to}`);
}

/**
 * Run the complete demo
 */
function runDemo() {
  console.log("🚀 AutoStream Contract Demo");
  console.log("============================\n");

  // Demo 1: Initialize contract
  console.log("📋 Demo 1: Initialize Contract");
  console.log("-------------------------------");
  constructor();
  console.log(`Stream count: ${getStreamCount()}\n`);

  // Demo 2: Create a stream
  console.log("💰 Demo 2: Create Stream");
  console.log("-------------------------");
  const streamId = createStream(
    "AS1RecipientAddress123",
    3600, // 1 hour duration
    0, // time-based
    60, // 1 minute intervals
    100 // 100 tokens total
  );
  console.log(`✅ Created stream ID: ${streamId}`);
  console.log(`Stream count: ${getStreamCount()}\n`);

  // Demo 3: Get stream info
  console.log("📊 Demo 3: Stream Information");
  console.log("------------------------------");
  const streamInfo = getStream(streamId);
  console.log("Stream details:");
  console.log(`  Sender: ${streamInfo.sender}`);
  console.log(`  Recipient: ${streamInfo.recipient}`);
  console.log(`  Total Amount: ${streamInfo.totalAmount} tokens`);
  console.log(
    `  Duration: ${(streamInfo.endTime - streamInfo.startTime) / 1000} seconds`
  );
  console.log(`  Rate: ${streamInfo.ratePerSecond.toFixed(6)} tokens/second`);
  console.log(
    `  Status: ${streamInfo.isPaused ? "Paused" : streamInfo.isCancelled ? "Cancelled" : "Active"}\n`
  );

  // Demo 4: Process payment
  console.log("💸 Demo 4: Process Payment");
  console.log("---------------------------");
  // Wait a bit to simulate time passing
  setTimeout(() => {
    processStreamPayment(streamId);

    const updatedStream = getStream(streamId);
    console.log(`✅ Payment processed!`);
    console.log(
      `  Withdrawn: ${updatedStream.withdrawnAmount.toFixed(6)} tokens`
    );
    console.log(
      `  Remaining: ${(updatedStream.totalAmount - updatedStream.withdrawnAmount).toFixed(6)} tokens\n`
    );

    // Demo 5: Pause and resume
    console.log("⏸️  Demo 5: Pause Stream");
    console.log("------------------------");
    pauseStream(streamId);

    const pausedStream = getStream(streamId);
    console.log(`✅ Stream paused: ${pausedStream.isPaused}\n`);

    console.log("▶️  Demo 6: Resume Stream");
    console.log("-------------------------");
    resumeStream(streamId);

    const resumedStream = getStream(streamId);
    console.log(`✅ Stream resumed: ${!resumedStream.isPaused}\n`);

    // Demo 7: Get withdrawable amount
    console.log("💳 Demo 7: Withdrawable Amount");
    console.log("------------------------------");
    const withdrawable = getWithdrawableAmount(streamId);
    console.log(
      `💰 Available to withdraw: ${withdrawable.toFixed(6)} tokens\n`
    );

    // Demo 8: Cancel stream
    console.log("❌ Demo 8: Cancel Stream");
    console.log("------------------------");
    cancelStream(streamId);

    const cancelledStream = getStream(streamId);
    console.log(`✅ Stream cancelled: ${cancelledStream.isCancelled}\n`);

    // Demo 9: All streams
    console.log("📋 Demo 9: All Streams");
    console.log("----------------------");
    const allStreams = getAllStreams();
    console.log(`Total streams created: ${allStreams.length}`);
    console.log("Stream summary:");
    allStreams.forEach((stream, index) => {
      console.log(
        `  ${index + 1}. ${stream.totalAmount} tokens from ${stream.sender} to ${stream.recipient} - ${stream.isCancelled ? "Cancelled" : "Active"}`
      );
    });

    console.log("\n🎉 Demo completed successfully!");
    console.log("💡 This demonstrates the core AutoStream functionality");
    console.log("🚀 Ready for Massa blockchain deployment!");
  }, 100); // Small delay to simulate time passing
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

// Export functions for testing
module.exports = {
  constructor,
  createStream,
  processStreamPayment,
  cancelStream,
  pauseStream,
  resumeStream,
  getStream,
  getStreamCount,
  getWithdrawableAmount,
  getAllStreams,
  runDemo,
};
