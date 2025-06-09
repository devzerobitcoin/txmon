#!/usr/bin/env node
var bitcore = require('bitcore-lib');
const { fetchAddr } = require('./db');

const getKeyForAddress = async ({ addr, ...props } = {}) => {
  const result = await fetchAddr({ addr });
  if (!result) {
    return false;
  }
  let { bn, compressed, network } = result;
  if (bn.length % 2 !== 0) {
    bn = `0${bn}`;
  }
  var key = new bitcore.PrivateKey({ bn, compressed, network });

  return { ...props, addr, bn, compressed, network, key };
}

module.exports = { getKeyForAddress };