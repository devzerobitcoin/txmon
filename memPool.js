require("dotenv").config();

const maxSize = process.env.MEMPOOL_SIZE;
const dataObject = {};
const insertionOrder = [];

// Function to add an item to the object, removing the oldest item if the object exceeds maxSize
const addItem = (id, item) => {
  dataObject[id] = item;
  insertionOrder.push(id);

  if (insertionOrder.length > maxSize) {
    const oldestId = insertionOrder.shift();
    delete dataObject[oldestId];
  }
};

const getItem = (id) => dataObject[id];

module.exports = { addItem, getItem, maxSize, dataObject, insertionOrder };
