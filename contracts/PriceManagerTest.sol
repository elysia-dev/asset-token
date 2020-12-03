// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./PriceManager.sol";
import "./EErc20.sol";

contract PriceManagerTest is EErc20, PriceManager {
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

        _mint(address(this), amount_);

        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setRoleAdmin(WHITELISTED, DEFAULT_ADMIN_ROLE);
    }
}
