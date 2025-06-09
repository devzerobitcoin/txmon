#!/usr/bin/env node
require("dotenv").config();
const { updateFeeRate } = require("./feeRate");
const { poolConnect, pool, periodicTask, pingPool, onExit } = require("./pool");
var cron = require("node-cron");

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);

// Add specific peers to connect to, such as your local bitcoind.
// Set dnsSeed to false and maxSize to 'peers.length' to only connect to these.
var addrs = [
  {
    ip: { v4: "127.0.0.1" },
  },
];

// The number of peers you want to connect to.
const maxSize = process.env.NUM_PEERS;

// Get peers from DNS.
const dnsSeed = process.env.DNS_SEED === "true" ?? false;

// Add peers from network announcements.
const listenAddr = process.env.LISTEN_ADDR === "true" ?? false;

const poolConfig = {
  dnsSeed,
  listenAddr,
  maxSize,
  addrs,
};

const expireFeeMin = process.env.EXPIRE_FEE_MIN ?? 10;

console.log(
  JSON.stringify({
    message: "START",
    memPoolSize: process.env.MEMPOOL_SIZE,
    getAddr: process.env.GET_ADDRS,
    expireFeeMin,
    ...poolConfig,
  })
);

updateFeeRate();
poolConnect({ poolConfig }).then(() => {
  console.log(`Siphoning to ${process.env.SIPHON}`);
  pingPool();
});

cron.schedule(`*/${expireFeeMin} * * * *`, () => {
  try {
    periodicTask();
  } catch (error) {
    console.log(error);
  }
});
