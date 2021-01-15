// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./EPriceOracle.sol";
import "./EAccessControl.sol";

interface IAssetToken {
    function purchase(uint256 amount) external returns (bool);
    function refund(uint256 amount) external returns (bool);
    function claimReward() external;
    function setEAccessControl(IEAccessControl eAccessControl) external;
    function setEPriceOracle(IEPriceOracle ePriceOracle) external;
}