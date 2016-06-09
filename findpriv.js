#!/usr/bin/env node
var bitcore = require('bitcore-lib');
var levelup = require('level')
var db = levelup('./addressdb', { valueEncoding: 'json'});
var priv = process.argv[2];

var keyT = new bitcore.PrivateKey(priv);
var addrT = keyT.toAddress().toString();
db.get(addrT, function (err, result) {
  if (!(err)) {
    console.log("compressed: "+addrT);
  }
});

var keyF = new bitcore.PrivateKey({
  "bn" : keyT.toBigNumber(),
  "compressed" : false,
  "network" : "livenet"
});
var addrF = keyF.toAddress().toString();
db.get(addrF, function (err, result) {
  if (!(err)) {
    console.log("UNcompressed: "+addrF);
  }
});
