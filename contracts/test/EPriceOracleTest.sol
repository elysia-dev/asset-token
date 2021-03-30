// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "../IEPriceOracle.sol";
import "../Library.sol";

/**
 * @title Elysia's Access Control
 * @notice Control admin account
 * @author Elysia
 */
contract EPriceOracleTest is IEPriceOracle {
    uint256 price;

    constructor(uint256 _price) {
        price = _price;
    }

    function getPrice() external view override returns (uint256) {
        return price;
    }
}