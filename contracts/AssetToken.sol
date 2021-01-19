// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IAssetToken.sol";
import "./IEPriceOracle.sol";
import "./EController.sol";
import "./Library.sol";

contract AssetToken is IAssetToken, ERC20, Pausable {
    using SafeMath for uint;
    using AssetTokenLibrary for RewardLocalVars;

    IEController public eController;

    uint public latitude;
    uint public longitude;
    uint public assetPrice;
    uint public interestRate;

    // USD per Elysia Asset Token
    // decimals: 18
    uint public price;

    // monthlyRent$/(secondsPerMonth*averageBlockPerSecond)
    // Decimals: 18
    uint public rewardPerBlock;

    // 0: el, 1: eth, 2: wBTC ...
    uint public payment;

    // Account rewards (USD)
    // Decimals: 18
    mapping(address => uint) private _rewards;

    // Account block numbers
    mapping(address => uint) private _blockNumbers;

    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint newRewardPerBlock);

    /// @notice Emitted when eController is changed
    event NewController(address newController);

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
    ) ERC20 (name_,symbol_) {
        eController = eController_;
        price = price_;
        rewardPerBlock = rewardPerBlock_;
        payment = payment_;
        latitude = latitude_;
        longitude = longitude_;
        assetPrice = assetPrice_;
        interestRate = interestRate_;
        _mint(address(this), amount_);
        _setupDecimals(decimals_);
    }

    /*** View functions ***/

    function getPayment() external view override returns (uint) {
        return payment;
    }

    /*** Admin functions ***/

    function setEController(address newEController) external override onlyAdmin(msg.sender) {
        eController = IEController(newEController);

        emit NewController(address(eController));
    }

    function setRewardPerBlock(uint rewardPerBlock_)
        external
        override
        onlyAdmin(msg.sender)
        returns (bool)
    {
        rewardPerBlock = rewardPerBlock_;

        emit NewRewardPerBlock(rewardPerBlock_);

        return true;
    }

    function pause() external override onlyAdmin(msg.sender) {
        _pause();
    }

    function unpause() external override onlyAdmin(msg.sender) {
        _unpause();
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
            rewardPerBlock: rewardPerBlock,
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
    //                 rewardPerBlock) /
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

    /// @dev Restricted to members of the whitelisted user.
    modifier onlyWhitelisted(address account) {
        require(eController.isWhitelisted(account), "Restricted to whitelisted.");
        _;
    }

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin(address account) {
        require(eController.isAdmin(account), "Restricted to admin.");
        _;
    }
}
