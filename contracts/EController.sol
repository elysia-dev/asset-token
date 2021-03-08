// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IAssetToken.sol";

interface IEController {
    function isAdmin(address account) external view returns (bool);
}

/**
 * @title Elysia's Asset Control layer
 * @notice Controll admin
 * @author Elysia
 */
contract EController is IEController, AccessControl {
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

    /// @dev Return `true` if the account belongs to the admin role.
    function isAdmin(address account)
        external
        view
        override
        returns (bool) {
        return _isAdmin(account);
    }

    function _isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }
}
