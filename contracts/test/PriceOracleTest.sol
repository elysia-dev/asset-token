// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../Library.sol";

interface IEPriceOracle {

    function getElPrice() external view returns (uint);
    function getEthPrice() external view returns (uint);
    function toElAmount(uint amount, uint price) external view returns (uint);
    function toEthAmount(uint amount, uint price) external view returns (uint);
}

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EPriceOracleTest is IEPriceOracle {

    using SafeCast for int;
    using SafeMath for uint;
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
    constructor() {
            admin = msg.sender;
        }

    function getEthPrice() external override view returns (uint) {
        return _getEthPrice();
    }

    function getElPrice() external override view returns (uint) {
        return _elPrice;
    }

    function _getEthPrice() internal view returns (uint) {

        int price = 100000000000;

        return price.toUint256().mul(1e10);
    }

    function setElPrice(uint256 elPrice_) external returns (bool) {
        require(msg.sender == admin, "Restricted to admin.");

        _elPrice = elPrice_;

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