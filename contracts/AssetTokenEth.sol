// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./EController.sol";
import "./IAssetToken.sol";
import "./AssetTokenBase.sol";

contract AssetTokenEth is IAssetTokenEth, AssetTokenBase {
    using SafeMath for uint256;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    constructor(
        IEController eController_,
        uint256 amount_,
        uint256 price_,
        uint256 rewardPerBlock_,
        uint256 payment_,
        uint256 latitude_,
        uint256 longitude_,
        uint256 assetPrice_,
        uint256 interestRate_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    )
        AssetTokenBase(
            eController_,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            latitude_,
            longitude_,
            assetPrice_,
            interestRate_,
            name_,
            symbol_,
            decimals_
        )
    {}

    /**
     * @dev purchase asset token with el.
     *
     * This can be used to purchase asset token with Elysia Token (EL).
     *
     * Requirements:
     * - `amount` this contract should have more asset token than the amount.
     * - `amount` msg.sender should have more el than elAmount converted from the amount.
     */
    function purchase(uint256 amount)
        external
        payable
        override
        whenNotPaused
        returns (bool)
    {
        _checkBalance(msg.sender, address(this), amount);

        require(
            msg.value == amount.mul(eController.mulPrice(price)),
            "Not enough msg.value"
        );
        _transfer(address(this), msg.sender, amount);

        return true;
    }

    /**
     * @dev retund asset token.
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
        returns (bool)
    {
        _checkBalance(address(this), msg.sender, amount);

        _transfer(msg.sender, address(this), amount);

        require(
            msg.sender.send(amount.mul(eController.mulPrice(price))),
            "Eth : send failed"
        );

        return true;
    }

    /**
     * @dev Claim account reward.
     *
     * This can be used to claim account accumulated rewrard with Elysia Token (EL).
     *
     * Emits a {RewardClaimed} event.
     *
     * Requirements:
     * - `elPrice` cannot be the zero.
     */
    function claimReward()
        external
        override
        whenNotPaused
        onlyWhitelisted(msg.sender)
    {
        uint256 reward =
            getReward(msg.sender).mul(1e18).div(eController.getPrice());

        require(
            reward < address(this).balance,
            "AssetToken: Insufficient seller balance."
        );

        _clearReward(msg.sender);
        if (!payable(msg.sender).send(reward)) {
            _saveReward(msg.sender);
        }

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawToAdmin() public onlyAdmin(msg.sender) {
        require(payable(msg.sender).send(address(this).balance), "Admin withdraw failed");
        //payable(msg.sender).send(address(this).balance);
    }

    /**
     * @dev check if buyer and seller have sufficient balance.
     *
     * This can be used to check balance of buyer and seller before swap.
     *
     * Requirements:
     * - `amount` buyer should have more asset token than the amount.
     * - `amount` seller should have more el than elAmount converted from the amount.
     */
    function _checkBalance(
        address buyer,
        address seller,
        uint256 amount
    ) internal view {
        require(
            balanceOf(seller) > amount,
            "AssetToken: Insufficient seller balance."
        );
    }

    receive() external payable {
    }
}
