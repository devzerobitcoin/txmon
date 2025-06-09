require('dotenv').config();
const { findInvalidJsonEntries } = require("./db");

async function main() {
  try {
    const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;
    if (isNaN(limit) || limit <= 0) {
      console.error('Limit must be a positive number');
      process.exit(1);
    }
    
    await findInvalidJsonEntries(limit);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();