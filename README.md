txmon
=====
Monitor the Bitcoin network for transactions with known private keys and send the coins to yourself.

INSTALL
-------
npm install

USAGE
-----

### ./txmon.js
Connects to the network choosing peers via DNS.

### ./txmon_getaddr.js
Pulls the [top nodes](https://bitnodes.21.co/nodes/leaderboard) from bitnodes.21.co and connects to them.

### ./streambrain.js <filename>
Accepts a file of brain wallet words, one per line, to populate the address database.

### ./streampriv.hs <filename>
Accepts a file of private keys, one per line, to populate the address database.

### ./find*.js <search>
Check if a specific brain wallet, address, or private key is in your address database.
