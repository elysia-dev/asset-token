// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IAssetToken {

    function setRewardPerBlock(uint rewardPerBlock_) external returns (bool);
    function pause() external;
    function unpause() external;
    function setEController(address eController) external;
    function getPayment() external view returns (uint);
}

interface IAssetTokenERC20 {

    function purchase(uint amount) external returns (bool);
    function refund(uint amount) external returns (bool);
    function claimReward() external;
}

interface IAssetTokenEth {

    function purchase(uint amount) external payable returns (bool);
    function refund(uint amount) external returns (bool);
    function claimReward() external;

}