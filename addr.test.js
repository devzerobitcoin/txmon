require("dotenv").config();
const { getAddr, parseIPAddress } = require("./addr");

describe.skip("get addr test", () => {
  test("parseIPAddress - IPv4", () => {
    const result = parseIPAddress("1.2.3.4:8333");
    expect(result).toEqual({
      ip: {
        v4: "1.2.3.4",
      },
      port: 8333,
    });
  });

  test("parseIPAddress - IPv6", () => {
    const result = parseIPAddress("[5:6:7:8]:8333");
    expect(result).toEqual({
      ip: {
        v6: "5:6:7:8",
      },
      port: 8333,
    });
  });

  test("parseIPAddress - Invalid IP address format", () => {
    expect(() => parseIPAddress("invalid")).toThrowError(
      "Invalid IP address format"
    );
  });

  test("it should return addrs array", async () => {
    const addrs = await getAddr();
    expect(addrs.length).toBeGreaterThan(1);
    const addr = addrs[0];
    expect(addr).toHaveProperty("ip", expect.any(Object));
    expect(addr).toHaveProperty("port", expect.any(Number));
  });

  test("it should return addrs with given address", async () => {
    const myAddrs = [
      {
        ip: {
          v4: "10.20.30.40",
        },
        port: 6789,
      },
    ];
    const addrs = await getAddr({ addrs: myAddrs });
    expect(addrs.length).toBeGreaterThan(1);
    const addr = addrs.find(({ port }) => port === myAddrs[0].port);
    expect(addr).toHaveProperty("ip", { v4: "10.20.30.40" });
    expect(addr).toHaveProperty("port", 6789);
  });
});
