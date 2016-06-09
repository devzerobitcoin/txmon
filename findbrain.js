#!/usr/bin/env node
var bitcore = require('bitcore-lib');
var levelup = require('level')
var db = levelup('./addressdb', { valueEncoding: 'json'});
var phrase = process.argv[2];

var value = new Buffer(phrase);
var hash = bitcore.crypto.Hash.sha256(value);
var bn = bitcore.crypto.BN.fromBuffer(hash);
    
var keyT = new bitcore.PrivateKey({
 "bn" : bn,
  "compressed" : true,
  "network" : "livenet"
});
var addrT = keyT.toAddress().toString();
db.get(addrT, function (err, result) {
  if (!(err)) {
    console.log("compressed: "+addrT);
  }
});

var keyF = new bitcore.PrivateKey({
  "bn" : bn,
  "compressed" : false,
  "network" : "livenet"
});
var addrF = keyF.toAddress().toString();
db.get(addrF, function (err, result) {
  if (!(err)) {
    console.log("UNcompressed: "+addrF);
  }
});
