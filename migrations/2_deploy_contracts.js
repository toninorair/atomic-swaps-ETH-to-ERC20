var HashedTimelock = artifacts.require('./HashedTimelock.sol')
var HashedTimelockERC20 = artifacts.require('./HashedTimelockERC20.sol')
var TestToken = artifacts.require('./TestToken.sol');

module.exports = function(deployer) {
  deployer.deploy(HashedTimelock)
  deployer.deploy(HashedTimelockERC20)
  deployer.deploy(TestToken, 100000000)
}
