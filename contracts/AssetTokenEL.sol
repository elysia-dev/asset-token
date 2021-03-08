// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./EController.sol";
import "./IAssetToken.sol";
import "./AssetTokenBase.sol";

contract AssetTokenEL is IAssetTokenERC20, AssetTokenBase {
    using AssetTokenLibrary for AssetTokenLibrary.SpentLocalVars;
    using AssetTokenLibrary for AssetTokenLibrary.AmountLocalVars;

    IERC20 private _el;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    constructor(
        IERC20 el_,
        IEController eController_,
        uint256 amount_,
        uint256 price_,
        uint256 rewardPerBlock_,
        uint256 payment_,
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
    {
        _el = el_;
    }

    /**
     * @dev purchase asset token with el.
     *
     * This can be used to purchase asset token with Elysia Token (EL).
     *
     * Requirements:
     * - `spent` msg.sender should have more spent.
     * - `spent` this contract should have more asset tokens amount calculated with spent.
     */
    function purchase(uint256 spent)
        external
        override
        whenNotPaused
    {
        AssetTokenLibrary.AmountLocalVars memory vars =
            AssetTokenLibrary.AmountLocalVars({
                spent: spent,
                assetTokenPrice: price
            });

        uint256 amount = vars.getAmount();

        _checkBalance(msg.sender, spent, address(this), amount);

        require(
            _el.transferFrom(
                msg.sender,
                address(this),
                spent
            ),
            "EL : transferFrom failed"
        );
        _transfer(address(this), msg.sender, amount);
    }

    /**
     * @dev refund asset token.
     *
     * This can be used to refund asset token with Elysia Token (EL).
     *
     * Requirements:
     * - `amount` msg.sender should have more asset token than the amount.
     * - `amount` this contract should have more el than elAmount converted from the amount.
     */
    function refund(uint256 amount)
        external
        override
        whenNotPaused
    {
        AssetTokenLibrary.SpentLocalVars memory vars =
            AssetTokenLibrary.SpentLocalVars({
                amount: amount,
                assetTokenPrice: price
            });

        uint256 spent = vars.getSpent();

        _checkBalance(address(this), spent, msg.sender, amount);

        require(
            _el.transfer(msg.sender, spent),
            "EL : transfer failed"
        );
        _transfer(msg.sender, address(this), amount);
    }

    /**
     * @dev Claim account reward.
     *
     * This can be used to claim account accumulated rewrard with Elysia Token (EL).
     *
     * Emits a {RewardClaimed} event.
     */
    function claimReward()
        external
        override
        whenNotPaused
    {
        uint256 reward = getReward(msg.sender);

        require(
            reward <= _el.balanceOf(address(this)),
            "AssetToken: Insufficient seller balance."
        );
        _el.transfer(msg.sender, reward);
        _clearReward(msg.sender);

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev check if buyer and seller have sufficient balance.
     *
     * This can be used to check balance of buyer and seller before swap.
     *
     * Requirements:
     * - `spent` should be positive.
     * - `spent` buyer should have spent token value than the spent.
     * - `amount` should be positive.
     * - `amount` seller should have more asset token balance than amount.
     */
    function _checkBalance(
        address buyer,
        uint256 spent,
        address seller,
        uint256 amount
    ) internal view {
        require(
            spent > 0 && amount > 0,
            "AssetToken: Wrong spent or amount."
        );

        require(
            _el.balanceOf(buyer) >= spent,
            "AssetToken: Insufficient buyer el balance."
        );

        require(
            balanceOf(seller) >= amount,
            "AssetToken: Insufficient seller balance."
        );
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawToAdmin() public onlyAdmin(msg.sender) {
        _el.transfer(msg.sender, _el.balanceOf(address(this)));
    }
}
