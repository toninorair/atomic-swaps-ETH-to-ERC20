var contract = require('truffle-contract')
var Web3 = require('web3');

var config = require('./config.js')
var utils = require('./utils.js')

let web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainNodeAdrress));

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

class AtomicSwap {

  // let secret, part1, part2;
  // let TESTC, HTLC, HTLC_ERC20;

  constructor(secret, part1, part2, ethSum, tokenSum) {
      this.secret = secret;
      this.part1 = part1;
      this.part2 = part2;

      this.ethSum = ethSum;
      this.tokenSum = tokenSum;

      this.initContracts();
  }

  initContracts() {
    this.HTLC= contract(require('../build/contracts/HashedTimelock.json'))
    this.HTLC.setProvider(web3.currentProvider)
    //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
    if (typeof this.HTLC.currentProvider.sendAsync !== "function") {
      this.HTLC.currentProvider.sendAsync = function() {
        return this.HTLC.currentProvider.send.apply(
          this.HTLC.currentProvider, arguments
        );
      };
    }

    this.HTLC_ERC20 = contract(require('../build/contracts/HashedTimelockERC20.json'))
    this.HTLC_ERC20.setProvider(web3.currentProvider)
    //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
    if (typeof this.HTLC_ERC20.currentProvider.sendAsync !== "function") {
      this.HTLC_ERC20.currentProvider.sendAsync = function() {
        return this.HTLC_ERC20.currentProvider.send.apply(
          this.HTLC_ERC20.currentProvider, arguments
        );
      };
    }

    this.TESTC = contract(require('../build/contracts/TestToken.json'))
    this.TESTC.setProvider(web3.currentProvider)
    //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
    if (typeof this.TESTC.currentProvider.sendAsync !== "function") {
      this.TESTC.currentProvider.sendAsync = function() {
        return this.TESTC.currentProvider.send.apply(
          this.TESTC.currentProvider, arguments
        );
      };
    }
  }

  deployAllContracts() {
    let tokenI, htlcERC20I, htlcI;

    return TESTC.deployed()
     .then(instance => tokenI = instance)
     .then(() => HTLC.deployed())
     .then(instance => htlcI = instance)
     .then(() => HTLC_ERC20.deployed())
     .then(instance => {
       htlcERC20I = instance;
       return { tokenI: tokenI, htlcERC20I: htlcERC20I, htlcI: htlcI }
     })
     .catch(err => console.error("Deploy all contracts failed with an error = ", err))
  }

  initETHAtomicSwap(owner, htlc, receiver, timelock) {
     return htlc.hashSecret(this.secret, {from: owner})
      .then(hashlock => htlc.newContract(receiver, hashlock, timelock,
                            {from: owner, value: this.ethSum, gas: config.GAS_VALUE}))
      .then(tx => {
            const log = tx.logs[0]
            utils.printNewContractInfo(log);
            return log.args;
       })
       .catch(err => console.error("Init ETH Atomic swap failed with an error = " + err))
  }

  initERC20AtomicSwap(owner, htlc, receiver, hashlock, timelock, tokenContract) {
    return htlc.newContract(receiver, hashlock, timelock, tokenContract, this.tokenSum,
             {from: owner, gas: config.GAS_VALUE})
     .then(tx => {
           const log = tx.logs[0]
           utils.printNewContractInfo(log)
           return log.args;
      })
      .catch(err => console.error("Init ERC20 Atomic swap failed with an error = " + err))
  }

  //executing atomic swap, main function here
  executeAtomicSwap() {

    let resHTLC, resHTLC_ERC20, tokenI, htlcERC20I, htlcI;

    //deploy all needed contracts
    this.deployAllContracts()
      .then(res => {
         tokenI = res.tokenI;
         htlcERC20I = res.htlcERC20I;
         htlcI = res.htlcI;
      })

     //approve moving of money from Token contract instance owner to HashedTimeLockERC20 instance
     .then(() => tokenI.approve(htlcERC20I.address, this.tokenSum, {from: this.part2}))

      //create ETH HTLC script, lock fund there for second participant
     .then(() => this.initETHAtomicSwap(this.part1, htlcI, this.part2, utils.getTimelock(true)))
     .then(res => resHTLC = res)

     //create ERC20 HTLC script, lock fund there for first participant
     .then(() => this.initERC20AtomicSwap(this.part2, htlcERC20I, this.part1, resHTLC.hashlock,
                    utils.getTimelock(false), tokenI.address))
     .then(res => resHTLC_ERC20 = res)

     //withdraw money from ETH ERC20 HTLC contract by first party
     .then(() => htlcERC20I.withdraw(resHTLC_ERC20.contractId, this.secret,
                   {from: this.part1, gas: config.GAS_VALUE}))
     .then(tx => console.log("LOGS = ", tx.logs[0]))

     //withdraw money from ETH HTLC contract by second party
     .then(() => htlcI.withdraw(resHTLC.contractId, this.secret, {from: this.part2}))
     .then(tx => console.log("LOGS = ", tx.logs[0]))

     //error handling
     .catch(err => console.error("error occured = ", err));
  }
}

module.exports.AtomicSwap = AtomicSwap
