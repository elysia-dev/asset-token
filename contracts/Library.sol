// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";

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
    using SafeMath for uint256;

    function getReward(RewardLocalVars memory self)
        internal
        pure
        returns (uint256)
    {
        if (
            self.rewardBlockNumber != 0 &&
            self.blockNumber > self.rewardBlockNumber
        ) {
            self.diffBlock = self.blockNumber.sub(self.rewardBlockNumber);
            self.newReward = self.accountBalance
                .mul(self.diffBlock)
                .mul(self.rewardPerBlock)
                .div(self.totalSupply);
        }
        return self.accountReward.add(self.newReward);
    }

    function checkReserve(ReserveLocalVars memory self)
        internal
        pure
        returns (bool)
    {
        if (
            self.price
                .mul(self.totalSupply
                    .mul(self.interestRate)
                    .div(1e18)
                    .add(self.totalSupply)
                    .sub(self.balanceOfAssetToken)
                )
                .mul(self.cashReserveRatio)
                .div(1e18)
                > self.contractEther
        ) {
            return false;
        }
        return true;
    }

    function getSpent(SpentLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.amount.mul(self.assetTokenPrice).div(1e18);
    }

    function getAmount(AmountLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.spent.mul(1e18).div(self.assetTokenPrice);
    }


}
