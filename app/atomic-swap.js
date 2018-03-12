var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')
var utils = require('./utils.js')

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


// Get the initial accounts
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
  part2 = accounts[0];

  let resHTLC, resHTLC_ERC20, tokenI, htlcERC20I, htlcI;
  let secret = 'hello'

  //deploy all needed contracts
  TESTC.deployed()
   .then(instance => tokenI = instance)
   .then(() => HTLC.deployed())
   .then(instance => htlcI = instance)
   .then(() => HTLC_ERC20.deployed())

   //approve moving of money from Token contract instance owner to HashedTimeLockERC20 instance
   .then(instance => {
       htlcERC20I = instance;
       tokenI.approve(instance.address, 10000, {from: part2})
    })

    //create ETH HTLC script, lock fund there for second participant
   .then(() => initETHAtomicSwap(htlcI, secret, part2, utils.getTimelock(true), 2))
   .then(res => {
     console.log("New ETH HTLC was successfully added");
     resHTLC = res;
   })

   //create ERC20 HTLC script, lock fund there for first participant
   .then(() => initERC20AtomicSwap(htlcERC20I, part1, resHTLC.hashlock,
                  utils.getTimelock(false), tokenI.address, 200))
   .then(res => {
     console.log("New ERC20 HTLC was successfully added");
     resHTLC_ERC20 = res;
   })

   //withdraw money from ETH ERC20 HTLC contract by first party
   .then(() => htlcERC20I.withdraw(resHTLC_ERC20.contractId, secret, {from: part1, gas: config.GAS_VALUE}))
   .then(tx => console.log("LOGS = ", tx.logs[0]))

   //withdraw money from ETH HTLC contract by second party
   .then(() => htlcI.withdraw(resHTLC.contractId, secret, {from: part2}))
   .then(tx => console.log("LOGS = ", tx.logs[0]))

   //error handling
   .catch(err => console.error("error occured = ", err));
});


function initETHAtomicSwap(htlc, secret, receiver, timelock, sum) {
   return htlc.hashSecret(secret, {from: part1})
    .then(hashlock => htlc.newContract(receiver, hashlock, timelock,
                          {from: part1, value: sum, gas: config.GAS_VALUE}))
    .then(tx => {
          const log = tx.logs[0]
          utils.printNewContractInfo(log);
          return log.args;
     })
     .catch(err => console.error("error = " + err))
}

function initERC20AtomicSwap(htlc, receiver, hashlock, timelock, tokenContract, sum) {
  return htlc.newContract(receiver, hashlock, timelock, tokenContract, sum,
           {from: part2, gas: config.GAS_VALUE})
   .then(tx => {
         const log = tx.logs[0]
         utils.printNewContractInfo(log)
         return log.args;
    })
    .catch(err => console.error("error = " + err))
}
