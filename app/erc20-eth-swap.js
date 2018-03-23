var ethSwap = require('./blockchains/eth-part.js');
var erc20Swap = require('./blockchains/erc20-part.js');

var config = require('./config.js')
var utils = require('./utils.js')

var Web3 = require('web3');



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

  swap(secret, part1, part2, ethSum, tokenSum)

});


function swap(secret, part1, part2, ethSum, tokenSum) {
  let tokenI, htlcERC20I, htlcI, resHTLC, resHTLC_ERC20;

  ethSwap.deploy()
    .then(res => htlcI = res.htlcI)
    .then(() => erc20Swap.deploy())
    .then(res => {
       htlcERC20I = res.htlcERC20I;
       tokenI = res.tokenI;
    })
    //add listener for withdrawn by first initial party
    .then(() => {
      var ethWithdrawn = htlcI.LogHTLCWithdraw();
      ethWithdrawn.watch(function(err, result) {

        if (err) {
          console.err(err)
          return;
        }

        let secret = result.args.secret;
        console.log("SECRET REVEALED = ", secret)
        //withdraw money from ETH HTLC contract by second party
        htlcERC20I.withdraw(resHTLC_ERC20.contractId, secret,
                      {from: part1, gas: config.GAS_VALUE_MIN})
        .then(tx => {
           console.log("LOGS = ", tx.logs[0])
           ethWithdrawn.stopWatching((err, result) => {});
          })
         .catch(err => console.error("error occured = ", err));
     });
    })
    //approve moving of money from Token contract instance owner to HashedTimeLockERC20 instance
    .then(() => tokenI.approve(htlcERC20I.address, tokenSum, {from: part2}))
    //find out hashlock of the SECRET
    .then(() => htlcERC20I.hashSecret(secret, {from: part2}))

    //create ERC20 HTLC script, lock fund there for first participant
    .then(hashlock => erc20Swap.init(part2, htlcERC20I, part1, hashlock,
                   utils.getTimelock(false), tokenI.address, tokenSum))
    .then(res => resHTLC_ERC20 = res)

     //create ETH HTLC script, lock fund there for second participant
    .then(() => ethSwap.init(part1, htlcI, part2, resHTLC_ERC20.hashlock, utils.getTimelock(true), ethSum))
    .then(res => resHTLC = res)


    //withdraw ETH
    .then(() => htlcI.withdraw(resHTLC.contractId, secret, {from: part2}))
    .then(tx => console.log("LOGS = ", tx.logs[0]))

    //error handling
    .catch(err => console.error("error occured = ", err));

}

module.exports = {
  swap: swap
}
