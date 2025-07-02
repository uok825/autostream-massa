/**
 * AutoStream Contract Demo
 * Demonstrates the streaming contract functionality
 */

// Import the compiled contract (after building)
const fs = require("fs");
const path = require("path");

console.log("🚀 AutoStream Contract Demo");
console.log("============================\n");

// Check if contract is built
const contractPath = path.join(
  __dirname,
  "../build/assembly/contracts/StreamManagerClean.js"
);

if (!fs.existsSync(contractPath)) {
  console.log("❌ Contract not built yet!");
  console.log("Run: npm run build:demo\n");
  process.exit(1);
}

try {
  // Load the contract
  const contract = require(contractPath);

  console.log("✅ Contract loaded successfully!\n");

  // Demo 1: Initialize contract
  console.log("📋 Demo 1: Initialize Contract");
  console.log("-------------------------------");
  contract.constructor();
  console.log(`Stream count: ${contract.getStreamCount()}\n`);

  // Demo 2: Create a stream
  console.log("💰 Demo 2: Create Stream");
  console.log("-------------------------");
  const streamId = contract.createStream(
    "AS1RecipientAddress123",
    3600, // 1 hour duration
    0, // time-based
    60, // 1 minute intervals
    100 // 100 tokens total
  );
  console.log(`✅ Created stream ID: ${streamId}`);
  console.log(`Stream count: ${contract.getStreamCount()}\n`);

  // Demo 3: Get stream info
  console.log("📊 Demo 3: Stream Information");
  console.log("------------------------------");
  const streamInfo = contract.getStream(streamId);
  console.log("Stream details:");
  console.log(`  Sender: ${streamInfo.sender}`);
  console.log(`  Recipient: ${streamInfo.recipient}`);
  console.log(`  Total Amount: ${streamInfo.totalAmount} tokens`);
  console.log(
    `  Duration: ${(streamInfo.endTime - streamInfo.startTime) / 1000} seconds`
  );
  console.log(`  Rate: ${streamInfo.ratePerSecond} tokens/second`);
  console.log(
    `  Status: ${streamInfo.isPaused ? "Paused" : streamInfo.isCancelled ? "Cancelled" : "Active"}\n`
  );

  // Demo 4: Process payment
  console.log("💸 Demo 4: Process Payment");
  console.log("---------------------------");
  // Wait a bit to simulate time passing
  setTimeout(() => {
    contract.processStreamPayment(streamId);

    const updatedStream = contract.getStream(streamId);
    console.log(`✅ Payment processed!`);
    console.log(`  Withdrawn: ${updatedStream.withdrawnAmount} tokens`);
    console.log(
      `  Remaining: ${updatedStream.totalAmount - updatedStream.withdrawnAmount} tokens\n`
    );

    // Demo 5: Pause and resume
    console.log("⏸️  Demo 5: Pause Stream");
    console.log("------------------------");
    contract.pauseStream(streamId);

    const pausedStream = contract.getStream(streamId);
    console.log(`✅ Stream paused: ${pausedStream.isPaused}\n`);

    console.log("▶️  Demo 6: Resume Stream");
    console.log("-------------------------");
    contract.resumeStream(streamId);

    const resumedStream = contract.getStream(streamId);
    console.log(`✅ Stream resumed: ${!resumedStream.isPaused}\n`);

    // Demo 7: Get withdrawable amount
    console.log("💳 Demo 7: Withdrawable Amount");
    console.log("------------------------------");
    const withdrawable = contract.getWithdrawableAmount(streamId);
    console.log(`💰 Available to withdraw: ${withdrawable} tokens\n`);

    // Demo 8: Cancel stream
    console.log("❌ Demo 8: Cancel Stream");
    console.log("------------------------");
    contract.cancelStream(streamId);

    const cancelledStream = contract.getStream(streamId);
    console.log(`✅ Stream cancelled: ${cancelledStream.isCancelled}\n`);

    // Demo 9: All streams
    console.log("📋 Demo 9: All Streams");
    console.log("----------------------");
    const allStreams = contract.getAllStreams();
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
} catch (error) {
  console.error("❌ Demo failed:", error.message);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Make sure you ran: npm run build:demo");
  console.log("2. Check the contract file exists");
  console.log("3. Verify Node.js version (requires 18+)");
}

module.exports = {
  runDemo: () => {
    console.log("AutoStream demo completed!");
  },
};
