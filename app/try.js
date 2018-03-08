var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')

var web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));
console.log("blockchain address = " + config.blockchainNodeAddress);

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
    console.log("accounts = " + err)
    return;
  }

  if (accs.length == 0) {
    console.error("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
    return;
  }

  console.log(accs);
  accounts = accs;
  part1 = accounts[1];
  part2 = accounts[2];
});

function toBytes32(i) {
    const stringed = "0000000000000000000000000000000000000000000000000000000000000000" + i.toString(16);
    return "0x" + stringed.substring(stringed.length - 64, stringed.length);
}

function initETHAtomicSwap(secret, receiver, sum, timelock) {
   let secretBytes = toBytes32(secret);

   let htlc;

   HTLContract.deployed()
   .then(instance => htlc = instance)
   .then(() => htlc.hashSecret(secretBytes, {from: part1}))
   .then(hashlock => htlc.newContract(receiver, hashlock, timelock, {from: part1, value: sum}))
   .then(tx => {
          const log = tx.logs[0];
          console.log("Log event  = "  + log.event);
          console.log("Log args = ", log.args);
    })
    .catch(err => console.error("error = " + err))
   // //.then(htlc => htlc.newContract(receiver, hashlock, timelock))
   // .then(htlc => htlc.testF.call(1, {from: accounts[0]}))
   //   .then(res => console.log("res = " + res))
   //   //.then(htlc => htlc.newContract(receiver, hashlock, timelock, {from: part1, value: sum}))
   // // .then(tx => {
   // //   const log = tx.logs[0];
   // //   console.log("Log event  = "  + log.event);
   // //   console.log("Log args = ", log.args);
   // // })

}

initETHAtomicSwap('hello', part2, 2, Date.now() / 1000 + 24 * 60 * 60)

// function tryH() {
//
//   HTLContract.deployed()
//   .then(htlc => htlc.testF.call({from: accounts[0]}))
//   .then(res => console.log("res = " + res))
//   .catch(err => console.error("error = " + err))
//
//   TestTokenContract.deployed()
//    .then(token => console.log("address = " + token.address));
// }
//
// tryH();
