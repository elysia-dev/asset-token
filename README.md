# AssetToken

Asset Token is a bundle of contracts for tokenizing real estate.

- Can purchase and refund asset token.
- Can claim rewards.
- Can use other ERC20 as a payment method.
- Emergency stop.

## Contracts

### **Asset Token**

Asset token contracts are the primary means of interacting with Elysia. With this contract, users can purchase, make refund, claim rewards and transfer asset tokens.

As the asset tokens are ERC-20, asset tokens provide basic functionality like `transfer`, `transferFrom`, `approve`, `allowance`, `balanceOf`, `totalSupply`. Below are custom methods that we implement for the serving exchange and compensation system

**Reward**

Every user accrues monthly rent every block upon purchasing and transferring of the asset tokens to theier Ethereum wallet. This is called before any transfert of asset token takes place. Successful execution of calling `transfer`, `transferFrom`, `purchase`, `refund` functions triggers the `_saveReward` method, which causes monthly reward to be recorded in mapping `_rewards`. This can be done by a hook `_beforeTokenTransfer` that is called before any transfer of asset token.

The asset token contract’s `_rewardPerBlock` is an unsigned integer that indicates the rate at which the contract distributes monthly rent to asset token owners, every Ethereum block. The contract automatically transfers accrued monthly rent to a user’s address when the address executes `claimReward` functions. Users may call the `claimReward` method on the contract at any time for finer-grained control over their monthly rent. The contract compute reward using the library.


**Purchase and Refund**

When users specify their payment, Asset Token contract require users to first make approval to perform purchase or refund functionality.

**Pause**

In case asset token contract vulnerability is detected, calling `pause` can stop purchases, refunds, and rewards.

**Maturity**

The concept of maturity is added. Since the asset tokens are minted based on the bond of real asset, the maturity of the token should affect the functionality of the token. THe general maturity of the asset token is one year.

Reward calculations are stopped after the maturity of the token. The asset token contract's `blockRemaining`, which is unsigned integer newly added, can indicate and be used to determine when to stop calculating reward. Users can check whether the bond is expired by executing an internal function `_tokenMatured` which returns true after the maturity date.

The basic functionalities are still available but users are not able to accrue rewards by owning tokens after the maturity of the asset token.

Below is an example scenario.

*Reward per block per token : 5*

Block.number | Transaction | User AssetToken Balance | Reward
:-----------:|:-----------:|:-----------------------:|:-----:
0 | Token deployed | 0 | **0**
1 | `purchase(10)` | 10 | **0**
6 | `purchase(10)` | 20 | **50**
11 | <span style="color:red">Token matured</span> | 20 | **150**
15 | - | 20 | **150**


### **Oracle**

As the reward in asset token is calculated in dollars, asset token relies on price feeds to operate. Asset token implements [Chainlink](https://chain.link/) price feed as the primary oracle solution throughout its system. Except for EL, all of the crypto data feeds use chainlink price feed.

Price feed allows asset token contract to obtain price feeds and ensure that Elysia users receive fair market exchange rates when interacting with asset token contract.

Although the Elysia server aggregates data from multiple data sources and set EL price, we recognize that a single centralized oracle creates the very problem, a central point of weakness. we will implement chainlink EL/USDT feed as soon as possible.

### **Controller**

The controller is the risk management and the oracle layer of the AssetToken. Each time user interacts with an asset token, such as purchase, refund, and claim reward, the controller is asked to provide off-chain data.

Asset token call `getPrice` which returns the most recent price for a token in USD with 8 decimals of precision in 18 decimals.

When users purchase the asset tokens, all reserve of asset tokens is moved to the controller contract automatically to facilitate the management of funds. The insufficient amount is transferred from the controller to the asset token when users refund.

All the flow of reserve is executed through the openzeppelin library's method which is proven safe way to transfer ether and other ERC20 tokens.

### **Library**

Solidity libraries focus on safety and execution gas efficiency across Elysia asset tokens.

### UML diagram

![asset-token](https://user-images.githubusercontent.com/69144981/106694424-e3fb9d00-661b-11eb-9a86-d8fa55fb88ad.png)

## Enviroment Variables

| Variable          | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| INFURA_API_KEY    | Infura key, only required when using a network different than local network. |
| ADMIN             | Ethereum wallet secret key, only required when deploying contracts           |
| ETHERSCAN_API_KEY | Etherscan api key only required when verifying contracts                     |

## Installation

```
git clone <https://github.com/elysia-land/asset-token>
cd asset-token
yarn install --lock-file # or `npm install`
```

## Testing

```
yarn hardhat test ./test/**.test.ts
```

## Deployment

```jsx
// for test
yarn hardhat run --network {mainnet | kovan} deploy.ts
```

## Discussion

For any concerns with the contract, open an issue or email support@elysia.land

© Copyright 2020, Elysia
