// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./EController.sol";
import "./IAssetToken.sol";
import "./AssetTokenBase.sol";
import "hardhat/console.sol";

contract AssetTokenEth is IAssetTokenEth, AssetTokenBase {
    using AssetTokenLibrary for AssetTokenLibrary.SpentLocalVars;
    using AssetTokenLibrary for AssetTokenLibrary.AmountLocalVars;
    using AssetTokenLibrary for AssetTokenLibrary.ReserveLocalVars;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    constructor(
        IEController eController_,
        uint256 amount_,
        uint256 price_,
        uint256 rewardPerBlock_,
        address payment_,
        uint256[] memory coordinate_,
        uint256 interestRate_,
        uint256 cashReserveRatio_,
        string memory name_,
        string memory symbol_
    )
        AssetTokenBase(
            eController_,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            coordinate_,
            interestRate_,
            cashReserveRatio_,
            name_,
            symbol_
        )
    {}

    /**
     * @dev purchase asset token with eth.
     *
     * This can be used to purchase asset token with ether.
     *
     * Requirements:
     * - `msg.value` msg.sender should have more eth than msg.value.
     */
    function purchase()
        external
        payable
        override
        whenNotPaused
    {
        require(
            msg.value > 0,
            "Not enough msg.value"
        );

        AssetTokenLibrary.AmountLocalVars memory vars =
            AssetTokenLibrary.AmountLocalVars({
                spent: msg.value,
                assetTokenPrice: price
            });

        uint256 amount = vars.getAmount();

        _checkBalance(address(this), amount);
        _transfer(address(this), msg.sender, amount);

        if (_checkReserve()) {
            console.log("checkReserve", _checkReserve());
            console.log("getReserveSurplus", _getReserveSurplusOrDeficit(0));
            _depositReserve(_getReserveSurplusOrDeficit(0));
        }
        console.log("contract ether balance", address(this).balance);
    }

    /**
     * @dev refund asset token.
     *
     * This can be used to refund asset token with ether (Eth).
     *
     * Requirements:
     * - `amount` msg.sender should have more asset token than the amount.
     * - `amount` this contract should have more eth than ether converted from the amount.
     */
    function refund(uint256 amount)
        external
        override
        whenNotPaused
    {
        _checkBalance(msg.sender, amount);

        if (!_checkReserve()) {
            console.log("checkReserve", _checkReserve());
            console.log("getReserveSurplus", _getReserveSurplusOrDeficit(0));
            _withdrawReserve(_getReserveSurplusOrDeficit(0));
        }

        AssetTokenLibrary.SpentLocalVars memory vars =
            AssetTokenLibrary.SpentLocalVars({
                amount: amount,
                assetTokenPrice: price
            });

        uint256 spent = vars.getSpent();

        require(
            address(this).balance >= spent,
            "AssetToken: Insufficient buyer balance."
        );

        _transfer(msg.sender, address(this), amount);

        require(
            payable(msg.sender).send(spent),
            "Eth : send failed"
        );
    }

    /**
     * @dev Claim account reward.
     *
     * This can be used to claim account accumulated rewrard with ether (Eth).
     *
     * Emits a {RewardClaimed} event.
     *
     * Requirements:
     * - `getPrice` cannot be the zero.
     */
    function claimReward()
        external
        override
        whenNotPaused
    {
        uint256 reward = getReward(msg.sender);

        require(
            reward <= address(this).balance,
            "AssetToken: Insufficient contract balance."
        );

        _clearReward(msg.sender);
        if (!payable(msg.sender).send(reward)) {
            _saveReward(msg.sender);
        }

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Withdraw all eth from this contract to admin
     */
    function withdrawToAdmin() public onlyAdmin(msg.sender) {
        require(payable(msg.sender).send(address(this).balance), "Admin withdraw failed");
    }

    /**
     * @dev check if buyer and seller have sufficient balance.
     *
     * This can be used to check balance of buyer and seller before swap.
     *
     * Requirements:
     * - `amount` buyer should have more asset token than the amount.
     */
    function _checkBalance(
        address seller,
        uint256 amount
    ) internal view {
        require(
            balanceOf(seller) >= amount,
            "AssetToken: Insufficient seller balance."
        );
    }

    /**
     * @notice check reserves of asset token
     * @return return true if the reserves for payment is sufficient
     */
    function _checkReserve()
        internal
        view
        returns (bool)
    {
        AssetTokenLibrary.ReserveLocalVars memory vars =
            AssetTokenLibrary.ReserveLocalVars({
                price: price,
                totalSupply: totalSupply(),
                interestRate: interestRate,
                cashReserveRatio: cashReserveRatio,
                balanceOfAssetToken: balanceOf(address(this)),
                contractBalance: address(this).balance
            });
        return (vars.checkReserve());
    }

    /**
     * @notice get reserves of asset token
     * @return return reserve surplus or deficit
     */

    function _getReserveSurplusOrDeficit(uint256 amount)
        internal
        view
        returns (uint256)
    {
        uint256 balanceOfAssetToken = balanceOf(address(this)) + amount;

        AssetTokenLibrary.ReserveLocalVars memory vars =
            AssetTokenLibrary.ReserveLocalVars({
                price: price,
                totalSupply: totalSupply(),
                interestRate: interestRate,
                cashReserveRatio: cashReserveRatio,
                balanceOfAssetToken: balanceOfAssetToken,
                contractBalance: address(this).balance
            });
        return (vars.getReserveSurplusOrDeficit());
    }

    /**
     * @notice deposit reserve into the controller
     */
    function _depositReserve(uint256 reserveSurplus) internal {
        require(
            payable(address(eController)).send(reserveSurplus),
            "Eth : send failed"
        );

        emit ReserveDeposited(reserveSurplus);
    }

    /**
     * @notice withdraw reserve from the controller
     */
    function _withdrawReserve(uint256 reserveDeficit) internal {
        require(
            eController.withdrawReserveFromAssetTokenEth(reserveDeficit),
            "withdraw failed"
        );
    }

    /**
     * @dev allow asset token to receive eth from other accounts.
     * Monthly rent profit (eth) is acummulated in asset token from elysia admin account
     */
    receive() external payable {
    }
}
