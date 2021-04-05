// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;


/**
 * @title AssetToken module for calculating
 * @notice LocalVars are used to calculate in purchase, refund, claimReward
 * RewardLocalVars : user reward calculation
 * SpentLocalVars : the ratio of asset token and user reward calculation in refund
 * AmountLocalVars : the ratio of asset token and user reward calculation in purchase
 * ReserveLocalVars : No used
 */
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
        uint256 currencyPrice;
        uint256 assetTokenPrice;
    }

    struct AmountLocalVars {
        uint256 spent;
        uint256 currencyPrice;
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

    /**
     * @notice The accured reward is the sum of account reward and newReward
     * it returns the accountReward if token matured.
     * @return Return account reward accrued.
     */
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

    /**
     * @notice Calculate the ratio of assetToken and user reward in refund
     * @return currency amount to given amount of token for refunding
     */
    function getSpent(SpentLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.amount * self.assetTokenPrice / self.currencyPrice;
    }

   /**
     * @notice Calculate the ratio of assetToken and user reward in purchase
     * @return the amount of currency to given amount of currency for purchasing
     */
    function getAmount(AmountLocalVars memory self)
        internal
        pure
        returns (uint)
    {
        return self.spent * self.currencyPrice / self.assetTokenPrice;
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
                    ) / 1e18
                    * self.cashReserveRatio / 1e18;
    }

    function getReserveSurplusOrDeficit(ReserveLocalVars memory self)
        internal
        pure
        returns (uint256) {

        if (checkReserve(self)) {
            return (self.contractBalance - getReserve(self));
        }
        return (getReserve(self) - self.contractBalance);
    }
}
