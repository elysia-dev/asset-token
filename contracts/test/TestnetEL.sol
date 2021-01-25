// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";


contract TestnetEL is ERC20 {

    using SafeMath for uint256;

    constructor(
        uint totalSupply_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, totalSupply_);
        _setupDecimals(decimals_);
    }

    function _transfer(address sender, address recipient, uint amount) internal override {
        super._transfer(sender, recipient, amount);
        console.log("[TestnetEL.sol]TestnetEL %s transfered from %s to %s:", amount.div(1e18), sender, recipient);
    }
}
