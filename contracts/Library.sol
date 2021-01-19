// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";

struct RewardLocalVars {
    uint newReward;
    uint accountReward;
    uint accountBalance;
    uint rewardBlockNumber;
    uint blockNumber;
    uint diffBlock;
    uint rewardPerBlock;
    uint totalSupply;
    }

struct ExchangeLocalVars {
    uint currencyPrice;
    uint assetTokenPrice;
}

library AssetTokenLibrary {

    using SafeMath for uint256;

    function getReward(RewardLocalVars memory self) internal pure returns (uint) {
        if (
            self.rewardBlockNumber != 0 && self.blockNumber > self.rewardBlockNumber
        ) {
            self.diffBlock = self.blockNumber.sub(self.rewardBlockNumber);
            self.newReward = self.accountBalance.mul(self.diffBlock).mul(self.rewardPerBlock).div(self.totalSupply);
        }
        return self.accountReward.add(self.newReward);
    }

    function mulPrice(ExchangeLocalVars memory self, uint amount) internal pure returns (uint) {
        return amount.mul(self.assetTokenPrice).mul(1e18).div(self.currencyPrice);
    }
}