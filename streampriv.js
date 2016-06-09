#!/usr/bin/env node
var bitcore = require('bitcore-lib');
var levelup = require('level');
var LevelWriteStream = require('level-writestream');
var fs = require('fs')
var split = require('split')
var through2 = require('through2')
var db = levelup('./addressdb', { valueEncoding: 'json'});
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

    var keyT = new bitcore.PrivateKey(line);
    var addrT = keyT.toAddress().toString();
    console.log(addrT);
    console.log(keyT);
    this.push({
      key : addrT,
      value : keyT
    })

    var keyF = new bitcore.PrivateKey({
      "bn" : keyT.toBigNumber(),
      "compressed" : false,
      "network" : "livenet"
    });
    var addrF = keyF.toAddress().toString();
    console.log(addrF);
    console.log(keyF);
    this.push({
      key : addrF,
      value : keyF
    })

    callback();

  }}))
  .pipe(db.createWriteStream());
