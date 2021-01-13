// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IAssetToken {
    function purchase(uint256 amount) external returns (bool);
    function refund(uint256 amount) external returns (bool);
    function claimReward() external;
}