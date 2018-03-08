pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * A basic token for testing the HashedTimelockERC20.
 */
contract TestToken is StandardToken {
    string public constant name = "TEST Token";
    string public constant symbol = "TEST";
    uint8 public constant decimals = 18;

    function TestToken(uint _initialBalance) public {
        balances[msg.sender] = _initialBalance;
        totalSupply_ = _initialBalance;
    }
}
