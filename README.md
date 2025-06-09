# txmon

Monitor the Bitcoin network for transactions with known private keys and send the coins to yourself.

## INSTALL

`npm install`

## USAGE

`npm start`

## CONFIG

### .env

- ADDRESSDB
  - Path to level DB.
- SIPHON
  - Address to send found funds.
- NUM_PEERS
  - Number of peers to maintain a connection to.
- GET_ADDRS
  - Get top nodes from bitnodes.io.
- MEMPOOL_SIZE
  - Number of recently seen transactions to keep track of. Reduces load and bandwidth usage.
- DNS_SEED
  - Get peers from DNS.
- LISTEN_ADDR
  - Add peers from network announcements.

### Broken streambrain.js <filename>

Accepts a file of brain wallet words, one per line, to populate the address database.

### Broken streampriv.hs <filename>

Accepts a file of private keys, one per line, to populate the address database.

### findaddr.js | findbrain.js | findpriv.js <search>

Check if a specific address, brain wallet, or private key is in your address database. Brain wallets and private keys will be added automatically if not found.
