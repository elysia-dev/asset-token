import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenEL } from "../typechain/AssetTokenEL"
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { expandToDecimals } from "./Utils/AssetToken";
import { deployContract } from "ethereum-waffle";
import AssetTokenEthArtifact from "../artifacts/contracts/AssetTokenEth.sol/AssetTokenEth.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
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
            expect(await assetTokenEth.connect(account1).purchase(20, options))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("-0.1"))
            // cannot use changeEtherBalnce in contract.address
            const afterBalance = await provider.getBalance(assetTokenEth.address)
            expect(await assetTokenEth.balanceOf(account1.address))
                .to.be.equal(20);
            expect(await assetTokenEth.balanceOf(assetTokenEth.address))
                .to.be.equal(amount_ - 20);
            expect(afterBalance.sub(beforeBalance)).to.be.equal(
                await eController.connect(assetTokenEth.address)
                    .mulPrice(price_.mul(20), payment_)
            );
        })

        it('if msg.value does not have sufficient eth balance, transfer is failed', async () => {
            await expect(assetTokenEth.connect(account1).purchase(10))
                .to.be.revertedWith('Not enough msg.value')
        })
    })

    context(".refund", async () => {
        it('if account and contract has sufficient balance, refund token', async () => {
            await assetTokenEth.connect(account1).purchase(20, options)
            expect(await assetTokenEth.connect(account1).refund(10))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("0.05"))
            expect(await assetTokenEth.balanceOf(account1.address)).to.be.equal(10);
            expect(
                await assetTokenEth.balanceOf(assetTokenEth.address)
            ).to.be.equal(amount_ - 10);
        })

        it('if account does not have sufficient allowed balance, transfer is failed', async () => {
            await admin.sendTransaction({ to: assetTokenEth.address, value: ethers.utils.parseEther("50") })
            await expect(assetTokenEth.connect(account1).refund(10))
                .to.be.revertedWith('AssetToken: Insufficient seller balance.')
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
            expect(await assetTokenEth.connect(account1).claimReward())
                .to.changeEtherBalance(account1, expectedReward)
        })

        it('Not whitelisted account cannot claim reward.', async () => {
            expect(await assetTokenEth.getReward(account2.address)).not.to.be.equal(0);
            await expect(assetTokenEth.connect(account2).claimReward())
                .to.be.revertedWith('Restricted')
        })
    })

    context('.withdrawEthToAdmin', async () => {
        beforeEach(async () => {
            await admin.sendTransaction({ to: assetTokenEth.address, value: ethers.utils.parseEther("50") })
        })

        it('admin can withdrwal all ether.', async () => {
            expect(await assetTokenEth.connect(admin).withdrawToAdmin())
                .to.changeEtherBalance(account1, await provider.getBalance(assetTokenEth.address))
            expect(await provider.getBalance(assetTokenEth.address)).to.be.equal(0);
        })

        it('account cannot withdraw ether.', async () => {
            await expect(assetTokenEth.connect(account1).withdrawToAdmin())
                .to.be.revertedWith('Restricted')
        })
    })

    context('Asset token Pausable', async () => {
        it('Admin can pause asset token', async () => {
            await expect(assetTokenEth.connect(admin).pause())
                .to.emit(assetTokenEth, 'Paused')
                .withArgs(admin.address)
        })

        it('cannot execute purchase, refund and claimReward when paused', async () => {
            await eController.connect(admin).addAddressToWhitelist(account1.address);
            await assetTokenEth.connect(admin).pause();
            await expect(assetTokenEth.purchase(20))
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.refund(20))
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.claimReward())
                .to.be.revertedWith('Pausable: paused')
        })
    })
})