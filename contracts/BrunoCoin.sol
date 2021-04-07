pragma solidity ^0.5.10;

import "./EIP20Interface.sol";

contract BrunoCoin is EIP20Interface {

    mapping (address => uint256) public balances;
    address payable []shareholders;

    constructor (
    	uint256 _initialAmount,
    	string memory _tokenName,
    	uint8 _decimalsUnit,
    	string memory _tokenSymbol
    ) public {
    	name = _tokenName;
    	symbol = _tokenSymbol;
    	decimals = _decimalsUnit;
    	totalSupply = _initialAmount;
    }

    function transfer(address payable _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        shareholders.push(_to);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }


}