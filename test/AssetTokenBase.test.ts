import { expect } from "chai";
import { waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBaseTest } from "../typechain/AssetTokenBaseTest"
import { expandToDecimals } from "./Utils/AssetToken";
import { deployContract } from "ethereum-waffle";
import AssetTokenBaseTestArtifact from "../artifacts/contracts/test/AssetTokenBaseTest.sol/AssetTokenBaseTest.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"

describe("AssetTokenBase", () => {
    let assetTokenBaseTest: AssetTokenBaseTest;
    let eController: EController;

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

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    context("AssetToken.new", async () => {

        beforeEach(async () => {
            eController = await deployContract(
                admin,
                EControllerArtifact
            ) as EController
        })

        it('has given data', async () => {

            const assetTokenBaseTest = await deployContract(
                admin,
                AssetTokenBaseTestArtifact,
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
                ]
            ) as AssetTokenBaseTest;

            expect(await assetTokenBaseTest.totalSupply()).to.equal(amount_)
            expect(await assetTokenBaseTest.price()).to.equal(price_)
            expect(await assetTokenBaseTest.rewardPerBlock()).to.equal(rewardPerBlock_)
            expect(await assetTokenBaseTest.getPayment()).to.equal(payment_)
            expect(await assetTokenBaseTest.latitude()).to.equal(latitude_)
            expect(await assetTokenBaseTest.longitude()).to.equal(longitude_)
            expect(await assetTokenBaseTest.assetPrice()).to.equal(assetPrice_)
            expect(await assetTokenBaseTest.name()).to.equal(name_)
            expect(await assetTokenBaseTest.symbol()).to.equal(symbol_)
            expect(await assetTokenBaseTest.decimals()).to.equal(decimals_)
        })
    })

    context('AssetToken is deployed', async () => {

        beforeEach(async () => {
            const assetTokenBaseTest = await deployContract(
                admin,
                AssetTokenBaseTestArtifact,
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
                ]
            ) as AssetTokenBaseTest;
        })

        it('Admin can set EController', async () => {

        })

        it('Admin can set RewardPerBlock', async () => {

        })
    })

    context('Asset Token Pausable', async () => {

        beforeEach(async () => {
            assetTokenBaseTest = await deployContract(
                admin,
                AssetTokenBaseTestArtifact,
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
                ]
            ) as AssetTokenBaseTest;
        })

        it('Admin can pause asset token', async () => {
            await expect(assetTokenBaseTest.connect(admin).pause())
                .to.emit(assetTokenBaseTest, 'Paused')
                .withArgs(admin.address)
        })

    })

    context('Asset Token Reward', async () => {

        const account1RewardPerBlock = rewardPerBlock_.mul(10).div(amount_)

        beforeEach(async () => {
            assetTokenBaseTest = await deployContract(
                admin,
                AssetTokenBaseTestArtifact,
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
                ]
            ) as AssetTokenBaseTest;
        })

        it('should accrue reward properly', async () => {
            const beforeTx = await assetTokenBaseTest.connect(admin).transfer(
                account1.address,
                10)
            const beforeReward = await assetTokenBaseTest.getReward(account1.address)
            const afterTx = await assetTokenBaseTest.connect(admin).transfer(
                account1.address,
                10)
            const afterReward = await assetTokenBaseTest.getReward(account1.address)
            expect(afterReward.sub(beforeReward)).to.be.equal(
                account1RewardPerBlock
                    .mul(
                        ((await afterTx.wait()).blockNumber - (await beforeTx.wait()).blockNumber)
                    )
            )
        })

        it('if account do not have tokens, return zero', async () => {
            expect(await assetTokenBaseTest.getReward(account2.address)).to.be.equal(0)
            await assetTokenBaseTest.connect(admin).transfer(account1.address, 10)
            expect(await assetTokenBaseTest.getReward(account2.address)).to.be.equal(0)
        })

        it('if account has token, reward is saved', async () => {
            await assetTokenBaseTest.connect(admin).transfer(
                account1.address,
                10)
            const tx1 = await assetTokenBaseTest.saveReward(account1.address);
            const tx2 = await assetTokenBaseTest.saveReward(account1.address);

            expect(await assetTokenBaseTest.getReward(account1.address)).to.be.equal(
                account1RewardPerBlock
                    .mul(
                        ((await tx2.wait()).blockNumber - (await tx1.wait()).blockNumber + 1)
                    )
            )
            // getReward tx adds 1 to the blockNumber
        })

        it('if user has no token, save zero value', async () => {
            await assetTokenBaseTest.saveReward(account2.address);
            await assetTokenBaseTest.saveReward(account2.address);
            expect(await assetTokenBaseTest.getReward(account2.address)).to.be.equal(0);
        })

        it('clear reward', async () => {
            await assetTokenBaseTest.saveReward(account1.address);
            await assetTokenBaseTest.saveReward(account1.address);
            await assetTokenBaseTest.clearReward(account1.address);

            expect(await assetTokenBaseTest.getReward(account1.address))
                .to.be.equal(0)
        })
    })
})