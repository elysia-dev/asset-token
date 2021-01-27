// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IEPriceOracle.sol";
import "./Library.sol";

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EPriceOracleEth is IEPriceOracle {
    using SafeCast for int256;
    using SafeMath for uint256;

    address public admin;

    AggregatorV3Interface internal _priceFeed;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor(address priceFeed_) {
        _priceFeed = AggregatorV3Interface(priceFeed_);
        admin = msg.sender;
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

        return price.toUint256().mul(1e10);
    }
}
