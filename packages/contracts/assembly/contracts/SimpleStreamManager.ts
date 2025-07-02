/**
 * SimpleStreamManager - Demonstration Contract for AutoStream
 * 
 * This is a simplified version showing the core streaming logic.
 * In production, this would use proper Massa AssemblyScript types.
 */

// Simple stream data structure
interface StreamData {
  sender: string;
  recipient: string;
  startTime: number;
  endTime: number;
  ratePerSecond: number;
  lastPaymentTime: number;
  totalAmount: number;
  withdrawnAmount: number;
  isPaused: boolean;
  isCancelled: boolean;
  streamType: number; // 0: time-based, 1: block-based
  intervalSeconds: number;
}

// Mock storage for demonstration
let streams: Map<number, StreamData> = new Map();
let streamCounter: number = 0;
let contractOwner: string = '';

/**
 * Initialize the StreamManager contract
 */
export function constructor(owner: string): void {
  contractOwner = owner;
  streamCounter = 0;
  console.log(`StreamManager initialized by ${owner}`);
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
  if (totalAmount <= 0) throw new Error('Total amount must be positive');
  if (duration <= 0) throw new Error('Duration must be positive');
  if (intervalSeconds <= 0) throw new Error('Interval must be positive');

  // Calculate rate per second
  const ratePerSecond = totalAmount / duration;
  
  // Get next stream ID
  const streamId = ++streamCounter;
  
  // Create stream data
  const currentTime = Date.now();
  const stream: StreamData = {
    sender: 'mock_sender', // In production: Context.caller()
    recipient: recipient,
    startTime: currentTime,
    endTime: currentTime + duration * 1000,
    ratePerSecond: ratePerSecond,
    lastPaymentTime: currentTime,
    totalAmount: totalAmount,
    withdrawnAmount: 0,
    isPaused: false,
    isCancelled: false,
    streamType: streamType,
    intervalSeconds: intervalSeconds
  };

  // Store the stream
  streams.set(streamId, stream);

  // Schedule the first payment (mock deferred call)
  scheduleNextPayment(streamId);

  console.log(`Stream ${streamId} created: ${totalAmount} tokens over ${duration}s`);
  return streamId;
}

/**
 * Process a stream payment (called by deferred calls)
 */
export function processStreamPayment(streamId: number): void {
  const stream = streams.get(streamId);
  if (!stream) throw new Error('Stream not found');
  
  if (stream.isCancelled || stream.isPaused) {
    return; // Skip processing
  }

  const currentTime = Date.now();
  
  // Check if stream has ended
  if (currentTime >= stream.endTime) {
    // Final payment
    const remainingAmount = stream.totalAmount - stream.withdrawnAmount;
    if (remainingAmount > 0) {
      transferTokens(stream.recipient, remainingAmount);
      stream.withdrawnAmount = stream.totalAmount;
      console.log(`Final payment: ${remainingAmount} to ${stream.recipient}`);
    }
    
    // Mark stream as completed
    stream.isCancelled = true;
    streams.set(streamId, stream);
    return;
  }

  // Calculate payment amount
  const timeSinceLastPayment = currentTime - stream.lastPaymentTime;
  const paymentAmount = (timeSinceLastPayment * stream.ratePerSecond) / 1000;

  if (paymentAmount > 0 && stream.withdrawnAmount + paymentAmount <= stream.totalAmount) {
    // Transfer payment
    transferTokens(stream.recipient, paymentAmount);
    
    // Update stream state
    stream.withdrawnAmount += paymentAmount;
    stream.lastPaymentTime = currentTime;
    streams.set(streamId, stream);

    console.log(`Payment: ${paymentAmount} to ${stream.recipient}`);
  }

  // Schedule next payment if stream is still active
  if (currentTime < stream.endTime && !stream.isCancelled && !stream.isPaused) {
    scheduleNextPayment(streamId);
  }
}

/**
 * Cancel a stream
 */
export function cancelStream(streamId: number): void {
  const stream = streams.get(streamId);
  if (!stream) throw new Error('Stream not found');
  
  if (stream.isCancelled) throw new Error('Stream already cancelled');

  // Calculate refund amount
  const remainingAmount = stream.totalAmount - stream.withdrawnAmount;
  
  // Mark as cancelled
  stream.isCancelled = true;
  streams.set(streamId, stream);

  // Refund remaining amount to sender
  if (remainingAmount > 0) {
    transferTokens(stream.sender, remainingAmount);
    console.log(`Stream ${streamId} cancelled, refunded ${remainingAmount} to ${stream.sender}`);
  }
}

/**
 * Pause a stream
 */
export function pauseStream(streamId: number): void {
  const stream = streams.get(streamId);
  if (!stream) throw new Error('Stream not found');
  
  if (stream.isCancelled) throw new Error('Stream is cancelled');
  if (stream.isPaused) throw new Error('Stream already paused');

  stream.isPaused = true;
  streams.set(streamId, stream);
  console.log(`Stream ${streamId} paused`);
}

/**
 * Resume a paused stream
 */
export function resumeStream(streamId: number): void {
  const stream = streams.get(streamId);
  if (!stream) throw new Error('Stream not found');
  
  if (stream.isCancelled) throw new Error('Stream is cancelled');
  if (!stream.isPaused) throw new Error('Stream is not paused');

  stream.isPaused = false;
  stream.lastPaymentTime = Date.now(); // Reset payment time
  streams.set(streamId, stream);

  // Schedule next payment
  scheduleNextPayment(streamId);
  console.log(`Stream ${streamId} resumed`);
}

/**
 * Get stream information
 */
export function getStream(streamId: number): StreamData | null {
  return streams.get(streamId) || null;
}

/**
 * Get total number of streams
 */
export function getStreamCount(): number {
  return streamCounter;
}

/**
 * Calculate withdrawable amount for a stream
 */
export function getWithdrawableAmount(streamId: number): number {
  const stream = streams.get(streamId);
  if (!stream) throw new Error('Stream not found');
  
  if (stream.isCancelled || stream.isPaused) {
    return 0;
  }

  const currentTime = Date.now();
  const elapsedTime = currentTime - stream.lastPaymentTime;
  const earnedAmount = (elapsedTime * stream.ratePerSecond) / 1000;
  const maxWithdrawable = stream.totalAmount - stream.withdrawnAmount;
  
  return Math.min(earnedAmount, maxWithdrawable);
}

/**
 * Helper function to schedule next payment
 * In production, this would use Massa's deferred calls
 */
function scheduleNextPayment(streamId: number): void {
  const stream = streams.get(streamId);
  if (!stream) return;

  // Mock deferred call - in production this would be:
  // call(Context.callee(), 'processStreamPayment', args, new Coins(0), intervalSeconds * 1000)
  setTimeout(() => {
    processStreamPayment(streamId);
  }, stream.intervalSeconds * 1000);
  
  console.log(`Next payment scheduled for stream ${streamId} in ${stream.intervalSeconds}s`);
}

/**
 * Helper function to transfer tokens
 * In production, this would use Massa's transferCoins
 */
function transferTokens(to: string, amount: number): void {
  // Mock transfer - in production this would be:
  // transferCoins(new Address(to), new Coins(amount))
  console.log(`Transferred ${amount} tokens to ${to}`);
}

/**
 * Get all streams (for debugging)
 */
export function getAllStreams(): StreamData[] {
  return Array.from(streams.values());
} 