// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IAssetTokenBase {
    function setRewardPerBlock(uint256 rewardPerBlock_) external returns (bool);

    function pause() external;

    function unpause() external;

    function setEController(address eController) external;

    function getPayment() external view returns (uint256);
}

interface IAssetTokenERC20 {
    function purchase(uint256 amount) external returns (bool);

    function refund(uint256 amount) external returns (bool);

    function claimReward() external;
}

interface IAssetTokenEth {
    function purchase(uint256 amount) external payable returns (bool);

    function refund(uint256 amount) external returns (bool);

    function claimReward() external;
}
