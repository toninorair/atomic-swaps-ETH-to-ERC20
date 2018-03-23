var Web3 = require('web3');

var config = require('./config.js')
var swaps = require('./atomic-swap.js');


let web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));

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

  //TODO ADD generation of a random secret here
  let secret = 'hello'
  let ethSum = 2;
  let tokenSum = 200;

  swap = new swaps.AtomicSwap(secret, part1, part2, ethSum, tokenSum);
  swap.executeAtomicSwap();

});
