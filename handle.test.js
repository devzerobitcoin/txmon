require("dotenv").config();
const { Transaction, Networks } = require("bitcore-lib");
const { Messages } = require("bitcore-p2p");
const { Pool } = require("bitcore-p2p/lib");
const messages = new Messages();
const fs = require("fs");
const { getSiphonTransaction } = require("./handle");
const { updateFeeRate } = require("./feeRate");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("transaction handler tests", () => {
  const txHash =
    "55571ca5e1f86c11a5ec5837aa1edf4262042b4b18379373585047ce8f8938cf";
  let pool, incoming, getTxMessage;

  const getTx = (peer, message) => {
    try {
      if (message.transaction.id == txHash) {
        const transaction = new Transaction(message.transaction);
        fs.writeFileSync(
          `${txHash}.json`,
          JSON.stringify(transaction.toJSON())
        );

        incoming = message.transaction;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const poolConnect = async () => {
    pool = new Pool({
      network: Networks.livenet,
      maxSize: 500,
    });
    await pool.connect();
  };

  const poolWatch = async () => {
    pool.on("peertx", getTx);
    getTxMessage = messages.GetData.forTransaction(txHash);
    pool.on("peerready", async () => {
      await pool.sendMessage(getTxMessage);
    });
  };

  beforeAll(async () => {});

  afterAll(async () => {});

  test.skip("it should get a transaction from network", async () => {
    let i = 0;
    await poolConnect();
    await poolWatch();
    while (!incoming) {
      console.log(i++);
      // await pool.sendMessage(message);
      await sleep(1000);
    }
    expect(incoming).toBeDefined();
    await pool.disconnect();
  });

  test("it should import an incoming transaction", () => {
    const incoming = new Transaction(
      JSON.parse(fs.readFileSync(`${txHash}.json`))
    );
    expect(incoming).toBeDefined();
    // console.log(incoming);
  });

  test("it should broadcast a transaction", async () => {
    const incoming = new Transaction(
      JSON.parse(fs.readFileSync(`${txHash}.json`))
    );
    expect(incoming).toBeDefined();
    await poolConnect();
    // console.log(incoming);
    const tx = messages.Transaction(incoming);
    await pool.sendMessage(tx);
    await pool.disconnect();
  });

  test("it should return a siphon transaction", async () => {
    const incoming = new Transaction(
      JSON.parse(fs.readFileSync(`${txHash}.json`))
    );
    // Set the fee rate low to ensure change (siphon) output exists.
    updateFeeRate({ force: true, newFee: 1000 });
    const siphonTransaction = await getSiphonTransaction({ incoming });
    expect(siphonTransaction).not.toBe(false);
    expect(siphonTransaction.isFullySigned()).toBe(true);
    expect(siphonTransaction.outputAmount).toBeGreaterThan(0);
    expect(siphonTransaction.inputs.length).toBe(10);
    expect(siphonTransaction.inputAmount).toBeGreaterThan(0);
    expect(siphonTransaction.getFee()).toBeGreaterThan(0);
    expect(siphonTransaction.outputs[0].script.toAddress().toString()).toBe(
      process.env.SIPHON
    );
  });

  test("it should broadcast a siphon transaction", async () => {
    Transaction.FEE_SECURITY_MARGIN = 1;
    const incoming = new Transaction(
      JSON.parse(fs.readFileSync(`${txHash}.json`))
    );
    // Set the fee rate low to ensure change (siphon) output exists.
    updateFeeRate({ force: true, newFee: 1000 });
    const siphonTransaction = await getSiphonTransaction({ incoming });
    expect(siphonTransaction).toBeDefined();
    await poolConnect();
    const tx = messages.Transaction(siphonTransaction);
    await pool.sendMessage(tx);
    await pool.disconnect();
  });
});
