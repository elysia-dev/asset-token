import { assert, expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenEL } from "../typechain/AssetTokenEL"
import { AssetTokenBaseTest } from "../typechain/AssetTokenBaseTest"
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { TestnetEL } from "../typechain/TestnetEL"
import { expandToDecimals, makeAssetTokenBase } from "./Utils/AssetToken";
import { deployContract } from "ethereum-waffle";
import AssetTokenELArtifact from "../artifacts/contracts/AssetTokenEl.sol/AssetTokenEL.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import TestnetELArtifact from "../artifacts/contracts/test/TestnetEL.sol/TestnetEL.json"
import EPriceOracleTestArtifact from "../artifacts/contracts/test/EPriceOracleTest.sol/EPriceOracleTest.json"
import { ECHILD } from "constants";

describe("AssetTokenEl", () => {
    let assetTokenEL: AssetTokenEL;
    let eController: EController;
    let el: TestnetEL;
    let ePriceOracleEL: EPriceOracleTest

    const amount_ = 10000
    const price_ = expandToDecimals(5, 18)
    const rewardPerBlock_ = expandToDecimals(5, 14)
    const payment_ = 0
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

    beforeEach(async () => {
        el = await deployContract(
            admin,
            TestnetELArtifact,
            [
                elTotalSupply,
                "kovanEL",
                "KEL",
                18
            ]
        ) as TestnetEL;

        ePriceOracleEL = await deployContract(
            admin,
            EPriceOracleTestArtifact
        ) as EPriceOracleTest;

        eController = await deployContract(
            admin,
            EControllerArtifact
        ) as EController

        assetTokenEL = await deployContract(
            admin,
            AssetTokenELArtifact,
            [
                el.address,
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
            ]
        ) as AssetTokenEL;

        await eController.connect(admin)
            .setEPriceOracle(ePriceOracleEL.address, 0)
        await eController.connect(admin)
            .setAssetTokens([assetTokenEL.address])
        await ePriceOracleEL.connect(admin)
            .setPrice(expandToDecimals(4, 16))
    })

    context(".purchase", async () => {
        it('if account has sufficient allowed el balance, can purchase token', async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18))
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )

            await assetTokenEL.connect(account1).purchase(20)

            expect(await assetTokenEL.balanceOf(account1.address))
                .to.be.equal(20);

            expect(await assetTokenEL.balanceOf(assetTokenEL.address))
                .to.be.equal(amount_ - 20);

            expect(await el.balanceOf(assetTokenEL.address)).to.be.equal(
                await eController.connect(assetTokenEL.address)
                    .mulPrice(price_.mul(20))
            );
        })

        it('if account does not have sufficient allowed el balance, transfer is failed', async () => {
            try {
                await assetTokenEL.connect(account1).purchase(10);
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Insufficient');
            }
        })
    })

    context(".refund", async () => {
        it('if account and contract has sufficient balance, refund token', async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18))
            await el.connect(admin).transfer(assetTokenEL.address, expandToDecimals(10000, 18))
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )

            await assetTokenEL.connect(account1).purchase(20)

            await assetTokenEL.connect(account1).refund(10)

            expect(await assetTokenEL.balanceOf(account1.address)).to.be.equal(10);

            expect(
                await assetTokenEL.balanceOf(assetTokenEL.address)
            ).to.be.equal(amount_ - 10);

            // INFO
            // Below test code is tricky.
            // All variables in contract is integer, last number can be missing.
            // This contract usually get 1 * 10^-18 el more than expected.
            // So BN's eq operation is always failed.
            // This test code use lte or gte operation for test with very small value.
            expect(
                (await el.balanceOf(assetTokenEL.address))
                    .sub(expandToDecimals(10000, 18))
                    .add(await eController.connect(assetTokenEL.address).mulPrice(price_.mul(10)))
            ).to.be.gte(1);

            expect(
                (await el.balanceOf(account1.address)).sub(expandToDecimals(10000, 18))
                    .sub(await eController.connect(assetTokenEL.address).mulPrice(price_.mul(10)))
            ).to.be.lte(1);
        })

        it('if account does not have sufficient allowed balance, transfer is failed', async () => {
            try {
                await assetTokenEL.connect(account1).refund(10);
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Insufficient');
            }
        })

        it('if account does not have sufficient balance, transfer is failed', async () => {
            await assetTokenEL.connect(account1).approve(assetTokenEL.address, amount_)

            try {
                await assetTokenEL.connect(account1).refund(10);
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Insufficient');
            }
        })
    })

    context('.claimReward', async () => {
        let firstBlock: number;
        let secondBlock: number;
        let thirdBlock: number;

        beforeEach(async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18));
            await el.connect(admin).transfer(assetTokenEL.address, expandToDecimals(10000, 18));
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            );

            firstBlock = (await (await assetTokenEL.connect(account1).purchase(20)).wait()).blockNumber;

            await eController.connect(admin).addAddressToWhitelist(account1.address);

            await el.connect(account1).transfer(account2.address, await el.balanceOf(account1.address));

            secondBlock = (await (await assetTokenEL.connect(account1).transfer(account2.address, 10)).wait()).blockNumber;
            thirdBlock = (await (await assetTokenEL.connect(account1).transfer(account2.address, 10)).wait()).blockNumber;
        })

        it('whitelisted account can claim reward.', async () => {
            await assetTokenEL.connect(account1).claimReward()

            const expectedReward = rewardPerBlock_
                .mul(
                    expandToDecimals((
                        (20 * (secondBlock - firstBlock)) +
                        (10 * (thirdBlock - secondBlock))
                        ), 18))
                .div(amount_)
                .div(expandToDecimals(4, 16))

            expect(await el.balanceOf(account1.address)).to.be.equal(expectedReward);
        })

        it('Not whitelisted account cannot claim reward.', async () => {
            expect(await assetTokenEL.getReward(account2.address)).not.to.be.equal(0);

            try {
                await assetTokenEL.connect(account2).claimReward()
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Restricted');
            }
        })
    })

    context('.withdrawElToAdmin', async () => {
        beforeEach(async () => {
            await el.connect(admin).transfer(assetTokenEL.address, expandToDecimals(10000, 18));
        })

        it('admin can withdrwal all el.', async () => {
            await assetTokenEL.connect(admin).withdrawToAdmin();

            expect(await el.balanceOf(assetTokenEL.address)).to.be.equal(0);
            expect(await el.balanceOf(admin.address)).to.be.equal(elTotalSupply);
        })

        it('account cannot withdraw el.', async () => {
            try {
                await assetTokenEL.connect(account1).withdrawToAdmin()
                assert.fail("The method should have thrown an error");
            }
            catch (error) {
                assert.include(error.message, 'Restricted');
            }
        })
    })
})