require("dotenv").config();
const { default: axios, Axios } = require("axios");
const { Transaction } = require("bitcore-lib");
const { axiosClient } = require("./axios");
const client = axiosClient();

let feeRateUpdated, lastAttempt;
feeRateUpdated = lastAttempt = new Date(0);
const expirationMinutes = process.env.EXPIRE_FEE_MIN ?? 10;
const expirationMs = expirationMinutes * 60 * 1000;
const tryWaitMs = 30 * 1000;
let lastFee = Transaction.FEE_PER_KB;
const feeApiUrl = "https://www.bitgo.com/api/v2/btc/tx/fee";

const updateFeeRate = async ({ force = false, newFee } = {}) => {
  let updated = false;
  let isCached;
  const now = new Date();
  const msSinceUpdate = now - feeRateUpdated;
  const msSinceTry = now - lastAttempt;
  if (force || (msSinceUpdate > expirationMs && msSinceTry > tryWaitMs)) {
    if (!newFee) {
      try {
        lastAttempt = new Date();
        const { cached, data: { feePerKb } = {} } = await client.get(feeApiUrl);
        newFee = feePerKb;
        isCached = cached;
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "Failed to get new fee.",
            error: error.response?.data || error.message,
          })
        );
      }
    }
  }
  if (newFee && !isCached) {
    feeRateUpdated = now;
    Transaction.FEE_PER_KB = newFee;
    updated = true;
    console.log(`Fee per Kb updated from ${lastFee} to ${newFee}.`);
    lastFee = newFee;
  }
  return { feeRateUpdated, updated, force, newFee, isCached, lastFee };
};

module.exports = { updateFeeRate };
