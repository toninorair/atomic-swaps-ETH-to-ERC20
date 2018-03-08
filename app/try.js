var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')

var web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));
console.log("blockchain address = " + config.blockchainNodeAddress);

var HTLContract = contract(require('../build/contracts/HashedTimelock.json'))
HTLContract.setProvider(web3.currentProvider)

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

function tryH() {

  HTLContract.deployed()
  .then(htlc => htlc.testF.call({from: accounts[0]}))
  .then(res => console.log("res = " + res))
  .catch(err => console.error("error = " + err))

  TestTokenContract.deployed()
   .then(token => console.log("address = " + token.address));
}

tryH();
