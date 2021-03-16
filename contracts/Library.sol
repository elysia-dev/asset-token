// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

library AssetTokenLibrary {

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
        uint256 cashReserveRatio;
        uint256 balanceOfAssetToken;
        uint256 contractBalance;
    }

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

    /**
     * @notice calculate reserve
     * @return return true if reserve is sufficient.
     */
    function checkReserve(ReserveLocalVars memory self)
        internal
        pure
        returns (bool) {
        return (getReserve(self) * self.cashReserveRatio / 1e18 <= self.contractBalance);
    }

    function getReserve(ReserveLocalVars memory self)
        internal
        pure
        returns (uint256)
    {
        return  self.price
                    * (self.totalSupply
                        * self.interestRate
                        / 1e18
                        + self.totalSupply
                        - self.balanceOfAssetToken
                    ) / 1e18;
    }

    function getReserveSurplusOrDeficit(ReserveLocalVars memory self)
        internal
        pure
        returns (uint256) {

        if (checkReserve(self)) {
            return (self.contractBalance - getReserve(self) * self.cashReserveRatio / 1e18);
        }
        return (getReserve(self) * self.cashReserveRatio / 1e18 - self.contractBalance);
    }
}
