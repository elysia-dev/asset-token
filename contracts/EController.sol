// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IAssetToken.sol";

interface IEController {
    function isAdmin(address account) external view returns (bool);
    function isAssetToken(address account) external view returns (bool);
    function withdrawReserveFromAssetTokenEth(uint256 reserveDeficit) external payable returns (bool);
}

/**
 * @title Elysia's Asset Control layer
 * @notice Controll admin
 * @author Elysia
 */
contract EController is IEController, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ASSETTOKEN = keccak256("ASSETTOKEN");

    // AssetToken list
    IAssetTokenBase[] public assetTokenList;

    /// @notice Emitted when new assetToken is set
    event NewAssetToken(address assetToken);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, address(this));
    }

    /**
     * @notice Add assets to be included in eController
     * @param assetTokens The list of addresses of the assetTokens to be enabled
     */
    function setAssetTokens(IAssetTokenBase[] memory assetTokens)
        external
        onlyAdmin
    {
        uint256 len = assetTokens.length;

        for (uint256 i = 0; i < len; i++) {
            assetTokenList.push(assetTokens[i]);
            grantRole(ASSETTOKEN, address(assetTokens[i]));
            emit NewAssetToken(address(assetTokens[i]));
        }
    }

    function setAdmin(address account)
        external
        onlyAdmin
    {
        _setupRole(DEFAULT_ADMIN_ROLE, account);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function pauseAssetTokens(IAssetTokenBase[] memory assetTokens)
        public
        onlyAdmin
    {
        uint256 len = assetTokens.length;

        for (uint256 i = 0; i < len; i++) {
            assetTokens[i].pause();
        }
    }

    function withdrawReserveFromAssetTokenEth(uint256 reserveDeficit)
        external
        payable
        override
        onlyAssetToken
        returns (bool)
    {
        Address.sendValue(payable(msg.sender), reserveDeficit);
        return true;
    }

    function withdrawReserveFromAssetTokenERC20(uint256 reserveDeficit)
        external
        onlyAssetToken
    {
        IERC20(IAssetTokenBase(msg.sender).getPayment()).safeTransfer(msg.sender, reserveDeficit);
    }

    function unpauseAssetTokens(IAssetTokenBase[] memory assetTokens)
        public
        onlyAdmin
    {
        uint256 len = assetTokens.length;

        for (uint256 i = 0; i < len; i++) {
            assetTokens[i].unpause();
        }
    }

    /*** Access Controllers ***/

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin() {
        require(_isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    /// @dev Restricted to members of the assetToken.
    modifier onlyAssetToken() {
        require(_isAssetToken(msg.sender), "Restricted to assetToken.");
        _;
    }

    /// @dev Return `true` if the account is the assetToken
    function isAssetToken(address account)
        external
        view
        override
        returns (bool) {
        return _isAssetToken(account);
    }

    /// @dev Return `true` if the account belongs to the admin role.
    function isAdmin(address account)
        external
        view
        override
        returns (bool) {
        return _isAdmin(account);
    }

    function _isAssetToken(address account) internal view returns (bool) {
        return hasRole(ASSETTOKEN, account);
    }

    function _isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    /**
     * @dev allow asset token to receive eth from other accounts.
     * Controller save the reserves from the asset tokens.
     */
    receive() external payable {
    }
}
