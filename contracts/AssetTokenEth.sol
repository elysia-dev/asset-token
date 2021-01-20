// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./EController.sol";
import "./IAssetToken.sol";
import "./AssetTokenBase.sol";

contract AssetTokenEth is IAssetTokenEth, AssetTokenBase {

    using SafeMath for uint;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint reward);

    constructor(
        IEController eController_,
        uint amount_,
        uint price_,
        uint rewardPerBlock_,
        uint payment_,
        uint latitude_,
        uint longitude_,
        uint assetPrice_,
        uint interestRate_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) AssetTokenBase (
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
        decimals_) {
    }

    /**
     * @dev purchase asset token with el.
     *
     * This can be used to purchase asset token with Elysia Token (EL).
     *
     * Requirements:
     * - `amount` this contract should have more asset token than the amount.
     * - `amount` msg.sender should have more el than elAmount converted from the amount.
     */
    function purchase(uint amount) external payable override whenNotPaused returns (bool) {
        _checkBalance(msg.sender, address(this), amount);

        require(msg.value == eController.mulPrice(amount, price), 'Not enough msg.value');
        require(transferFrom(address(this), msg.sender, amount), 'Asset Token : transfer Failed');

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
    function refund(uint amount) external override whenNotPaused returns (bool) {
        _checkBalance(address(this), msg.sender, amount);

        require(transferFrom(msg.sender, address(this), amount), 'Asset Token : transfer failed');
        require(msg.sender.send(eController.mulPrice(amount, price)), 'Eth : send failed');

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
    function claimReward() external override onlyWhitelisted(msg.sender) whenNotPaused {
        uint reward = getReward(msg.sender).mul(1e18).div(eController.getPrice());

        require(reward < address(this).balance, 'AssetToken: Insufficient seller balance.');

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
        payable(msg.sender).send(address(this).balance);
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
    function _checkBalance(address buyer, address seller, uint amount) internal view {
        require(balanceOf(seller) > amount, 'AssetToken: Insufficient seller balance.');
    }
}
