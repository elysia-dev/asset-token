// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IAssetTokenBase {
    function setEController(address newEController) external;
    function setRewardPerBlock(uint256 newRewardPerBlock) external;
    function setCashReserveRatio(uint256 newCashReserveRatio) external;
    function pause() external;
    function unpause() external;
    function getLatitude() external view returns (uint256);
    function getLongitude() external view returns (uint256);
    function getAssetPrice() external view returns (uint256);
    function getInterestRate() external view returns (uint256);
    function getPrice() external view returns (uint256);
    function getPayment() external view returns (uint256);
}

interface IAssetTokenERC20 {
    function purchase(uint256 spent) external;
    function refund(uint256 amount) external;
    function claimReward() external;
}

interface IAssetTokenEth {
    function purchase() external payable;
    function refund(uint256 amount) external;
    function claimReward() external;
}
