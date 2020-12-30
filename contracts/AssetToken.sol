// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PriceManager.sol";
import "./RewardManager.sol";
import "./EErc20.sol";

/**
 * @title Elysia's AssetToken
 * @author Elysia
 */
contract AssetToken is EErc20, PriceManager, RewardManager {
    using SafeMath for uint256;
    ERC20 private _el;

    uint256 public _latitude;
    uint256 public _longitude;
    uint256 public _assetPrice;
    uint256 public _interestRate;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    constructor(
        ERC20 el_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 amount_,
        address admin_,
        uint256 elPrice_,
        uint256 price_,
        uint256 rewardPerBlock_,
        uint256 latitude_,
        uint256 longitude_,
        uint256 assetPrice_,
        uint256 interestRate_
    ){
        _el = el_;
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _elPrice = elPrice_;
        _price = price_;
        _rewardPerBlock = rewardPerBlock_;
        _latitude = latitude_;
        _longitude = longitude_;
        _assetPrice = assetPrice_;
        _interestRate = interestRate_;

        _mint(address(this), amount_);

        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setRoleAdmin(WHITELISTED, DEFAULT_ADMIN_ROLE);

        _refToken = this;
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
    function purchase(uint256 amount) public returns (bool) {
        _checkBalance(msg.sender, address(this), amount);

        require(_el.transferFrom(msg.sender, address(this), toElAmount(amount)), 'EL : transferFrom failed');
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
    function refund(uint256 amount) public returns (bool) {
        _checkBalance(address(this), msg.sender, amount);

        require(_el.transfer(msg.sender, toElAmount(amount)), 'EL : transfer failed');
        _transfer(msg.sender, address(this), amount);

        return true;
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
    function _checkBalance(address buyer, address seller, uint256 amount) internal {
        require(_el.balanceOf(buyer) > toElAmount(amount), 'AssetToken: Insufficient buyer el balance.');
        require(balanceOf(seller) > amount, 'AssetToken: Insufficient seller balance.');
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
    function claimReward() external onlyWhitelisted {
        uint256 reward = getReward(msg.sender) * 10 ** 18 / _elPrice;

        require(reward < _el.balanceOf(address(this)), 'AssetToken: Insufficient seller balance.');
        _el.transfer(msg.sender, reward);
        _clearReward(msg.sender);

		emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal override(EErc20) {
        require(sender != address(0), "AssetToken: transfer from the zero address");
        require(recipient != address(0), "AssetToken: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        require(_balances[sender] >= amount, "AssetToken: transfer amount exceeds balance");

        /* RewardManager */
        _saveReward(sender);
        _saveReward(recipient);

        _balances[sender] = _balances[sender] - amount;
        _balances[recipient] = _balances[recipient].add(amount);

        emit Transfer(sender, recipient, amount);
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawElToAdmin() public onlyAdmin {
        _el.transfer(msg.sender, _el.balanceOf(address(this)));
    }
}
