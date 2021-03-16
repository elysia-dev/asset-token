import { assert, expect } from "chai";
import { waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenEL } from "../typechain/AssetTokenEL"
import { TestnetEL } from "../typechain/TestnetEL"
import expandToDecimals from "./utils/expandToDecimals";
import { deployContract } from "ethereum-waffle";
import AssetTokenELArtifact from "../artifacts/contracts/AssetTokenEl.sol/AssetTokenEL.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import TestnetELArtifact from "../artifacts/contracts/test/TestnetEL.sol/TestnetEL.json"

describe("AssetTokenEl", () => {
    let assetTokenEL: AssetTokenEL;
    let eController: EController;
    let el: TestnetEL;

    const amount_ = expandToDecimals(10000, 18)
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
    const elPrice = expandToDecimals(4, 16)

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
            .setAssetTokens([assetTokenEL.address])
    })

    context(".purchase", async () => {
        it('if account has sufficient allowed el balance, can purchase token', async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18))
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )

            await assetTokenEL.connect(account1).purchase(
                expandToDecimals(20, 18).mul(price_).div(elPrice)
            )
            expect(await assetTokenEL.balanceOf(account1.address))
                .to.be.equal(expandToDecimals(20, 18));
            expect(await assetTokenEL.balanceOf(assetTokenEL.address))
                .to.be.equal(amount_.sub(expandToDecimals(20, 18)));
            expect(await el.balanceOf(assetTokenEL.address)).to.be.equal(
                price_.mul(20).mul(expandToDecimals(1, 18)).div(elPrice)
            );
            expect(await el.balanceOf(account1.address)).to.be.equal(
                expandToDecimals(10000, 18).sub(
                    price_.mul(20).mul(expandToDecimals(1, 18)).div(elPrice)
                )
            );
        })

        it('if account does not have sufficient allowed el balance, transfer is failed', async () => {
            await expect(assetTokenEL.connect(account1).purchase(
                expandToDecimals(20, 18).mul(price_).div(elPrice)
            ))
                .to.be.revertedWith('AssetToken: Insufficient buyer el balance.')
        })
    })

    context(".refund", async () => {
        beforeEach(async () => {
            await el.connect(admin).transfer(assetTokenEL.address, expandToDecimals(10000, 18))
        })

        it('if account and contract has sufficient balance, refund token', async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18))
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )
            await assetTokenEL.connect(account1).purchase(
                expandToDecimals(20, 18).mul(price_).div(elPrice)
            )

            // Half refund
            await assetTokenEL.connect(account1).refund(expandToDecimals(10, 18))
            expect(await assetTokenEL.balanceOf(account1.address)).to.be.equal(expandToDecimals(10, 18));
            expect(
                await assetTokenEL.balanceOf(assetTokenEL.address)
            ).to.be.equal(amount_.sub(expandToDecimals(10, 18)));
            expect(await el.balanceOf(account1.address)).to.be.equal(
                expandToDecimals(10000, 18).sub(
                    price_.mul(10).mul(expandToDecimals(1, 18)).div(elPrice)
                )
            );

            // Full refund
            await assetTokenEL.connect(account1).refund(expandToDecimals(10, 18))
            expect(await assetTokenEL.balanceOf(account1.address)).to.be.equal(0);
            expect(await el.balanceOf(account1.address)).to.be.equal(expandToDecimals(10000, 18));
        })

        it('if account does not have sufficient allowed balance, transfer is failed', async () => {
            await expect(assetTokenEL.connect(account1).refund(expandToDecimals(10, 18)))
                .to.be.revertedWith('AssetToken: Insufficient seller balance.')
        })

        it('if account does not have sufficient balance, transfer is failed', async () => {
            await assetTokenEL.connect(account1).approve(assetTokenEL.address, amount_)
            await expect(assetTokenEL.connect(account1).refund(expandToDecimals(10, 18)))
                .to.be.revertedWith('AssetToken: Insufficient seller balance.')
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
            firstBlock = (await (await assetTokenEL.connect(account1).purchase(
                expandToDecimals(20, 18).mul(price_).div(elPrice)
            )).wait()).blockNumber;
            await el.connect(account1).transfer(account2.address, await el.balanceOf(account1.address));
            secondBlock = (await (await assetTokenEL.connect(account1).transfer(account2.address, expandToDecimals(10, 18))).wait()).blockNumber;
            thirdBlock = (await (await assetTokenEL.connect(account1).transfer(account2.address, expandToDecimals(10, 18))).wait()).blockNumber;
        })

        it('account can claim reward.', async () => {
            const expectedReward = rewardPerBlock_
                .mul(
                    expandToDecimals(
                        20 * (secondBlock - firstBlock) + 10 * (thirdBlock - secondBlock),
                        18
                    )
                ).mul(expandToDecimals(1, 18))
                .div(amount_)
                .div(elPrice)
            await assetTokenEL.connect(account1).claimReward()
            expect(await el.balanceOf(account1.address)).to.be.equal(expectedReward);
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

    context('Asset token Pausable', async () => {
        it('Admin can pause asset token', async () => {
            await expect(assetTokenEL.connect(admin).pause())
                .to.emit(assetTokenEL, 'Paused')
                .withArgs(admin.address)
        })

        it('cannot execute purchase, refund and claimReward when paused', async () => {
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000, 18))
            await el.connect(admin).transfer(assetTokenEL.address, expandToDecimals(10000, 18))
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )
            await assetTokenEL.connect(admin).pause();

            await expect(assetTokenEL.connect(account1).purchase(
                expandToDecimals(20, 18).mul(price_).div(elPrice)
            )).to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEL.connect(account1).refund(expandToDecimals(10, 18)))
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEL.connect(account1).claimReward())
                .to.be.revertedWith('Pausable: paused')
        })
    })
})