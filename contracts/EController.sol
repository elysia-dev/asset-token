// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IEPriceOracle.sol";
import "./EPriceOracleEth.sol";
import "./IAssetToken.sol";

interface IEController {
    function mulPrice(uint amount, uint price) external view returns (uint);
    function getPrice() external view returns (uint);
    function addAddressToWhitelist(address account) external;
    function addAddressesToWhitelist(address[] memory accounts) external;
    function removeAddressFromWhitelist(address account) external;
    function removeAddressesFromWhitelist(address[] memory accounts) external;
    function changeWhitelistedAccount(address account) external;
    function isWhitelisted(address account) external view returns (bool);
    function isAdmin(address account) external view returns (bool);
}

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EController is IEController, AccessControl {

    bytes32 public constant WHITELISTED = keccak256("WHITELISTED");

    // 0: el, 1: eth, 2: wBTC ...
    mapping(address => uint) assetPayment;

    // AssetToken list
    IAssetToken[] public assetTokenList;

    // 0: el, 1: eth, 2: wBTC ...
    mapping(uint => IEPriceOracle) public ePriceOracle;

    /// @notice Emitted when new priceOracle is set
    event NewPriceOracle(address ePriceOracle);

    /// @notice Emitted when new assetToken is set
    event NewAssetToken(address assetToken);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(WHITELISTED, DEFAULT_ADMIN_ROLE);
        }

    /*** Oracle View functions ***/

    function mulPrice(uint amount, uint price) external view override returns (uint) {
        IEPriceOracle oracle = ePriceOracle[assetPayment[msg.sender]];
        return oracle.mulPrice(amount, price);
    }

    function getPrice() external view override returns (uint) {
        IEPriceOracle oracle = ePriceOracle[assetPayment[msg.sender]];
        return oracle.getPrice();
    }

    /*** Admin Functions on Setup ***/

    function setEPriceOracle(IEPriceOracle ePriceOracle_, uint payment) external onlyAdmin {
        ePriceOracle[payment] = ePriceOracle_;
        emit NewPriceOracle(address(ePriceOracle_));
    }

    function setAssetTokens(IAssetToken[] memory assetTokens) external onlyAdmin {

        uint len = assetTokens.length;

        for (uint i = 0; i < len; i++) {
            assetTokenList.push(assetTokens[i]);
            assetPayment[address(assetTokens[i])] = assetTokens[i].getPayment();
            emit NewAssetToken(address(assetTokens[i]));
        }
    }

    function pauseAssetTokens(IAssetToken[] memory assetTokens) public onlyAdmin {

        uint len = assetTokens.length;

        for (uint i = 0; i < len; i++) {
            assetTokens[i].pause();
        }
    }

    function unpauseAssetTokens(IAssetToken[] memory assetTokens) public onlyAdmin {

        uint len = assetTokens.length;

        for (uint i = 0; i < len; i++) {
            assetTokens[i].unpause();
        }
    }

    /*** Admin Functions on Whitelist ***/

    /**
     * @notice Add an 'account' to the whitelist
     * @param account The address of account to add
     */
    function addAddressToWhitelist(address account) external override onlyAdmin {
        grantRole(WHITELISTED, account);
    }

    function addAddressesToWhitelist(address[] memory accounts)
        external
        override
        onlyAdmin
    {
        uint256 len = accounts.length;

        for (uint256 i = 0; i < len; i++) {
            grantRole(WHITELISTED, accounts[i]);
        }
    }

    /**
     * @notice remove an 'account' from the whitelist
     * @param account The address of account to remove
     */
    function removeAddressFromWhitelist(address account)
        external
        override
        onlyAdmin
    {
        revokeRole(WHITELISTED, account);
    }

    function removeAddressesFromWhitelist(address[] memory accounts)
        external
        override
        onlyAdmin
    {
        uint256 len = accounts.length;

        for (uint256 i = 0; i < len; i++) {
            revokeRole(WHITELISTED, accounts[i]);
        }
    }

    function changeWhitelistedAccount(address account)
        external
        override
        onlyWhitelisted()
        {
        grantRole(WHITELISTED, account);
        revokeRole(WHITELISTED, msg.sender);
    }

    /*** Access Controllers ***/

    /// @dev Restricted to members of the whitelisted user.
    modifier onlyWhitelisted() {
        require(_isWhitelisted(msg.sender), "Restricted to whitelisted.");
        _;
    }

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin() {
        require(_isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    /// @dev Return `true` if the account belongs to whitelist.
    function isWhitelisted(address account) external override view returns (bool) {
        return _isWhitelisted(account);
    }

    /// @dev Return `true` if the account belongs to the admin role.
    function isAdmin(address account) external override view returns (bool) {
        return _isAdmin(account);
    }

    function _isWhitelisted(address account) internal view returns (bool) {
        return hasRole(WHITELISTED, account);
    }

    function _isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }
}
