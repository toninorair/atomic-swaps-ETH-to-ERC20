var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')

var web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));

var HTLContract = contract(require('../build/contracts/HashedTimelock.json'))
HTLContract.setProvider(web3.currentProvider)

var HTLERC20Contract = contract(require('../build/contracts/HashedTimelockERC20.json'))
HTLERC20Contract.setProvider(web3.currentProvider)

var accounts = [];

// Get the initial accounts .
web3.eth.getAccounts(function(err, accs) {
  if (err != null) {
    alert("There was an error fetching your accounts.");
    return;
  }

  if (accs.length == 0) {
    alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
    return;
  }

  console.log(accs);
  accounts = accs;
});

function tryH() {

  HTLContract.deployed()
  .then(htlc => htlc.testF.call({from: accounts[0]}))
  .then(res => console.log("res = " + res))
  .catch(err => console.error("error = " + err))
}

tryH();
