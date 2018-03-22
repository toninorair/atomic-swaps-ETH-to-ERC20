var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')
var utils = require('./utils.js')

let web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));

var HTLC_ERC20 = contract(require('../build/contracts/HashedTimelockERC20.json'))
HTLC_ERC20.setProvider(web3.currentProvider)
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof HTLC_ERC20.currentProvider.sendAsync !== "function") {
  HTLC_ERC20.currentProvider.sendAsync = function() {
    return HTLC_ERC20.currentProvider.send.apply(
      HTLC_ERC20.currentProvider, arguments
    );
  };
}

var TESTC = contract(require('../build/contracts/TestToken.json'))
TESTC.setProvider(web3.currentProvider)
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof TESTC.currentProvider.sendAsync !== "function") {
  TESTC.currentProvider.sendAsync = function() {
    return TESTC.currentProvider.send.apply(
      TESTC.currentProvider, arguments
    );
  };
}

deployContracts() {
  let tokenI, htlcERC20I;

  return TESTC.deployed()
   .then(instance => tokenI = instance)
   .then(() => HTLC_ERC20.deployed())
   .then(instance => {
     htlcERC20I = instance;
     return { tokenI: tokenI, htlcERC20I: htlcERC20I}
   })
   .catch(err => console.error("Deployment of HTLC_ERC20 and TESTC failed with an error = ", err))
}
