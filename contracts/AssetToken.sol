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
    using SafeMath for uint;
    using AssetTokenLibrary for RewardLocalVars;

    IEAccessControl public _eAccessControl;
    IEPriceOracle public _ePriceOracle;
    IERC20 private _el;

    uint public _latitude;
    uint public _longitude;
    uint public _assetPrice;
    uint public _interestRate;

    IERC20 public _refToken; // reftoken should be initialized by EAssetToken

    // monthlyRent$/(secondsPerMonth*averageBlockPerSecond)
    // Decimals: 18
    uint public _rewardPerBlock;

    // Account rewards (USD)
    // Decimals: 18
    mapping(address => uint) private _rewards;

    // Account block numbers
    mapping(address => uint) private _blockNumbers;

    // USD per Elysia Asset Token
    // decimals: 18
    uint public _price;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint reward);

    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint newRewardPerBlock);

    /// @notice Emitted when ePriceOracle is changed
    event NewPriceOracle(address newPriceOracle);

    /// @notice Emitted when eAccessControl is changed
    event NewAccessControl(address newAccessControl);

    constructor(
        IEPriceOracle ePriceOracle_,
        IEAccessControl eAccessControl_,
        IERC20 el_,
        uint amount_,
        uint price_,
        uint rewardPerBlock_,
        uint latitude_,
        uint longitude_,
        uint assetPrice_,
        uint interestRate_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20 (name_,symbol_) {
        _el = el_;
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
    function purchase(uint amount) external override returns (bool) {
        _checkBalance(msg.sender, address(this), amount);

        require(_el.transferFrom(msg.sender, address(this), _ePriceOracle.toElAmount(amount, _price)), 'EL : transferFrom failed');
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
    function refund(uint amount) external override returns (bool) {
        _checkBalance(address(this), msg.sender, amount);

        require(_el.transfer(msg.sender, _ePriceOracle.toElAmount(amount, _price)), 'EL : transfer failed');
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
    function _checkBalance(address buyer, address seller, uint amount) internal view {
        require(_el.balanceOf(buyer) > _ePriceOracle.toElAmount(amount, _price), 'AssetToken: Insufficient buyer el balance.');
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
        uint reward = getReward(msg.sender).mul(1e18).div(_ePriceOracle.getELPrice());

        require(reward < _el.balanceOf(address(this)), 'AssetToken: Insufficient seller balance.');
        _el.transfer(msg.sender, reward);
        _clearReward(msg.sender);

		emit RewardClaimed(msg.sender, reward);
    }

    /*** Reward functions ***/

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function getReward(address account) public view returns (uint) {

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

    // function _getReward(address account) public view returns (uint) {
    //     uint newReward = 0;

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

    function _beforeTokenTransfer(address from, address to, uint amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(balanceOf(from) >= amount, "AssetToken: transfer amount exceeds balance");

        /* RewardManager */
        _saveReward(from);
        _saveReward(to);
    }

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

    /*** Admin functions ***/

    function setEPriceOracle(IEPriceOracle ePriceOracle) external onlyAdmin {
        _ePriceOracle = ePriceOracle;

        emit NewPriceOracle(address(_ePriceOracle));
    }

    function setEAccessControl(IEAccessControl eAccessControl) external onlyAdmin {
        _eAccessControl = eAccessControl;

        emit NewAccessControl(address(_eAccessControl));
    }

    function setRewardPerBlock(uint rewardPerBlock_)
        external
        onlyAdmin
        returns (bool)
    {
        _rewardPerBlock = rewardPerBlock_;

        emit NewRewardPerBlock(rewardPerBlock_);

        return true;
    }

    /**
     * @dev Withdraw all El from this contract to admin
     */
    function withdrawElToAdmin() public onlyAdmin {
        _el.transfer(msg.sender, _el.balanceOf(address(this)));
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
}
