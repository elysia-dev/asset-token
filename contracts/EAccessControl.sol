// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Elysia's Access Control
 * @notice Control admin and whitelisted account
 * @author Elysia
 */
contract EAccessControl is AccessControl {
    bytes32 public constant WHITELISTED = keccak256("WHITELISTED");

    /*** Admin Functions on Whitelist ***/

    /**
     * @notice Add an 'account' to the whitelist
     * @param account The address of account to add
     */
    function addAddressToWhitelist(address account) public virtual onlyAdmin {
        grantRole(WHITELISTED, account);
    }

    function addAddressesToWhitelist(address[] memory accounts)
        public
        virtual
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
        public
        virtual
        onlyAdmin
    {
        revokeRole(WHITELISTED, account);
    }

    function removeAddressesToWhitelist(address[] memory accounts)
        public
        virtual
        onlyAdmin
    {
        uint256 len = accounts.length;

        for (uint256 i = 0; i < len; i++) {
            revokeRole(WHITELISTED, accounts[i]);
        }
    }

    /*** Access Controllers ***/

    /// @dev Restricted to members of the whitelisted user.
    modifier onlyWhitelisted() {
        require(isWhitelisted(msg.sender), "Restricted to whitelisted.");
        _;
    }

    /// @dev Restricted to members of the admin role.
    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    /// @dev Return `true` if the account belongs to whitelist.
    function isWhitelisted(address account) public virtual view returns (bool) {
        return hasRole(WHITELISTED, account);
    }

    /// @dev Return `true` if the account belongs to the admin role.
    function isAdmin(address account) public virtual view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }
}
