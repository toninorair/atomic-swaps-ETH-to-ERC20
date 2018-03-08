var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')

var web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));
//console.log("blockchain address = " + config.blockchainNodeAddress);

var HTLContract = contract(require('../build/contracts/HashedTimelock.json'))
HTLContract.setProvider(web3.currentProvider)

//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof HTLContract.currentProvider.sendAsync !== "function") {
  HTLContract.currentProvider.sendAsync = function() {
    return HTLContract.currentProvider.send.apply(
      HTLContract.currentProvider, arguments
    );
  };
}

var HTLERC20Contract = contract(require('../build/contracts/HashedTimelockERC20.json'))
HTLERC20Contract.setProvider(web3.currentProvider)

var TestTokenContract = contract(require('../build/contracts/TestToken.json'))
TestTokenContract.setProvider(web3.currentProvider)

var accounts = [];
var part1 = null;
var part2 = null;

// Get the initial accounts .
web3.eth.getAccounts(function(err, accs) {
  if (err != null) {
    console.error("There was an error fetching your accounts.");
    return;
  }

  if (accs.length == 0) {
    console.error("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
    return;
  }

  accounts = accs;
  part1 = accounts[1];
  part2 = accounts[2];

  initETHAtomicSwap('hello', part2, 2, Date.now() / 1000 + 24 * 60 * 60);
});


function initETHAtomicSwap(secret, receiver, sum, timelock) {
   let htlc;
   
   HTLContract.deployed()
    .then(instance => {
      htlc = instance;
      return htlc.hashSecret(secret, {from: part1})
     })
    .then(hashlock => htlc.newContract(receiver, hashlock, timelock, {from: part1, value: sum, gas: 4000000}))
    .then(tx => {
          const log = tx.logs[0];
          console.log("Log event  = "  + log.event);
          console.log("Log args = ", log.args);
     })
     .catch(err => console.error("error = " + err))
}
