// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IPriceOracle.sol";

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract PriceOracle is IPriceOracle {
    using SafeMath for uint256;

    // USD per Elysia token
    // decimals: 18
    uint256 private _price;

    address private _admin;

    constructor(uint256 price_) {
        _admin = msg.sender;
        _price = price_;
    }

    function getPrice() external view override returns (uint256) {
        return _price;
    }

    function mulPrice(uint256 amount) external view override returns (uint256) {
        return amount.mul(_price);
    }

    function setPrice(uint256 price_) external returns (bool) {
        require(msg.sender == _admin, "PriceOracle: Restricted to admin");

        _price = price_;

        emit NewPrice(price_);

        return true;
    }
}
