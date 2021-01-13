// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PriceOracle.sol";
import "./EAccessControl.sol";
import "./IAssetToken.sol";
import "./Library.sol";

contract AssetToken is IAssetToken, ERC20 {
    using SafeMath for uint256;
    using AssetTokenLibrary for RewardLocalVars;

    IEAccessControl private _eAccessControl;
    IPriceOracle private _ePriceOracle;
    IERC20 private _el;

    uint256 public _latitude;
    uint256 public _longitude;
    uint256 public _assetPrice;
    uint256 public _interestRate;

    IERC20 public _refToken; // reftoken should be initialized by EAssetToken

    // monthlyRent$/(secondsPerMonth*averageBlockPerSecond)
    // Decimals: 18
    uint256 public _rewardPerBlock;

    // Account rewards (USD)
    // Decimals: 18
    mapping(address => uint256) private _rewards;

    // Account block numbers
    mapping(address => uint256) private _blockNumbers;

    // USD per Elysia token
    // decimals: 18
    uint256 public _elPrice;

    // USD per Elysia Asset Token
    // decimals: 18
    uint256 public _price;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint256 newRewardPerBlock);

    constructor(
        IEAccessControl eAccessControl_,
        IERC20 el_,
        uint256 amount_,
        uint256 elPrice_,
        uint256 price_,
        uint256 rewardPerBlock_,
        uint256 latitude_,
        uint256 longitude_,
        uint256 assetPrice_,
        uint256 interestRate_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20 (
        name_,
        symbol_) {
        _eAccessControl = eAccessControl_;
        _el = el_;
        _elPrice = elPrice_;
        _price = price_;
        _rewardPerBlock = rewardPerBlock_;
        _latitude = latitude_;
        _longitude = longitude_;
        _assetPrice = assetPrice_;
        _interestRate = interestRate_;

        _mint(address(this), amount_);
        _setupDecimals(decimals_);
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
    function purchase(uint256 amount) external override returns (bool) {
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
    function refund(uint256 amount) external override returns (bool) {
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
    function _checkBalance(address buyer, address seller, uint256 amount) internal view {
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
    function claimReward() external override onlyWhitelisted {
        uint256 reward = getReward(msg.sender) * 10 ** 18 / _elPrice;

        require(reward < _el.balanceOf(address(this)), 'AssetToken: Insufficient seller balance.');
        _el.transfer(msg.sender, reward);
        _clearReward(msg.sender);

		emit RewardClaimed(msg.sender, reward);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(balanceOf(from) >= amount, "AssetToken: transfer amount exceeds balance");

        /* RewardManager */
        _saveReward(from);
        _saveReward(to);
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawElToAdmin() public onlyAdmin {
        _el.transfer(msg.sender, _el.balanceOf(address(this)));
    }

    function getRewardPerBlock() public view returns (uint256) {
        return _rewardPerBlock;
    }

    function setRewardPerBlock(uint256 rewardPerBlock_)
        external
        onlyAdmin
        returns (bool)
    {
        _rewardPerBlock = rewardPerBlock_;

        emit NewRewardPerBlock(rewardPerBlock_);

        return true;
    }

    /*** Reward functions ***/

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function getReward(address account) public view returns (uint256) {

        RewardLocalVars memory vars = RewardLocalVars({
            newReward: 0,
            accountReward: _rewards[account],
            accountBalance: balanceOf(account),
            rewardBlockNumber: _blockNumbers[account],
            blockNumber: block.number,
            diffBlock: 0,
            rewardPerBlock: _rewardPerBlock,
            totalSupply: totalSupply()
        });

        return vars.getReward();
    }

    // function _getReward(address account) public view returns (uint256) {
    //     uint256 newReward = 0;

    //     if (
    //         _blockNumbers[account] != 0 && block.number > _blockNumbers[account]
    //     ) {
    //         newReward =
    //             (_refToken.balanceOf(account) *
    //                 (block.number - _blockNumbers[account]) *
    //                 _rewardPerBlock) /
    //             _refToken.totalSupply();
    //     }

    //     return newReward + _rewards[account];
    // }

    function _saveReward(address account) internal returns (bool) {
        if (account == address(this)) {
            return true;
        }

        _rewards[account] = getReward(account);
        _blockNumbers[account] = block.number;

        return true;
    }

    function _clearReward(address account) internal returns (bool) {
        _rewards[account] = 0;
        _blockNumbers[account] = block.number;

        return true;
    }

    /// @dev Restricted to members of the whitelisted user.
    modifier onlyWhitelisted() {
        require(_eAccessControl.isWhitelisted(msg.sender), "Restricted to whitelisted.");
        _;
    }

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin() {
        require(_eAccessControl.isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    function toElAmount(uint amount) public view returns (uint) {

        ExchangeLocalVars memory vars = ExchangeLocalVars({
            currencyPrice: _ePriceOracle.getELPrice(),
            assetTokenPrice: _price
        });

        return vars.toAmount(amount);
    }

    function toEthAmount(uint amount) public view returns (uint) {

        ExchangeLocalVars memory vars = ExchangeLocalVars({
            currencyPrice: _ePriceOracle.getEthPrice(),
            assetTokenPrice: _price
        });

        return vars.toAmount(amount);
    }
}
