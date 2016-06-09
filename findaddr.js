#!/usr/bin/env node
var bitcore = require('bitcore-lib');
var levelup = require('level')
var db = levelup('./addressdb', { valueEncoding: 'json'});
var addr = process.argv[2];
db.get(process.argv[2], function (err, result) {
  if (!(err)) {
    var key = new bitcore.PrivateKey(result);
    console.log(key);
    db.close();
  } else {
    db.close();
  }
});
