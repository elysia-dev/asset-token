import { assert, expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenEL } from "../typechain/AssetTokenEL"
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { TestnetEL } from "../typechain/TestnetEL"
import { expandToDecimals, makeAssetTokenBase } from "./Utils/AssetToken";
import { deployContract, MockProvider } from "ethereum-waffle";
import AssetTokenEthArtifact from "../artifacts/contracts/AssetTokenEth.sol/AssetTokenEth.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import TestnetELArtifact from "../artifacts/contracts/test/TestnetEL.sol/TestnetEL.json"
import EPriceOracleTestArtifact from "../artifacts/contracts/test/EPriceOracleTest.sol/EPriceOracleTest.json"

describe("AssetTokenEth", () => {
    let assetTokenEth: AssetTokenEL;
    let eController: EController;
    let ePriceOracleEth: EPriceOracleTest

    const amount_ = 10000
    const price_ = expandToDecimals(5, 18)
    const rewardPerBlock_ = expandToDecimals(5, 14)
    const payment_ = 1
    const latitude_ = 123
    const longitude_ = 456
    const assetPrice_ = expandToDecimals(5, 21)
    const interestRate_ = expandToDecimals(1, 17)
    const name_ = "ExampleAsset"
    const symbol_ = "EA"
    const decimals_ = 0

    const elTotalSupply = expandToDecimals(7, 28)

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    const options = {
        gasLimit: 999999,
        value: ethers.utils.parseEther("0.1")
    }

    beforeEach(async () => {
        ePriceOracleEth = await deployContract(
            admin,
            EPriceOracleTestArtifact
        ) as EPriceOracleTest;

        eController = await deployContract(
            admin,
            EControllerArtifact
        ) as EController

        assetTokenEth = await deployContract(
            admin,
            AssetTokenEthArtifact,
            [
                eController.address,
                amount_,
                price_,
                rewardPerBlock_,
                payment_,
                latitude_,
                longitude_,
                assetPrice_,
                interestRate_,
                name_,
                symbol_,
                decimals_,
            ],
        ) as AssetTokenEL;

        await eController.connect(admin)
            .setEPriceOracle(ePriceOracleEth.address, 1)
        await eController.connect(admin)
            .setAssetTokens([assetTokenEth.address])
        await ePriceOracleEth.connect(admin)
            .setPrice(expandToDecimals(1000, 18))
    })

    context(".purchase", async () => {
        it('if account has sufficient allowed eth balance, can purchase token', async () => {
            const beforeBalance = await provider.getBalance(assetTokenEth.address)
            await expect(await assetTokenEth.connect(account1).purchase(20, options))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("-0.1"))
            // cannot use changeEtherBalnce in contract.address
            const afterBalance = await provider.getBalance(assetTokenEth.address)
            expect(await assetTokenEth.balanceOf(account1.address))
                .to.be.equal(20);
            expect(await assetTokenEth.balanceOf(assetTokenEth.address))
                .to.be.equal(amount_ - 20);
            expect(afterBalance.sub(beforeBalance)).to.be.equal(
                await eController.connect(assetTokenEth.address)
                    .mulPrice(price_.mul(20))
            );
        })

        it('if msg.value does not have sufficient eth balance, transfer is failed', async () => {
            try {
                await assetTokenEth.connect(account1).purchase(10);
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Not enough msg.value');
            }
        })
    })

    context(".refund", async () => {
        it('if account and contract has sufficient balance, refund token', async () => {
            await assetTokenEth.connect(account1).purchase(20, options)

            await expect(await assetTokenEth.connect(account1).refund(10))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("0.05"))
            expect(await assetTokenEth.balanceOf(account1.address)).to.be.equal(10);
            expect(
                await assetTokenEth.balanceOf(assetTokenEth.address)
            ).to.be.equal(amount_ - 10);

            // cannot use changeEtherBalnce in contract.address
            // INFO
            // Below test code is tricky.
            // All variables in contract is integer, last number can be missing.
            // This contract usually get 1 * 10^-18 el more than expected.
            // So BN's eq operation is always failed.
            // This test code use lte or gte operation for test with very small value.
            //expect(
            //    (await el.balanceOf(assetTokenEth.address))
            //        .sub(expandToDecimals(10000, 18))
            //        .add(await eController.connect(assetTokenEth.address).mulPrice(price_.mul(10)))
            //).to.be.gte(1);
            //expect(
            //    (await el.balanceOf(account1.address)).sub(expandToDecimals(10000, 18))
            //        .sub(await eController.connect(assetTokenEth.address).mulPrice(price_.mul(10)))
            //).to.be.lte(1);
        })

        it('if account does not have sufficient allowed balance, transfer is failed', async () => {
            await admin.sendTransaction({ to: assetTokenEth.address, value: ethers.utils.parseEther("50") })
            try {
                await assetTokenEth.connect(account1).refund(10);
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'AssetToken: Insufficient seller balance.');
            }
        })
    })

    context('.claimReward', async () => {

        let firstBlock: number;
        let secondBlock: number;
        let thirdBlock: number;

        beforeEach(async () => {
            firstBlock = (await (await assetTokenEth.connect(account1).purchase(20, options)).wait()).blockNumber;
            await eController.connect(admin).addAddressToWhitelist(account1.address);
            secondBlock = (await (await assetTokenEth.connect(account1).transfer(account2.address, 10)).wait()).blockNumber;
            thirdBlock = (await (await assetTokenEth.connect(account1).transfer(account2.address, 10)).wait()).blockNumber;
        })

        it('whitelisted account can claim reward.', async () => {
            const expectedReward = rewardPerBlock_
                .mul(
                    expandToDecimals((
                        (20 * (secondBlock - firstBlock)) +
                        (10 * (thirdBlock - secondBlock))
                    ), 18))
                .div(amount_)
                .div(expandToDecimals(1000, 18))

            await expect(await assetTokenEth.connect(account1).claimReward())
                .to.changeEtherBalance(account1, expectedReward)
            console.log("expected Reward:", expectedReward.toString())
        })

        it('Not whitelisted account cannot claim reward.', async () => {
            expect(await assetTokenEth.getReward(account2.address)).not.to.be.equal(0);
            try {
                await assetTokenEth.connect(account2).claimReward()
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Restricted');
            }
        })
    })

    context('.withdrawEthToAdmin', async () => {
        beforeEach(async () => {
            await admin.sendTransaction({ to: assetTokenEth.address, value: ethers.utils.parseEther("50") })
        })

        it('admin can withdrwal all ether.', async () => {
            await expect(await assetTokenEth.connect(admin).withdrawToAdmin())
                .to.changeEtherBalance(account1, await provider.getBalance(assetTokenEth.address))
            expect(await provider.getBalance(assetTokenEth.address)).to.be.equal(0);
        })

        it('account cannot withdraw ether.', async () => {
            try {
                await assetTokenEth.connect(account1).withdrawToAdmin()
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Restricted');
            }
        })
    })
})