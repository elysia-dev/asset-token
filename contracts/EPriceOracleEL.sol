// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IEPriceOracle.sol";
import "./Library.sol";

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EPriceOracleEL is IEPriceOracle {
    using SafeMath for uint256;
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

    function getPrice() external view override returns (uint256) {
        return _elPrice;
    }

    function mulPrice(uint256 price)
        external
        view
        override
        returns (uint256)
    {
        ExchangeLocalVars memory vars =
            ExchangeLocalVars({
                currencyPrice: _elPrice,
                assetTokenPrice: price
            });

        return vars.mulPrice();
    }

    function setElPrice(uint256 elPrice_) external returns (bool) {
        require(msg.sender == admin, "Restricted to admin.");

        emit NewElPrice(elPrice_);

        return true;
    }
}
