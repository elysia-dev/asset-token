# Asset Token

Elysia Asset token is an ERC-20 compatible token. It implements compensation management for asset rent and pricing system.
This contract is phase 0 standalone version. In the future, management system will be sepracted from the contract.

## Contracts

### ELToken, EErc20

ELToken and EErc20 is an ERC-20 compliant token. ELToken is used for mocking elysia token. EErc20 have public attributes for convenience of inheritance. EErc20 is a clone of open-zeppelin's ERC20.

### EAccessControl

EAccessControl is OpenZepplin access controle, and used for seperate two roles, admin and whitelisted.
Admin can set elPrice, price and rewards per block for compensation management for asset and manage whitelist. Whitelisted account can claim their rewards.

### PriceManager, PriceManagerTest

Asset Token needs USD per ELToken rate for calcurating token price and rewards. In this implementation, adimn can set the rate. After building [ChainLink](https://chain.link/) node environments, price management will be deprecated. PriceManagerTest is a contract that make testing easier.

### RewardManager, RewardManagerTest

Asset Token distrubutes monthly rent to asset token owners. Reward manager have storage for token owner rewards and internal methods for managing rewards. RewardManagerTest is also a contract that make testing easier.

### AssetToken

Asset token inherits EErc20, PriceManager and RewardManager. This contract implements `purchase`, `refund` and `claimReward` and override `_transfer` of ERC20 for managing rewards.

## Enviroment Variables

| Variable       | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| INFURA_API_KEY | Infura key, only required when using a network different than local network.      |
| MNEMONIC       | Mnemonic phrase, only required when using a network different than local network. |

## Installation

```
git clone https://github.com/elysia-land/asset-token
cd asset-token
yarn install --lock-file # or `npm install`
```

## Testing

```
truffle test
```

or

```
truffle test ./test/file.js
```

# Discussion

For any concerns with the contract, open an issue or email support@elysia.land

© Copyright 2020, Elysia
