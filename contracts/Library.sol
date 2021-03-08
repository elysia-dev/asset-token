// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "hardhat/console.sol";

struct RewardLocalVars {
    uint256 newReward;
    uint256 accountReward;
    uint256 accountBalance;
    uint256 rewardBlockNumber;
    uint256 blockNumber;
    uint256 diffBlock;
    uint256 rewardPerBlock;
    uint256 totalSupply;
}

struct SpentLocalVars {
    uint256 amount;
    uint256 assetTokenPrice;
}

struct AmountLocalVars {
    uint256 spent;
    uint256 assetTokenPrice;
}

struct ReserveLocalVars {
    uint256 price;
    uint256 totalSupply;
    uint256 interestRate;
    uint256 balanceOfAssetToken;
    uint256 contractEther;
    uint256 cashReserveRatio;
}

library AssetTokenLibrary {

    function getReward(RewardLocalVars memory self)
        internal
        pure
        returns (uint256)
    {
        if (
            self.rewardBlockNumber != 0 &&
            self.blockNumber > self.rewardBlockNumber
        ) {
            self.diffBlock = self.blockNumber - self.rewardBlockNumber;
            self.newReward = self.accountBalance
                * self.diffBlock
                * self.rewardPerBlock
                / self.totalSupply;
        }
        return self.accountReward + self.newReward;
    }

    function checkReserve(ReserveLocalVars memory self)
        internal
        pure
        returns (bool)
    {
        return (
            self.price
                * (self.totalSupply
                    * self.interestRate
                    / 1e18
                    + self.totalSupply
                    - self.balanceOfAssetToken
                )
                * self.cashReserveRatio
                / 1e36
                >= self.contractEther
        );
    }

    function getSpent(SpentLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.amount * self.assetTokenPrice / 1e18;
    }

    function getAmount(AmountLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.spent * 1e18 / self.assetTokenPrice;
    }


}
