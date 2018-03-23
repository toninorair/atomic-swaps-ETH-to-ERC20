var ethSwap = require('./eth-part.js');
var erc20Swap = require('./erc20-part.js');

var config = require('./config.js')
var utils = require('./utils.js')

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
      var erc20Withdrawn = htlcERC20I.LogHTLCERC20Withdraw();
      erc20Withdrawn.watch(function(err, result) {

        if (err) {
          console.err(err)
          return;
        }

        let secret = result.args.secret;
        console.log("SECRET REVEALED = ", secret)
        //withdraw money from ETH HTLC contract by second party
        htlcI.withdraw(resHTLC.contractId, secret, {from: part2})
         .then(tx => {
           console.log("LOGS = ", tx.logs[0])
           erc20Withdrawn.stopWatching((err, result) => {});
          })
         .catch(err => console.error("error occured = ", err));
     });
    })
    //approve moving of money from Token contract instance owner to HashedTimeLockERC20 instance
    .then(() => tokenI.approve(htlcERC20I.address, tokenSum, {from: part2}))

     //create ETH HTLC script, lock fund there for second participant
    .then(() => ethSwap.init(part1, htlcI, part2, utils.getTimelock(true), ethSum, secret))
    .then(res => resHTLC = res)

    //create ERC20 HTLC script, lock fund there for first participant
    .then(() => erc20Swap.init(part2, htlcERC20I, part1, resHTLC.hashlock,
                   utils.getTimelock(false), tokenI.address, tokenSum))
    .then(res => resHTLC_ERC20 = res)
    //withdraw ERC20
    .then(() => htlcERC20I.withdraw(resHTLC_ERC20.contractId, secret,
                  {from: part1, gas: config.GAS_VALUE_MIN}))
    .then(tx => console.log("LOGS = ", tx.logs[0]))

    // //withdraw money from ETH HTLC contract by second party
    // .then(() => htlcI.withdraw(resHTLC.contractId, this.secret, {from: this.part2}))
    // .then(tx => console.log("LOGS = ", tx.logs[0]))

    //error handling
    .catch(err => console.error("error occured = ", err));

}

module.exports = {
  swap: swap
}
