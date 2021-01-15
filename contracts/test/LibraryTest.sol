// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../Library.sol";

contract LibraryTest {

    using AssetTokenLibrary for RewardLocalVars;

    function getReward(
        uint accountReward,
        uint accountBalance,
        uint rewardBlockNumber,
        uint blockNumber,
        uint rewardPerBlock,
        uint totalSupply
   ) public view returns (uint) {
        RewardLocalVars memory vars = RewardLocalVars({
            newReward: 0,
            accountReward: accountReward,
            accountBalance: accountBalance,
            rewardBlockNumber: rewardBlockNumber,
            blockNumber: blockNumber,
            diffBlock: 0,
            rewardPerBlock: rewardPerBlock,
            totalSupply: totalSupply
        });
        return vars.getReward();
   }
}