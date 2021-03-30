// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./IAssetToken.sol";
import "./EController.sol";
import "./Library.sol";

contract AssetTokenBase is IAssetTokenBase, ERC20Upgradeable, PausableUpgradeable {
    using AssetTokenLibrary for AssetTokenLibrary.RewardLocalVars;

    address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    IEController public eController;

    uint256 public latitude;
    uint256 public longitude;
    uint256 public interestRate;
    uint256 public cashReserveRatio;

    // price per Elysia Asset Token
    // decimals: 18
    uint256 public price;

    // AnnualInterestRate/(secondsPerYear*averageBlockPerSecond)
    // Decimals: 18
    uint256 public rewardPerBlock;

    // currency payment address, 0xEeeeeEee... is ether
    address public payment;

    // Account rewards
    // Decimals: 18
    mapping(address => uint256) private _rewards;

    // Account block numbers
    mapping(address => uint256) private _blockNumbers;

    /// @notice Emitted when an user claimed reward
    event RewardClaimed(address account, uint256 reward);

    /// @notice Emitted when reserve deposited
    event ReserveDeposited(uint256 reserveSurplus);

    /// @notice Emitted when reserve deposited
    event ReserveWithdrawed(uint256 reserveDeficit);

    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint256 newRewardPerBlock);

    /// @notice Emitted when eController is changed
    event NewController(address newController);

    /// @notice Emitted when cashReserveRatio is set
    event NewCashReserveRatio(uint256 newCashReserveRatio);

    function __AssetTokenBase_init(
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
    ) public initializer {
        eController = eController_;
        price = price_;
        _setRewardPerBlock(rewardPerBlock_);
        payment = payment_;
        _setCoordinate(coordinate_[0], coordinate_[1]);
        interestRate = interestRate_;
        _setCashReserveRatio(cashReserveRatio_);
        _mint(address(this), amount_);
        __ERC20_init(name_, symbol_);
        __Pausable_init();
    }

    /*** View functions ***/

    function getLatitude() external view override returns (uint256) {
        return latitude;
    }

    function getLongitude() external view override returns (uint256) {
        return longitude;
    }

    function getInterestRate() external view override returns (uint256) {
        return interestRate;
    }

    function getPrice() external view override returns (uint256) {
        return price;
    }

    function getPayment() external view override returns (address) {
        return payment;
    }

    function getReward(address account) external view override returns (uint256) {
        return _getReward(account);
    }

    /*** Admin functions ***/

    function setEController(address newEController)
        external
        override
        onlyAdmin(msg.sender)
    {
        eController = IEController(newEController);

        emit NewController(address(eController));
    }

    function setRewardPerBlock(uint256 newRewardPerBlock)
        external
        override
        onlyAdmin(msg.sender)
    {
        _setRewardPerBlock(newRewardPerBlock);

        emit NewRewardPerBlock(newRewardPerBlock);
    }

    function setCashReserveRatio(uint256 newCashReserveRatio)
        external
        override
        onlyAdmin(msg.sender)
    {
        _setCashReserveRatio(newCashReserveRatio);

        emit NewCashReserveRatio(newCashReserveRatio);
    }

    function _setRewardPerBlock(uint256 newRewardPerBlock) internal {
        rewardPerBlock = newRewardPerBlock;
    }

    function _setCashReserveRatio(uint256 newCashReserveRatio) internal {
        cashReserveRatio = newCashReserveRatio;
    }

    function _setCoordinate(uint newLatitude, uint256 newLongitude) internal {
        latitude = newLatitude;
        longitude = newLongitude;
    }

    function pause() external override onlyAdmin(msg.sender) {
        _pause();
    }

    function unpause() external override onlyAdmin(msg.sender) {
        _unpause();
    }

    /*** Reward functions ***/

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        /* RewardManager */
        _saveReward(from);
        _saveReward(to);
    }

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function _getReward(address account) internal view returns (uint256) {
        AssetTokenLibrary.RewardLocalVars memory vars =
            AssetTokenLibrary.RewardLocalVars({
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

    /**
     * @notice save reward
     * @param account address for save reward
     */
    function _saveReward(address account) internal returns (bool) {
        if (account == address(this)) {
            return true;
        }

        _rewards[account] = _getReward(account);
        _blockNumbers[account] = block.number;

        return true;
    }

    /**
    * @notice clear reward when claim reward
    * @param account address for clear reward
     */
    function _clearReward(address account) internal returns (bool) {
        _rewards[account] = 0;
        _blockNumbers[account] = block.number;

        return true;
    }

    function _getCurrencyPrice() internal view returns (uint256) {
        return eController.getPrice(payment);
    }

    /**
     * @notice deposit reserve in the controller
     */
    function _depositReserve(uint256 reserveSurplus) internal virtual {}

    /**
     * @notice withdraw reserve from the controller
     */
    function _withdrawReserve(uint256 reserveDeficit) internal virtual {}

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin(address account) {
        require(eController.isAdmin(account), "Restricted to admin.");
        _;
    }

    /**
     * @dev allow asset token to receive eth from other accounts.
     * Monthly rent profit (eth) is acummulated in asset token from elysia admin account
     */
    receive() external payable {
    }
}
