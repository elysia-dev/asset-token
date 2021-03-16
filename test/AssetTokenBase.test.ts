import { expect } from "chai";
import { waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBaseTest } from "../typechain/AssetTokenBaseTest"
import expandToDecimals from "./utils/expandToDecimals";
import { deployContract } from "ethereum-waffle";
import AssetTokenBaseTestArtifact from "../artifacts/contracts/test/AssetTokenBaseTest.sol/AssetTokenBaseTest.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"

describe("AssetTokenBase", () => {
    let assetTokenBaseTest: AssetTokenBaseTest;
    let eController: EController;

    const amount_ = expandToDecimals(10000, 18)
    // 0.005 ether per assetToken
    const price_ = expandToDecimals(5, 15)
    // price * interestRate / (secondsPerYear * blockTime)
    const rewardPerBlock_ = expandToDecimals(237, 6)
    const payment_ = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const coordinate_ = [123, 456]
    const interestRate_ = expandToDecimals(1, 17)
    const cashReserveRatio_ = expandToDecimals(5, 17)
    const name_ = "ExampleAsset"
    const symbol_ = "EA"

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        eController = await deployContract(
            admin,
            EControllerArtifact
        ) as EController
        assetTokenBaseTest = await deployContract(
            admin,
            AssetTokenBaseTestArtifact,
            [
                eController.address,
                amount_,
                price_,
                rewardPerBlock_,
                payment_,
                coordinate_,
                interestRate_,
                cashReserveRatio_,
                name_,
                symbol_,
            ]
        ) as AssetTokenBaseTest;
    })

    context("AssetToken.new", async () => {
        it('has given data', async () => {
            expect(await assetTokenBaseTest.totalSupply()).to.equal(amount_)
            expect(await assetTokenBaseTest.price()).to.equal(price_)
            expect(await assetTokenBaseTest.rewardPerBlock()).to.equal(rewardPerBlock_)
            expect(await assetTokenBaseTest.getPayment()).to.equal(payment_)
            expect(await assetTokenBaseTest.latitude()).to.equal(coordinate_[0])
            expect(await assetTokenBaseTest.longitude()).to.equal(coordinate_[1])
            expect(await assetTokenBaseTest.interestRate()).to.equal(interestRate_)
            expect(await assetTokenBaseTest.cashReserveRatio()).to.equal(cashReserveRatio_)
            expect(await assetTokenBaseTest.name()).to.equal(name_)
            expect(await assetTokenBaseTest.symbol()).to.equal(symbol_)
        })
    })

    context('AssetToken is deployed', async () => {
        it('Admin can set EController', async () => {
            await expect(assetTokenBaseTest.connect(admin).setEController(eController.address))
                .to.emit(assetTokenBaseTest, "NewController")
                .withArgs(eController.address)
        })

        it("General account cannot set EController", async () => {
            await expect(assetTokenBaseTest.connect(account1).setEController(eController.address))
                .to.be.revertedWith("Restricted to admin.")
        });

        it('Admin can set RewardPerBlock', async () => {
            const newRewardPerBlock = expandToDecimals(5, 15)
            await expect(assetTokenBaseTest.connect(admin).setRewardPerBlock(newRewardPerBlock))
                .to.emit(assetTokenBaseTest, "NewRewardPerBlock")
                .withArgs(newRewardPerBlock)
        })

        it("General account cannot set assetToken", async () => {
            const newRewardPerBlock = expandToDecimals(5, 15)
            await expect(assetTokenBaseTest.connect(account1).setRewardPerBlock(newRewardPerBlock))
                .to.be.revertedWith("Restricted to admin.")
        });
    })

    context('Asset Token Reward', async () => {
        const account1RewardPerBlock = rewardPerBlock_.mul(10).div(amount_)

        it('should accrue reward properly', async () => {
            const beforeTx = await assetTokenBaseTest.connect(admin).transfer(
                account1.address,
                10)
            const beforeReward = await assetTokenBaseTest.getReward(account1.address)
            const afterTx = await assetTokenBaseTest.connect(admin).transfer(
                account1.address,
                10)
            const afterReward = await assetTokenBaseTest.getReward(account1.address)
            expect(afterReward.sub(beforeReward))
                .to.be.equal(account1RewardPerBlock
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
                    ) // getReward tx adds 1 to the blockNumber
            )

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