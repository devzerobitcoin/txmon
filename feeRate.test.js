const { Transaction } = require("bitcore-lib");
const { updateFeeRate } = require("./feeRate")

const initialFeeRate = Transaction.FEE_PER_KB;

describe("Estimated fee rate update", () => {
  test("it should update the fee rate", async () => {
    await updateFeeRate();
    expect(Transaction.FEE_PER_KB).not.toEqual(initialFeeRate);
  })

  test("it should not update the fee rate", async () => {
    const { updated } = await updateFeeRate();
    expect(updated).toBe(false);
  })

  test("it should force update the fee rate to newFee", async () => {
    const newFee = 12345;
    const { updated } = await updateFeeRate({ force: true, newFee });
    expect(Transaction.FEE_PER_KB).toBe(newFee);
  })

  test("it should not update from cached results", async () => {
    const { isCached, updated } = await updateFeeRate({ force: true });
    expect(isCached).toBe(true);
    expect(updated).toBe(false);
  })
})