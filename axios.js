const axios = require("axios");
const { defaultHeaderInterpreter, setupCache } = require("axios-cache-interceptor");

/**
 * HeadersInterpreter for axios-cache-interceptor
 */
const shortTTLHeadersInterpreter = (headers) => {
  const def = defaultHeaderInterpreter(headers);
  if (def === "dont cache") {
    // Return a short TTL
    return 30 * 1000;
  }
  return def;
};

const axiosClient = () => {
  const client = axios.create({
    headers: { "Content-Type": "application/json" },
  });

  return setupCache(client, {
    headerInterpreter: shortTTLHeadersInterpreter,
  });
}

module.exports = { axiosClient };