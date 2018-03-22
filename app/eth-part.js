var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')
var utils = require('./utils.js')

let web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));

var HTLC = contract(require('../build/contracts/HashedTimelock.json'))
HTLC.setProvider(web3.currentProvider)
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof HTLC.currentProvider.sendAsync !== "function") {
  HTLC.currentProvider.sendAsync = function() {
    return HTLC.currentProvider.send.apply(
      HTLC.currentProvider, arguments
    );
  };
}

deployContracts() {
  let htlcI;

  return HTLC.deployed())
   .then(instance => {
     htlcI = instance;
     return { htlcI: htlcI }
   })
   .catch(err => console.error("Deployment of HTLC contract failed with an error = ", err))
}


initETHAtomicSwap(owner, htlc, receiver, timelock) {
   return htlc.hashSecret(this.secret, {from: owner})
    .then(hashlock => {
      console.log("sha")
      console.log("SHA256 = ", hashlock.toString('hex'))
      console.log("SHA 256 buffer = ", Buffer.from(hashlock))
      return htlc.newContract(receiver, hashlock, timelock,
                          {from: owner, value: this.ethSum, gas: config.GAS_VALUE})
    })
    .then(tx => {
          const log = tx.logs[0]
          utils.printNewContractInfo(log);
          return log.args;
     })
     .catch(err => console.error("Init ETH Atomic swap failed with an error = " + err))
}
