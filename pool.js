const { Pool, Messages } = require("bitcore-p2p");
var bitcore = require("bitcore-lib");
const { Networks } = bitcore;
var BufferUtil = bitcore.util.buffer;
const { handleTx } = require("./handle");
const { Inventory } = require("bitcore-p2p/lib");
const { closeDb } = require("./db");
const { getAddr } = require("./addr");
const { getItem } = require("./memPool");
const { updateFeeRate } = require("./feeRate");
var messages = new Messages();

const defaults = {
  network: Networks.livenet, // the network object
  maxSize: 50,
  dnsSeed: true,
  listenAddr: true,
  // addrs: [
  //   // initial peers to connect to
  //   {
  //     ip: {
  //       v4: "127.0.0.1",
  //     },
  //   },
  // ],
};

let pool;
let lastPeerInv, lastPeriodicTask;

const poolConnect = async ({ siphon, poolConfig = defaults }) => {
  try {
    const addrs = await getAddr(poolConfig);
    pool = new Pool({ ...poolConfig, addrs });

    // connect to the network
    await pool.connect();

    pool.on("peerinv", function (peer, message) {
      try {
        lastPeerInv = new Date();
        message.inventory.forEach(({ type, hash }) => {
          switch (type) {
            case Inventory.TYPE.TX:
              const txId = BufferUtil.reverse(hash).toString("hex");
              const transaction = getItem(txId);
              if (transaction) {
                const tx = messages.Transaction(transaction);
                peer.sendMessage(tx);
              } else if (transaction === undefined) {
                const message = messages.GetData.forTransaction(hash);
                peer.sendMessage(message);
              }
              break;
          }
        });
      } catch (error) {
        console.error(error);
      }
    });

    pool.on("peertx", function (peer, message) {
      try {
        handleTx({ pool, peer, incoming: message.transaction, siphon });
      } catch (error) {
        console.error(error);
      }
    });

    // pool.on("peerping", (peer, message) => {
    //   console.log(
    //     "Ping",
    //     peer.version,
    //     peer.subversion,
    //     peer.bestHeight,
    //     peer.host
    //   );
    //   console.log(JSON.stringify(message));
    // });

    // pool.on("peerpong", (peer, message) => {
    //   console.log(
    //     "Pong",
    //     peer.version,
    //     peer.subversion,
    //     peer.bestHeight,
    //     peer.host
    //   );
    //   console.log(JSON.stringify(message));
    // });

    // pool.on("peerready", function (peer, addr) {
    //   console.log(
    //     "Connect: " + peer.version,
    //     peer.subversion,
    //     peer.bestHeight,
    //     peer.host
    //   );
    //   console.log(
    //     `Connected to ${pool.numberConnected()}/${
    //       pool._addrs.length
    //     } known peers.`
    //   );
    // });

    // pool.on("peerdisconnect", function (peer, addr) {
    //   console.log(
    //     "Disconnect: " + peer.version,
    //     peer.subversion,
    //     peer.bestHeight,
    //     peer.host
    //   );
    // });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const poolDisconnect = async () => {
  await pool.disconnect();
};

const pingPool = async () => {
  try {
    if (pool) {
      const ping = messages.Ping();
      await pool.sendMessage(ping);
      console.log(
        `Connected to ${pool.numberConnected()}/${
          pool._addrs.length
        } known peers.`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const periodicTask = async () => {
  updateFeeRate();
  await pingPool();
  if (lastPeerInv < lastPeriodicTask) {
    console.log(`No peer inventory since ${lastPeerInv}! Exiting...`);
    onExit();
  }
  lastPeriodicTask = new Date();
};

const onExit = () => {
  console.log("\nGracefully shutting down from signal.");
  console.log("\nPool disconnect...");
  poolDisconnect();
  console.log("\nClosing database...");
  closeDb().then(() => {
    console.log("\nExiting");
    process.exit();
  });
};

module.exports = {
  onExit,
  periodicTask,
  pingPool,
  pool,
  poolConnect,
  poolDisconnect,
};
