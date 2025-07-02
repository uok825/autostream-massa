/**
 * StreamManager Contract for AutoStream
 * Simplified version for Massa blockchain demonstration
 */

// Stream data structure
export class StreamData {
  sender: string = "";
  recipient: string = "";
  startTime: number = 0;
  endTime: number = 0;
  ratePerSecond: number = 0;
  lastPaymentTime: number = 0;
  totalAmount: number = 0;
  withdrawnAmount: number = 0;
  isPaused: boolean = false;
  isCancelled: boolean = false;
  streamType: number = 0; // 0: time-based, 1: block-based
  intervalSeconds: number = 1;
}

// Storage simulation
let streams: Map<number, StreamData> = new Map();
let streamCounter: number = 0;
let contractOwner: string = "";

// Events (simplified logging)
function logEvent(eventName: string, data: string[]): void {
  console.log(`Event: ${eventName} - ${data.join(", ")}`);
}

/**
 * Initialize the StreamManager contract
 */
export function constructor(): void {
  contractOwner = "owner_address";
  streamCounter = 0;
  logEvent("StreamManagerInitialized", [contractOwner]);
}

/**
 * Create a new token stream
 */
export function createStream(
  recipient: string,
  duration: number,
  streamType: number,
  intervalSeconds: number,
  totalAmount: number
): number {
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
export function processStreamPayment(streamId: u64): void {
  const stream = streams.get(streamId);
  if (!stream) {
    console.log("Stream not found: " + streamId.toString());
    return;
  }

  if (stream.isCancelled || stream.isPaused) {
    return; // Skip processing
  }

  const currentTime = Date.now() as u64;

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
export function cancelStream(streamId: u64): void {
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
export function pauseStream(streamId: u64): void {
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
export function resumeStream(streamId: u64): void {
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
  stream.lastPaymentTime = Date.now() as u64; // Reset payment time
  streams.set(streamId, stream);

  logEvent("StreamResumed", [streamId.toString()]);
}

/**
 * Get stream information
 */
export function getStream(streamId: u64): StreamData | null {
  return streams.get(streamId);
}

/**
 * Get total number of streams
 */
export function getStreamCount(): u64 {
  return streamCounter;
}

/**
 * Calculate withdrawable amount for a stream
 */
export function getWithdrawableAmount(streamId: u64): u64 {
  const stream = streams.get(streamId);
  if (!stream) {
    return 0;
  }

  if (stream.isCancelled || stream.isPaused) {
    return 0;
  }

  const currentTime = Date.now() as u64;
  const elapsedTime = currentTime - stream.lastPaymentTime;
  const earnedAmount = (elapsedTime * stream.ratePerSecond) / 1000;
  const maxWithdrawable = stream.totalAmount - stream.withdrawnAmount;

  return earnedAmount > maxWithdrawable ? maxWithdrawable : earnedAmount;
}

/**
 * Get all streams (for debugging)
 */
export function getAllStreams(): StreamData[] {
  const allStreams: StreamData[] = [];
  const keys = streams.keys();

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
function mockTransfer(to: string, amount: u64): void {
  console.log(`Transferred ${amount} tokens to ${to}`);
}
