#!/usr/bin/env node

require('dotenv').config();
const { getKeyForAddress } = require("./addressToKey");

var addr = process.argv[2];
getKeyForAddress({ addr }).then(({ bn, compressed, network, key } = {}) => {
  if (!key) {
    console.log(`Address ${addr} not found.`)
  }
  console.log({ bn, compressed, network, WIF: key.toWIF() });
})