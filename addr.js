const { axiosClient } = require("./axios");
const client = axiosClient();

const addrApiUrl = "https://bitnodes.io/api/v1/nodes/leaderboard/";

const getAddr = async ({ addrs = [] } = {}) => {
  try {
    if (process.env.GET_ADDRS === "true") {
      for (let page = 1; page < 6; page++) {
        const params = {
          limit: 100,
          page,
        };
        const { data: { results } = {} } = await client.get(addrApiUrl, {
          params,
        });
        const getAddrs = results.map(({ node }) => {
          try {
            return parseIPAddress(node);
          } catch (error) {
            console.error(
              JSON.stringify({ message: "Failed to parse IP address.", error })
            );
          }
        });
        addrs.push(...getAddrs);
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Failed to get addresses.",
        error: error.response?.data || error.message,
      })
    );
  }
  return addrs;
};

const parseIPAddress = (input) => {
  const ipv4Regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
  const ipv6Regex = /^\[([a-fA-F\d:]+)\]:(\d+)$/;

  const ipv4Match = input.match(ipv4Regex);
  const ipv6Match = input.match(ipv6Regex);

  if (ipv4Match) {
    return {
      ip: {
        v4: ipv4Match[1],
      },
      port: parseInt(ipv4Match[2], 10),
    };
  } else if (ipv6Match) {
    return {
      ip: {
        v6: ipv6Match[1],
      },
      port: parseInt(ipv6Match[2], 10),
    };
  } else {
    throw new Error(`Invalid IP address format: ${input}`);
  }
};

module.exports = { getAddr, parseIPAddress };
