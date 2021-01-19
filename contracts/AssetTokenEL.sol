// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./EController.sol";
import "./IAssetToken.sol";
import "./AssetToken.sol";

contract AssetTokenEL is IAssetTokenERC20, AssetToken {

    using SafeMath for uint;

    IERC20 private _el;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint reward);

    constructor(
        IERC20 el_,
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
    ) AssetToken (
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
        _el = el_;
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
    function purchase(uint amount) external override whenNotPaused returns (bool) {
        _checkBalance(msg.sender, address(this), amount);

        require(_el.transferFrom(msg.sender, address(this), eController.mulPrice(amount, price)), 'EL : transferFrom failed');
        transferFrom(address(this), msg.sender, amount);

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

        require(_el.transfer(msg.sender, eController.mulPrice(amount, price)), 'EL : transfer failed');
        transferFrom(msg.sender, address(this), amount);

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

        require(reward < _el.balanceOf(address(this)), 'AssetToken: Insufficient seller balance.');
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
     * - `amount` buyer should have more asset token than the amount.
     * - `amount` seller should have more el than elAmount converted from the amount.
     */
    function _checkBalance(address buyer, address seller, uint amount) internal view {
        require(_el.balanceOf(buyer) > eController.mulPrice(amount, price), 'AssetToken: Insufficient buyer el balance.');
        require(balanceOf(seller) > amount, 'AssetToken: Insufficient seller balance.');
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawToAdmin() public onlyAdmin(msg.sender) {
        _el.transfer(msg.sender, _el.balanceOf(address(this)));
    }


}
