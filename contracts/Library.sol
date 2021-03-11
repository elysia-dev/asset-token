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

    function checkReserveSurplus(ReserveLocalVars memory self, uint256 contractBalance)
        internal
        pure
        returns (bool) {
        return (getReserveSurplus(self) * self.cashReserveRatio / 1e36 >= contractBalance);
    }

    function getReserveSurplus(ReserveLocalVars memory self)
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
