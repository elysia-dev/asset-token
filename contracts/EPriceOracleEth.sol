// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./IEPriceOracle.sol";
import "./Library.sol";

/**
 * @title Elysia's price feed
 * @notice implements chainlink price aggregator
 * @author Elysia
 */
contract EPriceOracleEth is IEPriceOracle {
    using SafeCast for int256;

    AggregatorV3Interface internal _priceFeed;

    constructor(address priceFeed_) {
        _priceFeed = AggregatorV3Interface(priceFeed_);
    }

    function getPrice() external view override returns (uint256) {
        return _getEthPrice();
    }

    function _getEthPrice() internal view returns (uint256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = _priceFeed.latestRoundData();

        return price.toUint256() * 1e10;
    }

}