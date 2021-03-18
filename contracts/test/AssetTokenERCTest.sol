// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "../AssetTokenERC.sol";

contract AssetTokenERCTest is AssetTokenERC {
    constructor(
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
    )
    {
        initialize(
            eController_,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            coordinate_,
            interestRate_,
            cashReserveRatio_,
            name_,
            symbol_
        );
    }
}