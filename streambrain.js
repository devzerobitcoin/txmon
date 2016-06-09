#!/usr/bin/env node
var bitcore = require('bitcore-lib')
var levelup = require('level')
var LevelWriteStream = require('level-writestream');
var fs = require('fs')
var split = require('split')
var through2 = require('through2')
var db = levelup('./addressdb', { valueEncoding: 'json'})
LevelWriteStream(db);
process.on('SIGINT', function() {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)")
  console.log("\nClosing database...")
  db.close()
  console.log("\nExiting")
  process.exit()
})

fs.createReadStream(process.argv[2])
  .pipe(split())
  .pipe(through2.obj(function (line, enc, callback) {
  if (line) {

    console.log(line)

    var value = new Buffer(line);
    var hash = bitcore.crypto.Hash.sha256(value);
    var bn = bitcore.crypto.BN.fromBuffer(hash);

    var keyT = new bitcore.PrivateKey({
      "bn" : bn,
      "compressed" : true,
      "network" : "livenet"
    });
    var dataT = {
      key : keyT.toAddress().toString(),
      value : keyT
    }
    console.log(dataT)
    this.push(dataT)

    var keyF = new bitcore.PrivateKey({
      "bn" : bn,
      "compressed" : false,
      "network" : "livenet"
    });
    var dataF = {
      key : keyF.toAddress().toString(),
      value : keyF
    }
    console.log(dataF)
    this.push(dataF)

    callback()

  }}))
  .pipe(db.createWriteStream())
