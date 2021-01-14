// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/utils/SafeCast.sol";
import "../Library.sol";

interface IEPriceOracle {

    function getELPrice() external view returns (uint);
    function getEthPrice() external view returns (uint);
    function toElAmount(uint amount, uint price) external view returns (uint);
    function toEthAmount(uint amount, uint price) external view returns (uint);
}

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EPriceOracle is IEPriceOracle {

    using SafeCast for int;
    using AssetTokenLibrary for ExchangeLocalVars;

    /// @notice Emitted when el Price is changed
    event NewElPrice(uint256 newElPrice);

    // USD per Elysia token
    // decimals: 18
    uint256 private _elPrice;

    address public admin;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor(address priceFeed_) {
            priceFeed = AggregatorV3Interface(priceFeed_);
            admin = msg.sender;
        }

    function getEthPrice() external override view returns (uint) {
        return _getEthPrice();
    }

    function getELPrice() external override view returns (uint) {
        return _elPrice;
    }

    function _getEthPrice() internal view returns (uint) {
        int 

        return price.toUint256();
    }

    function setElPrice(uint256 elPrice_) external returns (bool) {
        require(msg.sender == admin, "Only admin can set EL price");

        emit NewElPrice(elPrice_);

        return true;
    }

    function toElAmount(uint amount, uint price) external view override returns (uint) {

        ExchangeLocalVars memory vars = ExchangeLocalVars({
            currencyPrice: _elPrice,
            assetTokenPrice: price
        });

        return vars.toAmount(amount);
    }

    function toEthAmount(uint amount, uint price) external view override returns (uint) {

        ExchangeLocalVars memory vars = ExchangeLocalVars({
            currencyPrice: _getEthPrice(),
            assetTokenPrice: price
        });

        return vars.toAmount(amount);
    }
}
