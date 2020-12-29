// SPDX-Lisence-Identifier: MIT
pragma solidity 0.7.0;

import "./EAccessControl.sol";

interface OraclePrice {
	function getCurrentPrice() external;
}

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

	/// @notice Emitted when price contract address is changed
	// event NewPriceContractAddress(address priceContractAddress);
	event NewSetPriceContract(address priceContractAddress);

    // USD per Elysia token
    // decimals: 18
    uint256 public _elPrice;

    // USD per Elysia Asset Token
    // decimals: 18
    uint256 public _price;

	OraclePrice public oracle_price;

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

	function setOraclePrice() external onlyAdmin returns (bool) {
		_elPrice = oracle_price.getCurrentPrice();

		emit NewElPrice(_elPrice);

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

	function setPriceContract(address priceContractAddress_) external onlyAdmin returns (bool) {
		oracle_price = OraclePrice(priceContractAddress_);

        emit NewSetPriceContract(priceContractAddress_);

        return true;
	}
}
