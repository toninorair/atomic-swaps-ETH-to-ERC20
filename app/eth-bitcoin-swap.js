var ethSwap = require('./eth-part.js');
var btcSwap = require('./bitcoin-part.js');

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
  let htlcI, resHTLC, resHTLC_ERC20;

  ethSwap.deploy()
    .then(res => htlcI = res.htlcI)
    //add listener for withdrawn by first initial party
    .then(() => {
      var ethWithdrawn = htlcI.LogHTLCWithdraw();
      ethWithdrawn.watch(function(err, result) {

        if (err) {
          console.err(err)
          return;
        }

        let secret = web3.utils.toAscii(result.args.secret);
        console.log("SECRET REVEALED = ", secret)
        //TODO withdraw money from bitcoin side HERE
        btcSwap.redeemBTCFromScript('81449b5125ce9df7a8846bda46f1655566d012e65e73c3da2bb07c1445879dac', 1, 1000, secret)
        ethWithdrawn.stopWatching((err, result) => {});
     });
    })
    //TODO here should be returned txid, input num and sum
    .then(() => btcSwap.createP2SH(secret))
    //find out hashlock of the SECRET
    .then(() => htlcI.hashSecret(secret, {from: part1}))
     //create ETH HTLC script, lock fund there for second participant
    .then(hashlock => ethSwap.init(part1, htlcI, part2, hashlock, utils.getTimelock(true), ethSum))
    .then(res => resHTLC = res)

    // //withdraw money from ETH HTLC contract by second party
    .then(() => htlcI.withdraw(resHTLC.contractId, secret, {from: part2}))

    .then(tx => console.log("LOGS = ", tx.logs[0]))

    //error handling
    .catch(err => console.error("error occured = ", err));

}

module.exports = {
  swap: swap
}
