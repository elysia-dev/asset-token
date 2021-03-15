import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenEth } from "../typechain/AssetTokenEth"
import expandToDecimals from "./utils/expandToDecimals";
import { deployContract } from "ethereum-waffle";
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import AssetTokenEthArtifact from "../artifacts/contracts/AssetTokenEth.sol/AssetTokenEth.json"

describe("AssetTokenEth", () => {
    let assetTokenEth: AssetTokenEth;
    let eController: EController;

    const amount_ = expandToDecimals(10000, 18)
    // 0.005 ether = 1 assetToken
    const price_ = expandToDecimals(5, 15)
    // price * interestRate / (secondsPerYear * blockTime)
    const rewardPerBlock_ = expandToDecimals(237, 6)
    const payment_ = 1
    const coordinate_ = [123, 456]
    const interestRate_ = expandToDecimals(1, 17)
    const cashReserveRatio_ = expandToDecimals(5, 17)
    const name_ = "ExampleAsset"
    const symbol_ = "EA"

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    const options = {
        gasLimit: 999999,
        value: ethers.utils.parseEther("0.1")
    }

    beforeEach(async () => {
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
                coordinate_,
                interestRate_,
                cashReserveRatio_,
                name_,
                symbol_,
            ],
        ) as AssetTokenEth
        await eController.connect(admin)
            .setAssetTokens([assetTokenEth.address])
    })

    describe(".reserve requirement system", async () => {
        beforeEach(async () => {
            await admin.sendTransaction({value: ethers.utils.parseEther("1"), to: assetTokenEth.address})
        })

        context('reserve calculator', async () => {
            it('return false for insufficient reserve for payment', async () => {
            })
        })

        context('send reserve', async () => {
            it('do not send reserve for insufficient reserve', async () => {
                await assetTokenEth.connect(account1).purchase({gasLimit: 999999, value: ethers.utils.parseEther("40")})
            })

            it('send reserve and emit event for excess reserve', async () => {
                await expect(assetTokenEth.connect(account1).purchase({gasLimit: 999999, value: ethers.utils.parseEther("40")}))
                .to.emit(assetTokenEth, 'ReserveDeposited')
                .withArgs(17.5)
                expect(await provider.getBalance(assetTokenEth.address))
                .to.be.equal(ethers.utils.parseEther("22.5"))
                expect(await provider.getBalance(assetTokenEth.address))
            })
        })

        context('request for payment', async () => {
            it('do not send request for sufficient reserve', async () => {
            })

            it('send request for insufficient reserve for payment', async () => {
            })
        })

        it('cannot execute purchase, refund and claimReward when paused', async () => {
            await assetTokenEth.connect(admin).pause();
            await expect(assetTokenEth.purchase())
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.refund(expandToDecimals(20, 18)))
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.claimReward())
                .to.be.revertedWith('Pausable: paused')
        })
    })

    xdescribe(".purchase", async () => {
        it('if account has sufficient allowed eth balance, can purchase token', async () => {
            const beforeBalance = await provider.getBalance(assetTokenEth.address)
            expect(await assetTokenEth.connect(account1).purchase(options))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("-0.1"))
            // cannot use changeEtherBalnce in contract.address
            const afterBalance = await provider.getBalance(assetTokenEth.address)
            expect(await assetTokenEth.balanceOf(account1.address))
                .to.be.equal(expandToDecimals(20, 18));
            expect(await assetTokenEth.balanceOf(assetTokenEth.address))
                .to.be.equal(amount_.sub(expandToDecimals(20, 18)));
            expect(afterBalance.sub(beforeBalance)).to.be.equal(
                price_.mul(20)
            );
        })

        it('if msg.value does not have sufficient eth balance, transfer is failed', async () => {
            await expect(assetTokenEth.connect(account1).purchase())
                .to.be.revertedWith('Not enough msg.value')
        })
    })

    xdescribe(".refund", async () => {
        it('if account and contract has sufficient balance, refund token', async () => {
            await assetTokenEth.connect(account1).purchase(options)
            expect(await assetTokenEth.connect(account1).refund(expandToDecimals(10, 18)))
                .to.changeEtherBalance(account1, ethers.utils.parseEther("0.05"))
            expect(await assetTokenEth.balanceOf(account1.address)).to.be.equal(expandToDecimals(10, 18));
            expect(
                await assetTokenEth.balanceOf(assetTokenEth.address)
            ).to.be.equal(amount_.sub(expandToDecimals(10, 18)));
            expect(await provider.getBalance(assetTokenEth.address)).to.eq(
                ethers.utils.parseEther("0.05")
            )
        })

        it('if contract has not sufficient balance, transfer is failed', async () => {
            await assetTokenEth.connect(account1).purchase(options)
            await assetTokenEth.connect(account1).refund(expandToDecimals(10, 18))
            await assetTokenEth.connect(admin).withdrawToAdmin()

            await expect(assetTokenEth.connect(account1).refund(expandToDecimals(10, 18)))
                .to.be.revertedWith('AssetToken: Insufficient buyer balance.')
        })

        it('if account does not have sufficient allowed balance, transfer is failed', async () => {
            await expect(assetTokenEth.connect(account1).refund(expandToDecimals(10, 18)))
                .to.be.revertedWith('AssetToken: Insufficient seller balance.')
        })
    })

    xdescribe('.withdrawEthToAdmin', async () => {
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

    xdescribe('Asset token Pausable', async () => {
        it('Admin can pause asset token', async () => {
            await expect(assetTokenEth.connect(admin).pause())
                .to.emit(assetTokenEth, 'Paused')
                .withArgs(admin.address)
        })

        it('cannot execute purchase, refund and claimReward when paused', async () => {
            await assetTokenEth.connect(admin).pause();
            await expect(assetTokenEth.purchase())
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.refund(expandToDecimals(20, 18)))
                .to.be.revertedWith('Pausable: paused')
            await expect(assetTokenEth.claimReward())
                .to.be.revertedWith('Pausable: paused')
        })
    })

    // ! FIXME
    // Below test code should be excuted last
    // When other test code is excuted after this test, Uncaugh RuntimeError is raised from @ethereum-waffle
    // -- Error Message --
    // Uncaught RuntimeError: abort(AssertionError:
    // Expected "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" to change balance by 0 wei, but it has changed by 1500000000 wei).
    // Build with -s ASSERTIONS=1 for more info.
    xdescribe('.claimReward', async () => {
        let firstBlock: number;
        let secondBlock: number;
        let thirdBlock: number;

        beforeEach(async () => {
            firstBlock = (await (await assetTokenEth.connect(account1).purchase(options)).wait()).blockNumber;
            secondBlock = (await (await assetTokenEth.connect(account1).transfer(account2.address, expandToDecimals(10, 18))).wait()).blockNumber;
            thirdBlock = (await (await assetTokenEth.connect(account1).transfer(account2.address, expandToDecimals(10, 18))).wait()).blockNumber;
        })

        it('if contract has not sufficient balance, transfer is failed', async () => {
            await assetTokenEth.connect(admin).withdrawToAdmin()

            await expect(assetTokenEth.connect(account1).claimReward())
                .to.be.revertedWith('AssetToken: Insufficient contract balance.')
        })

        it('account can claim reward.', async () => {
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
    })
})