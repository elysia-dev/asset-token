// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./RewardManager.sol";
import "./EErc20.sol";

contract RewardManagerTest is EErc20, RewardManager {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint amount_,
        address admin_
    ){
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        _mint(address(this), amount_/2);
        _mint(admin_, amount_/2); // Only for test

        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setRoleAdmin(WHITELISTED, DEFAULT_ADMIN_ROLE);
        _refToken = this;
    }

    function saveRewardTest(address account) public returns (bool) {
        return _saveReward(account);
    }

    function clearRewardTest(address account) public returns (bool) {
        return _clearReward(account);
    }
}
