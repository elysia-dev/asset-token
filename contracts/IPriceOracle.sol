// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IPriceOracle {
    /// @notice Emitted when el Price is changed
    event NewPrice(uint256 price);

    function getPrice() external view returns (uint256);

    function mulPrice(uint256 amount) external view returns (uint256);
}
