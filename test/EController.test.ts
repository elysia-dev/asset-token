import { expect } from "chai";
import { waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBaseTest } from "../typechain/AssetTokenBaseTest"
import makeAssetTokenBase from "./utils/makeAssetTokenBase";
import { deployContract } from "ethereum-waffle";
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import { ethers } from "ethers";
import expandToDecimals from "./utils/expandToDecimals";

describe("Controller", () => {
    let eController: EController;

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        eController = await deployContract(
            admin,
            EControllerArtifact
        ) as EController
    });

    context(".control asset token", async () => {
        let assetTokenBase: AssetTokenBaseTest;

        beforeEach(async () => {
            assetTokenBase = await makeAssetTokenBase
                ({
                    from: admin,
                    eController_: eController.address,
                })
        })

        it("Admin can set asset token", async () => {
            await expect(eController.connect(admin).setAssetTokens([assetTokenBase.address]))
                .to.emit(eController, "NewAssetToken")
                .withArgs(assetTokenBase.address)
        });

        it("General account cannot set assetToken", async () => {
            await expect(eController.connect(account1).setAssetTokens([assetTokenBase.address]))
                .to.be.revertedWith("Restricted to admin.")
        });

        it("Admin can pause asset token", async () => {
            await expect(eController.connect(admin).pauseAssetTokens([assetTokenBase.address]))
                .to.emit(assetTokenBase, "Paused")
            expect(await assetTokenBase.paused()).to.be.true
        });

        it("Admin can unpause asset token", async () => {
            await expect(eController.connect(admin).pauseAssetTokens([assetTokenBase.address]))
                .to.emit(assetTokenBase, "Paused")
            await expect(eController.connect(admin).unpauseAssetTokens([assetTokenBase.address]))
                .to.emit(assetTokenBase, "Unpaused")
            expect(await assetTokenBase.paused()).to.be.false
        });

        describe("./reserve", async () => {
            beforeEach(async () => {
                await account1.sendTransaction({to: assetTokenBase.address, value: ethers.utils.parseEther("10")})
            })

            it("General account cannot withdraw reserve from eController", async () => {
                await expect(eController.connect(account1).withdrawReserveFromAssetTokenEth(expandToDecimals(1, 18)))
                    .to.be.revertedWith("Restricted to assetToken.")
            })
        })

    })
});
