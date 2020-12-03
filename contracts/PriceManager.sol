// SPDX-Lisence-Identifier: MIT
pragma solidity 0.7.0;

import "./EAccessControl.sol";

/**
 * @title PriceManager
 * @notice Manage elysia price and asset token price
 * @author Elysia
 */
contract PriceManager is EAccessControl {
    /// @notice Emitted when el Price is changed
    event NewElPrice(uint256 newElPrice);

    /// @notice Emitted when price is changed
    event NewPrice(uint256 newPrice);

    // USD per Elysia token
    // decimals: 18
    uint256 public _elPrice;

    // USD per Elysia Asset Token
    // decimals: 18
    uint256 public _price;

    // TODO
    // Use oracle like chainlink
    function getElPrice() public view returns (uint256) {
        return _elPrice;
    }

    function getPrice() public view returns (uint256) {
        return _price;
    }

    function setElPrice(uint256 elPrice_) external onlyAdmin returns (bool) {
        _elPrice = elPrice_;

        emit NewElPrice(elPrice_);

        return true;
    }

    function setPrice(uint256 price_) external onlyAdmin returns (bool) {
        _price = price_;

        emit NewPrice(price_);

        return true;
    }

    function toElAmount(uint256 amount) public view returns (uint256) {
        uint256 amountEl = (amount * _price * (10**18)) / _elPrice;
        require(
            (amountEl / amount) == ((_price * (10**18)) / _elPrice),
            "PriceManager: multiplication overflow"
        );

        return amountEl;
    }
}
