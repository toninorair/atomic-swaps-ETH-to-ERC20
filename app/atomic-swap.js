var contract = require('truffle-contract')
var Web3 = require('web3');
var config = require('./config.js')

var web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));
//console.log("blockchain address = " + config.blockchainNodeAddress);

var HTLC= contract(require('../build/contracts/HashedTimelock.json'))
HTLC.setProvider(web3.currentProvider)
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof HTLC.currentProvider.sendAsync !== "function") {
  HTLC.currentProvider.sendAsync = function() {
    return HTLC.currentProvider.send.apply(
      HTLC.currentProvider, arguments
    );
  };
}

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

  let resHTLC, resHTLC_ERC20, tokenAddress;

  TESTC.deployed()
   .then(instance => tokenAddress = instance.address)
   .then(() => initETHAtomicSwap('hello', part2, Date.now() / 1000 + 24 * 60 * 60, 2))
   .then(res => {
     //console.log("res = ", res);
     console.log("New ETH HTLC was successfully added");
     resHTLC = res;
     return initERC20AtomicSwap(part1, resHTLC.hashlock,
       Date.now() / 1000 + 12 * 60 * 60, tokenAddress, 100)
   })
   .then(res => {
     console.log("New ERC20 HTLC was successfully added");
     resHTLC_ERC20 = res;
     console.log(resHTLC_ERC20)
   })
   .catch(err => console.error("error occured = ", err));
});


function initETHAtomicSwap(secret, receiver, timelock, sum) {
   let htlc;
   let hashlock

   return HTLC.deployed()
    .then(instance => {
      htlc = instance;
      return htlc.hashSecret(secret, {from: part1})
     })
    .then(hashedSecret => {
      hashlock = hashedSecret;
      return htlc.newContract(receiver, hashlock, timelock, {from: part1, value: sum, gas: 4000000})
    })
    .then(tx => {
          const log = tx.logs[0]
          console.log("Log event  = "  + log.event);
          //TODO print more info here
          //console.log("Log args = ", log.args);

          return log.args;
     })
     .catch(err => console.error("error = " + err))
}

function initERC20AtomicSwap(receiver, hashlock, timelock, tokenContract, sum) {
  let htlc;

  return HTLC_ERC20.deployed()
   .then(instance => {
     console.log("inside with tokenContract = ", tokenContract);
     htlc = instance;
     return htlc.newContract(receiver, hashlock, timelock, tokenContract, sum,
           {from: part2, gas: 4000000})
    })
   .then(tx => {
         const log = tx.logs[0]
         console.log("Log event  = "  + log.event);
         //TODO print more info here
         //console.log("Log args = ", log.args);

         return log.args;
    })
    .catch(err => console.error("error = " + err))
}
