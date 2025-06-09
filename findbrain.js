#!/usr/bin/env node
var bitcore = require("bitcore-lib");
const { Level } = require("level");
var db = new Level("./addressdb", { valueEncoding: "json" });

var phrase = process.argv[2];

var value = new Buffer.from(phrase);
var hash = bitcore.crypto.Hash.sha256(value);
var bn = bitcore.crypto.BN.fromBuffer(hash);

const compressed = new bitcore.PrivateKey({
  bn,
  compressed: true,
  network: bitcore.Networks.livenet,
});

const unCompressed = new bitcore.PrivateKey({
  bn,
  compressed: false,
  network: bitcore.Networks.livenet,
});

const mergeAddr = ({ addr, key }) => {
  db.get(addr).then(found(addr), insert(addr, key));
};

const found = (addr) => (result) => {
  // console.log({ addr, result });
  console.log(`Found ${addr} in DB.`);
};

const insert = (addr, key) => (reason) => {
  // console.log({ addr, key });
  db.put(addr, key).then(
    () => {
      console.log(`Added ${addr} to DB.`);
    },
    (reason) => {
      console.error({ addr, reason });
    }
  );
};

mergeAddr({ addr: unCompressed.toAddress(), key: unCompressed });
mergeAddr({ addr: compressed.toAddress(), key: compressed });
mergeAddr({
  addr: compressed.toAddress(
    bitcore.Networks.livenet,
    bitcore.Address.PayToWitnessPublicKeyHash
  ),
  key: compressed,
});
