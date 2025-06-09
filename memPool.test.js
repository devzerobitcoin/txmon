require("dotenv").config();

const {
  addItem,
  getItem,
  maxSize,
  dataObject,
  insertionOrder,
} = require("./memPool");

test("addItem - Add item to dataObject and insertionOrder array", () => {
  const id = "item1";
  const item = { name: "Item 1" };

  addItem(id, item);

  expect(dataObject[id]).toEqual(item);
  expect(insertionOrder.length).toBe(1);
  expect(insertionOrder[0]).toBe(id);
});

test("addItem - Remove oldest item when maxSize is reached", () => {
  // Fill up the dataObject and insertionOrder array
  for (let i = 0; i < maxSize; i++) {
    addItem(`item${i}`, { name: `Item ${i}` });
  }

  // Add one more item
  addItem("item1000", { name: "Item 1000" });

  // Check if the oldest item is removed
  expect(dataObject["item0"]).toBeUndefined();
  expect(insertionOrder.length.toString()).toBe(process.env.MEMPOOL_SIZE);
});

test("getItem - Return item from dataObject", () => {
  const id = "item1";
  const item = { name: "Item 1" };
  dataObject[id] = item;

  expect(getItem(id)).toEqual(item);
});

test("getItem - Return undefined for non-existing item", () => {
  expect(getItem("nonexistent")).toBeUndefined();
});
