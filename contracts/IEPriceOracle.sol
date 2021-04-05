// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IEPriceOracle {
    function getPrice() external view returns (uint256);
}