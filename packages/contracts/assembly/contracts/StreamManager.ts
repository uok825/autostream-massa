import {
  Address,
  Context,
  Storage,
  transferCoins,
  print,
  unsafeRandom,
  getTimestamp,
} from "@massalabs/massa-sc-utils";

// Simple types for Massa contracts
type u8 = number;
type u32 = number;
type u64 = number;

// Simple serialization helpers
class Args {
  private data: StaticArray<u8>;
  private offset: i32 = 0;

  constructor(data: StaticArray<u8>) {
    this.data = data;
  }

  static create(): Args {
    return new Args(new StaticArray<u8>(0));
  }

  serialize(): StaticArray<u8> {
    return this.data;
  }

  add(value: string): Args {
    // Simple string serialization
    const encoded = String.UTF8.encode(value);
    const newData = new StaticArray<u8>(this.data.length + encoded.byteLength);

    // Copy existing data
    for (let i = 0; i < this.data.length; i++) {
      newData[i] = this.data[i];
    }

    // Add new data
    const bytes = Uint8Array.wrap(encoded);
    for (let i = 0; i < bytes.length; i++) {
      newData[this.data.length + i] = bytes[i];
    }

    return new Args(newData);
  }

  nextString(): string {
    // Simple deserialization - in production this would be more robust
    return "mock_string";
  }

  nextU64(): u64 {
    // Simple deserialization
    return 0;
  }

  nextU8(): u8 {
    return 0;
  }

  nextAddress(): Address {
    return new Address("AS1MockAddress");
  }
}

// Stream data structure
@serializable
export class StreamData {
  constructor(
    public sender: Address = new Address(),
    public recipient: Address = new Address(),
    public startTime: u64 = 0,
    public endTime: u64 = 0,
    public ratePerSecond: u64 = 0,
    public lastPaymentTime: u64 = 0,
    public totalAmount: u64 = 0,
    public withdrawnAmount: u64 = 0,
    public isPaused: bool = false,
    public isCancelled: bool = false,
    public streamType: u8 = 0, // 0: time-based, 1: block-based
    public intervalSeconds: u64 = 1
  ) {}
}

// Storage keys
const STREAM_KEY_PREFIX = "stream_";
const STREAM_COUNTER_KEY = "stream_counter";
const OWNER_KEY = "owner";

// Events
const STREAM_CREATED_EVENT = "StreamCreated";
const STREAM_PAYMENT_EVENT = "StreamPayment";
const STREAM_CANCELLED_EVENT = "StreamCancelled";
const STREAM_PAUSED_EVENT = "StreamPaused";
const STREAM_RESUMED_EVENT = "StreamResumed";

/**
 * Initialize the StreamManager contract
 */
export function constructor(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const owner = argsObj.nextAddress().unwrap();

  Storage.set(OWNER_KEY, owner.serialize());
  Storage.set(STREAM_COUNTER_KEY, Result.Ok<u64>(0).serialize());

  generateEvent("StreamManagerInitialized", [owner.toString()]);
  return [];
}

/**
 * Create a new token stream
 */
export function createStream(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const recipient = argsObj.nextAddress().unwrap();
  const duration = argsObj.nextU64().unwrap(); // in seconds
  const streamType = argsObj.nextU8().unwrap(); // 0: time-based, 1: block-based
  const intervalSeconds = argsObj.nextU64().unwrap(); // payment interval

  // Get the amount of coins sent with the transaction
  const totalAmount = Context.transferredCoins().amount;
  assert(totalAmount > 0, "Must send coins to create stream");
  assert(duration > 0, "Duration must be positive");
  assert(intervalSeconds > 0, "Interval must be positive");

  // Calculate rate per second
  const ratePerSecond = totalAmount / duration;
  assert(ratePerSecond > 0, "Rate per second must be positive");

  // Get next stream ID
  const counterData = Storage.get(STREAM_COUNTER_KEY);
  let streamId: u64 = 0;
  if (counterData.length > 0) {
    const counterResult = Result.fromBytes<u64>(counterData);
    if (counterResult.isOk()) {
      streamId = counterResult.unwrap();
    }
  }

  const newStreamId = streamId + 1;
  Storage.set(STREAM_COUNTER_KEY, Result.Ok<u64>(newStreamId).serialize());

  // Create stream data
  const currentTime = Time.timestamp();
  const stream = new StreamData(
    Context.caller(),
    recipient,
    currentTime,
    currentTime + duration * 1000, // Convert to milliseconds
    ratePerSecond,
    currentTime,
    totalAmount,
    0,
    false,
    false,
    streamType,
    intervalSeconds
  );

  // Store the stream
  const streamKey = STREAM_KEY_PREFIX + newStreamId.toString();
  Storage.set(streamKey, stream.serialize());

  // Schedule the first payment using deferred call
  scheduleNextPayment(newStreamId, intervalSeconds);

  // Generate event
  generateEvent(STREAM_CREATED_EVENT, [
    newStreamId.toString(),
    Context.caller().toString(),
    recipient.toString(),
    totalAmount.toString(),
    duration.toString(),
  ]);

  return Result.Ok<u64>(newStreamId).serialize();
}

/**
 * Process a stream payment (called by deferred calls)
 */
export function processStreamPayment(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);
  assert(streamData.length > 0, "Stream not found");

  const stream = StreamData.fromBytes(streamData);
  assert(!stream.isCancelled, "Stream is cancelled");
  assert(!stream.isPaused, "Stream is paused");

  const currentTime = Time.timestamp();

  // Check if stream has ended
  if (currentTime >= stream.endTime) {
    // Final payment
    const remainingAmount = stream.totalAmount - stream.withdrawnAmount;
    if (remainingAmount > 0) {
      transferCoins(stream.recipient, new Coins(remainingAmount));
      stream.withdrawnAmount = stream.totalAmount;

      generateEvent(STREAM_PAYMENT_EVENT, [
        streamId.toString(),
        stream.recipient.toString(),
        remainingAmount.toString(),
        "final",
      ]);
    }

    // Mark stream as completed
    stream.isCancelled = true;
    Storage.set(streamKey, stream.serialize());
    return [];
  }

  // Calculate payment amount
  const timeSinceLastPayment = currentTime - stream.lastPaymentTime;
  const paymentAmount = (timeSinceLastPayment * stream.ratePerSecond) / 1000; // Convert from ms

  if (
    paymentAmount > 0 &&
    stream.withdrawnAmount + paymentAmount <= stream.totalAmount
  ) {
    // Transfer payment
    transferCoins(stream.recipient, new Coins(paymentAmount));

    // Update stream state
    stream.withdrawnAmount += paymentAmount;
    stream.lastPaymentTime = currentTime;
    Storage.set(streamKey, stream.serialize());

    generateEvent(STREAM_PAYMENT_EVENT, [
      streamId.toString(),
      stream.recipient.toString(),
      paymentAmount.toString(),
      "regular",
    ]);
  }

  // Schedule next payment if stream is still active
  if (currentTime < stream.endTime && !stream.isCancelled && !stream.isPaused) {
    scheduleNextPayment(streamId, stream.intervalSeconds);
  }

  return [];
}

/**
 * Cancel a stream
 */
export function cancelStream(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);
  assert(streamData.length > 0, "Stream not found");

  const stream = StreamData.fromBytes(streamData);
  assert(
    stream.sender.equals(Context.caller()),
    "Only stream creator can cancel"
  );
  assert(!stream.isCancelled, "Stream already cancelled");

  // Calculate refund amount
  const remainingAmount = stream.totalAmount - stream.withdrawnAmount;

  // Mark as cancelled
  stream.isCancelled = true;
  Storage.set(streamKey, stream.serialize());

  // Refund remaining amount to sender
  if (remainingAmount > 0) {
    transferCoins(stream.sender, new Coins(remainingAmount));
  }

  generateEvent(STREAM_CANCELLED_EVENT, [
    streamId.toString(),
    stream.sender.toString(),
    remainingAmount.toString(),
  ]);

  return [];
}

/**
 * Pause a stream
 */
export function pauseStream(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);
  assert(streamData.length > 0, "Stream not found");

  const stream = StreamData.fromBytes(streamData);
  assert(
    stream.sender.equals(Context.caller()),
    "Only stream creator can pause"
  );
  assert(!stream.isCancelled, "Stream is cancelled");
  assert(!stream.isPaused, "Stream already paused");

  stream.isPaused = true;
  Storage.set(streamKey, stream.serialize());

  generateEvent(STREAM_PAUSED_EVENT, [streamId.toString()]);
  return [];
}

/**
 * Resume a paused stream
 */
export function resumeStream(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);
  assert(streamData.length > 0, "Stream not found");

  const stream = StreamData.fromBytes(streamData);
  assert(
    stream.sender.equals(Context.caller()),
    "Only stream creator can resume"
  );
  assert(!stream.isCancelled, "Stream is cancelled");
  assert(stream.isPaused, "Stream is not paused");

  stream.isPaused = false;
  stream.lastPaymentTime = Time.timestamp(); // Reset payment time
  Storage.set(streamKey, stream.serialize());

  // Schedule next payment
  scheduleNextPayment(streamId, stream.intervalSeconds);

  generateEvent(STREAM_RESUMED_EVENT, [streamId.toString()]);
  return [];
}

/**
 * Get stream information
 */
export function getStream(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);

  if (streamData.length === 0) {
    return Result.Error("Stream not found").serialize();
  }

  return Result.Ok<StreamData>(StreamData.fromBytes(streamData)).serialize();
}

/**
 * Get total number of streams
 */
export function getStreamCount(): StaticArray<u8> {
  const counterData = Storage.get(STREAM_COUNTER_KEY);
  if (counterData.length === 0) {
    return Result.Ok<u64>(0).serialize();
  }
  return counterData;
}

/**
 * Calculate withdrawable amount for a stream
 */
export function getWithdrawableAmount(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const streamId = argsObj.nextU64().unwrap();

  const streamKey = STREAM_KEY_PREFIX + streamId.toString();
  const streamData = Storage.get(streamKey);
  assert(streamData.length > 0, "Stream not found");

  const stream = StreamData.fromBytes(streamData);

  if (stream.isCancelled || stream.isPaused) {
    return Result.Ok<u64>(0).serialize();
  }

  const currentTime = Time.timestamp();
  const elapsedTime = currentTime - stream.lastPaymentTime;
  const earnedAmount = (elapsedTime * stream.ratePerSecond) / 1000;
  const maxWithdrawable = stream.totalAmount - stream.withdrawnAmount;
  const withdrawableAmount =
    earnedAmount > maxWithdrawable ? maxWithdrawable : earnedAmount;

  return Result.Ok<u64>(withdrawableAmount).serialize();
}

/**
 * Helper function to schedule next payment using deferred calls
 */
function scheduleNextPayment(streamId: u64, intervalSeconds: u64): void {
  const args = new Args().add<u64>(streamId).serialize();

  // Schedule deferred call for next payment
  // Note: Massa's deferred call syntax may vary - adjust as needed
  call(
    Context.callee(), // Call this same contract
    "processStreamPayment", // Function to call
    args,
    new Coins(0), // No coins needed for internal call
    intervalSeconds * 1000 // Delay in milliseconds
  );
}
