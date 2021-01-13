// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "./Library.sol";

interface IPriceOracle {
    function getEthPrice() external view returns (uint);
    function getELPrice() external view returns (uint);
}

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract PriceOracle is IPriceOracle {

    using SafeCast for int;
    using AssetTokenLibrary for ExchangeLocalVars;

    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor(address priceFeed_) {
            priceFeed = AggregatorV3Interface(priceFeed_);
        }

    function getEthPrice() external override view returns (uint) {
        return getLatestEthPrice().toUint256();
    }

    function getLatestEthPrice() public view returns (int) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }

    function getELPrice() external override view returns (uint) {

    }
}
