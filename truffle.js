module.exports = {
  networks: {
    ganache: {
      host: "localhost",
      port: 7545,
      // gas: 6500000,
      network_id: "5777"
    },
     development: {
      host: "localhost",
      port: 8545,
      gas: 1950000,
      network_id: "*"
    }
  }
};
