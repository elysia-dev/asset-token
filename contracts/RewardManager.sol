// SPDX-Lisence-Identifier: MIT
pragma solidity 0.7.0;

import "./EAccessControl.sol";
import "./EErc20.sol";

/**
 * @title RewardManager
 * @notice Manage rewards by _refToken and block numbers
 * @author Elysia
 */
contract RewardManager is EAccessControl {
    /// @notice Emitted when rewards per block is changed
    event NewRewardPerBlock(uint256 newRewardPerBlock);

    EErc20 public _refToken; // reftoken should be initialized by EAssetToken

    // monthlyRent$/(secondsPerMonth*averageBlockPerSecond)
    // Decimals: 18
    uint256 public _rewardPerBlock;

    // Account rewards (USD)
    // Decimals: 18
    mapping(address => uint256) private _rewards;

    // Account block numbers
    mapping(address => uint256) private _blockNumbers;

    function getRewardPerBlock() public view returns (uint256) {
        return _rewardPerBlock;
    }

    function setRewardPerBlock(uint256 rewardPerBlock_)
        external
        onlyAdmin
        returns (bool)
    {
        _rewardPerBlock = rewardPerBlock_;

        emit NewRewardPerBlock(rewardPerBlock_);

        return true;
    }

    /*** Reward functions ***/

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function getReward(address account) public view returns (uint256) {
        uint256 newReward = 0;

        if (
            _blockNumbers[account] != 0 && block.number > _blockNumbers[account]
        ) {
            newReward =
                (_refToken.balanceOf(account) *
                    (block.number - _blockNumbers[account]) *
                    _rewardPerBlock) /
                _refToken.totalSupply();
        }

        return newReward + _rewards[account];
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
}
