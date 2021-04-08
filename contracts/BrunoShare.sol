pragma solidity ^0.5.10;

import "./BrunoCoin.sol";

contract BrunoShare is BrunoCoin {

	address payable public owner;

    uint256 public tokenValue;
    uint256 public availableTokens;

	constructor (
    	uint256 _initialAmount,
    	string memory _tokenName,
    	uint8 _decimalsUnit,
    	string memory _tokenSymbol,
        uint256 _initialTokenValue
    ) BrunoCoin(_initialAmount, _tokenName, _decimalsUnit, _tokenSymbol) public {
        owner = msg.sender;
        availableTokens = _initialAmount;
        tokenValue = _initialTokenValue;
    }


	function buy() payable public {
        owner.transfer(msg.value);

        uint256 tokens = msg.value / tokenValue;

        balances[msg.sender] += tokens;
        availableTokens -= tokens;
        shareholders.push(msg.sender);

        emit Transfer(address(this), msg.sender, tokens);
    }

    function payProfit() payable public {
        require(msg.sender == owner);
        uint256 profitBalance = msg.value;

        uint256 share = profitBalance / totalSupply;

        for(uint i=0; i<shareholders.length; i++) {
            if(balances[shareholders[i]] > 0) {
                uint256 profit = share * (balances[shareholders[i]] / 10**uint256(decimals));
                shareholders[i].transfer(profit);
                profitBalance -= profit;
            }
        }

        msg.sender.transfer(profitBalance);
    }

}