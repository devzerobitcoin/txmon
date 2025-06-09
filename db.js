const { Level } = require("level");
const path = require('path');

if (!process.env.ADDRESSDB) {
  throw new Error('ADDRESSDB environment variable must be set to a valid database path');
}

const dbPath = path.resolve(process.env.ADDRESSDB);
var db = new Level(dbPath, { valueEncoding: "json" });

const fetchAddr = async ({ addr } = {}) => {
  try {
    let result = await db.get(addr);
    
    // Handle potential JSON string values
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
        // Handle potential double encoding
        if (typeof result === 'string') {
          result = JSON.parse(result);
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        return false;
      }
    }

    // Validate required keys
    if (!result || typeof result !== 'object' || 
        !('bn' in result) || 
        !('compressed' in result) || 
        !('network' in result)) {
      console.error('Invalid address data structure:', result);
      return false;
    }

    return result;
  } catch (error) {
    if (error.code !== "LEVEL_NOT_FOUND") {
      console.error(error);
    }
    return false;
  }
};

const closeDb = async () => {
  await db.close();
};

const validateKeyObject = (value) => {
  if (typeof value !== 'object' || value === null) {
    return { isValid: false, error: 'Not an object' };
  }

  const requiredKeys = ['bn', 'compressed', 'network'];
  const missingKeys = requiredKeys.filter(key => !(key in value));
  
  if (missingKeys.length > 0) {
    return { isValid: false, error: `Missing required keys: ${missingKeys.join(', ')}` };
  }
  
  if (typeof value.bn !== 'string') {
    return { isValid: false, error: 'bn must be a string' };
  }
  if (typeof value.compressed !== 'boolean') {
    return { isValid: false, error: 'compressed must be a boolean' };
  }
  if (typeof value.network !== 'string') {
    return { isValid: false, error: 'network must be a string' };
  }

  return { isValid: true };
};

const findInvalidJsonEntries = async (limit = Infinity) => {
  let fixedCount = 0;
  let invalidCount = 0;
  let processedCount = 0;
  
  try {
    // Iterate through all entries in the database
    for await (const [key, value] of db.iterator()) {
      processedCount++;
      
      // Check for double-encoded JSON
      if (typeof value === 'string' && 
          (value.startsWith('{') || value.startsWith('[')) && 
          (value.endsWith('}') || value.endsWith(']'))) {
        try {
          const parsed = JSON.parse(value);
          const parsedValidation = validateKeyObject(parsed);
          
          if (parsedValidation.isValid) {
            // If the parsed value is valid, fix this entry
            console.log(`Found fixable double-encoded entry for key ${key}:`);
            console.log('Original:', value);
            console.log('Fixing to:', parsed);
            console.log('---');
            
            await db.put(key, parsed);
            fixedCount++;
          } else {
            // Double-encoded but invalid structure
            console.log(`Invalid double-encoded entry for key ${key}:`);
            console.log(`Error: ${parsedValidation.error}`);
            console.log('Original:', value);
            console.log('Parsed:', parsed);
            console.log('---');
            invalidCount++;
          }
        } catch (parseError) {
          // If it fails to parse, it's just a regular string that happens to start/end with braces
        }
      }
      // For non-string values, validate object structure
      else if (typeof value !== 'string') {
        const validation = validateKeyObject(value);
        if (!validation.isValid) {
          console.log(`Invalid entry found for key ${key}:`);
          console.log(`Error: ${validation.error}`);
          console.log('Value:', value);
          console.log('---');
          invalidCount++;
        }
      }

      if (processedCount >= limit) {
        console.log(`\nReached limit of ${limit} entries`);
        break;
      }
    }

    console.log(`\nProcessed ${processedCount} entries`);
    if (fixedCount > 0) {
      console.log(`Fixed ${fixedCount} double-encoded entries`);
    }
    if (invalidCount > 0) {
      console.log(`Found ${invalidCount} invalid entries that need attention`);
    }
    if (fixedCount === 0 && invalidCount === 0) {
      console.log('No issues found in the processed entries');
    }
    
  } catch (error) {
    console.error('Error scanning database:', error);
    throw error;
  }
};

module.exports = { fetchAddr, closeDb, findInvalidJsonEntries };
