// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./IAssetToken.sol";
import "./EController.sol";
import "./Library.sol";

contract AssetTokenBase is IAssetTokenBase, ERC20, Pausable {
    using AssetTokenLibrary for AssetTokenLibrary.RewardLocalVars;
    using AssetTokenLibrary for AssetTokenLibrary.ReserveLocalVars;

    IEController public eController;

    uint256 public latitude;
    uint256 public longitude;
    uint256 public assetPrice;
    uint256 public interestRate;
    uint256 public cashReserveRatio;

    // price per Elysia Asset Token
    // decimals: 18
    uint256 public price;

    // AnnualInterestRate/(secondsPerYear*averageBlockPerSecond)
    // Decimals: 18
    uint256 public rewardPerBlock;

    // 0: el, 1: eth, 2: wBTC ...
    uint256 public payment;

    // Account rewards
    // Decimals: 18
    mapping(address => uint256) private _rewards;

    // Account block numbers
    mapping(address => uint256) private _blockNumbers;

    /// @notice Emitted when reserve deposited
    event ReserveDeposited(uint256 reserveSurplus);

    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint256 newRewardPerBlock);

    /// @notice Emitted when eController is changed
    event NewController(address newController);

    /// @notice Emitted when cashReserveRatio is set
    event NewCashReserveRatio(uint256 newCashReserveRatio);

    constructor(
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
    ) ERC20(name_, symbol_) {
        eController = eController_;
        price = price_;
        payment = payment_;
        interestRate = interestRate_;
        _setCoordinate(coordinate_[0], coordinate_[1]);
        _setRewardPerBlock(rewardPerBlock_);
        _setCashReserveRatio(cashReserveRatio_);
        _mint(address(this), amount_);
    }

    /*** View functions ***/

    function getLatitude() external view override returns (uint256) {
        return latitude;
    }

    function getLongitude() external view override returns (uint256) {
        return longitude;
    }

    function getAssetPrice() external view override returns (uint256) {
        return assetPrice;
    }

    function getInterestRate() external view override returns (uint256) {
        return interestRate;
    }

    function getPrice() external view override returns (uint256) {
        return price;
    }

    function getPayment() external view override returns (uint256) {
        return payment;
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

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function getReward(address account) public view returns (uint256) {
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

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

    /**
     * @notice check reserves of asset token
     * @return return true if the reserves for payment is sufficient
     */
    function _checkReserveSurplus()
        internal
        view
        returns (bool)
    {
        return (_getReserveSurplus()>0);
    }

    /**
     * @notice get reserves of asset token
     * @return return true if the reserves for payment is sufficient
     */
    function _getReserveSurplus()
        internal
        view
        returns (uint256)
    {
        AssetTokenLibrary.ReserveLocalVars memory vars =
            AssetTokenLibrary.ReserveLocalVars({
                price: price,
                totalSupply: totalSupply(),
                interestRate: interestRate,
                cashReserveRatio: cashReserveRatio,
                balanceOfAssetToken: balanceOf(address(this))
            });
        return (vars.getReserveSurplus(address(this).balance));
    }

    /**
     * @notice deposit reserve into the controller
     * @return return true if the reserves for payment is insufficient
     */
    function _depositReserve(uint256 reserveSurplus) internal returns (bool) {
        emit ReserveDeposited(reserveSurplus);

        return payable(address(eController)).send(reserveSurplus);
    }

    /**
     * @notice withdraw reserve from the controller
     * @return return true if the reserves for payment is insufficient
     */
    function withdrawReserve() internal returns (bool) {

    }

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin(address account) {
        require(eController.isAdmin(account), "Restricted to admin.");
        _;
    }
}
