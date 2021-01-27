import { expect } from "chai";
import { waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBase } from "../typechain/AssetTokenBase"
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { expandToDecimals, makeAssetTokenBase } from "./Utils/AssetToken";
import { deployContract } from "ethereum-waffle";
import EPriceOracleTestArtifact from "../artifacts/contracts/test/EPriceOracleTest.sol/EPriceOracleTest.json"
import EControllerArtifact from "../artifacts/contracts/EController.sol/EController.json"
import { keccak256, solidityKeccak256, toUtf8Bytes } from "ethers/lib/utils";

describe("Controller", () => {
    let eController: EController;

    const provider = waffle.provider;
    const [admin, account1, account2, account3, account4, account5] = provider.getWallets()

    beforeEach(async () => {
        eController = await deployContract(
            admin,
            EControllerArtifact
        ) as EController
    });

    context(".setEPriceOracle", async () => {
        let ePriceOracleTest: EPriceOracleTest;

        beforeEach(async () => {
            ePriceOracleTest = await deployContract(
                admin,
                EPriceOracleTestArtifact
            ) as EPriceOracleTest
        })

        it("Admin can set oracle", async () => {
            await expect(eController.connect(admin).setEPriceOracle(ePriceOracleTest.address, 0))
                .to.emit(eController, "NewPriceOracle")
                .withArgs(ePriceOracleTest.address)
            expect(await eController.ePriceOracle(0)).to.be.equal(ePriceOracleTest.address)
        });

        it("General account cannot set assetToken", async () => {
            await expect(eController.connect(account1).setEPriceOracle(ePriceOracleTest.address, 0))
                .to.be.revertedWith("Restricted to admin.")
        });
    });

    context(".control asset token", async () => {
        let assetTokenBase: AssetTokenBase;

        beforeEach(async () => {
            assetTokenBase = await makeAssetTokenBase
            ({
                from: admin,
                eController_: eController.address
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
    })

    context(".Oracle view function", async () => {
        let ePriceOracleTest0: EPriceOracleTest
        let ePriceOracleTest1: EPriceOracleTest
        let assetTokenBase0: AssetTokenBase
        let assetTokenBase1: AssetTokenBase

        beforeEach(async () => {
            ePriceOracleTest0 = await deployContract(
                admin,
                EPriceOracleTestArtifact
            ) as EPriceOracleTest
            ePriceOracleTest1 = await deployContract(
                admin,
                EPriceOracleTestArtifact
            ) as EPriceOracleTest
            assetTokenBase0 = await makeAssetTokenBase
            ({
                from: admin,
                eController_: eController.address
            })
            assetTokenBase1 = await makeAssetTokenBase
            ({
                from: admin,
                eController_: eController.address,
                payment_: 1
            })
            await ePriceOracleTest0.connect(admin).setPrice(expandToDecimals(5, 15))
            await ePriceOracleTest1.connect(admin).setPrice(expandToDecimals(1, 21))
            await eController.connect(admin).setAssetTokens(
                [
                    assetTokenBase0.address,
                    assetTokenBase1.address
                ])
            await eController.connect(admin).setEPriceOracle(ePriceOracleTest0.address, 0)
            await eController.connect(admin).setEPriceOracle(ePriceOracleTest1.address, 1)
        })

        it("getPrice return assetToken's payment type price", async () => {
            expect(await eController.connect(assetTokenBase0.address).getPrice(await assetTokenBase0.getPayment()))
                .to.equal(await ePriceOracleTest0.getPrice())
            expect(await eController.connect(assetTokenBase1.address).getPrice(await assetTokenBase1.getPayment()))
                .to.equal(await ePriceOracleTest1.getPrice())
        })
    })

    context('.whitelist', async () => {
        const WHITELISTED = keccak256(toUtf8Bytes("WHITELISTED"))

        it("Admin can add whitelist", async () => {
            await expect(eController.connect(admin).addAddressToWhitelist(account1.address))
                .to.emit(eController, "RoleGranted")
                .withArgs(WHITELISTED, account1.address, admin.address)
            expect(await eController.hasRole(WHITELISTED, account1.address))
                .to.be.true
        });

        it("Admin can add multi addresses to whitelist", async () => {
            await expect(eController.connect(admin).addAddressesToWhitelist([account1.address, account2.address]))
                .to.emit(eController, "RoleGranted")
            expect(await eController.getRoleMember(WHITELISTED, 0))
                .to.be.equal(account1.address)
            expect(await eController.getRoleMember(WHITELISTED, 1))
                .to.be.equal(account2.address)
            expect(await eController.getRoleMemberCount(WHITELISTED))
                .to.be.equal(2)
        });

        it("General account cannot add whitelist", async () => {
            await expect(eController.connect(account1).addAddressToWhitelist(account1.address))
                .to.be.revertedWith("Restricted to admin.")
        });

        it("Admin can remove whitelist", async () => {
            await eController.connect(admin).addAddressToWhitelist(account1.address)
            await expect(eController.connect(admin).removeAddressFromWhitelist(account1.address))
                .to.emit(eController, "RoleRevoked")
                .withArgs(WHITELISTED, account1.address, admin.address)
            expect(await eController.hasRole(WHITELISTED, account1.address))
                .to.be.false
        });

        it("whitelisted user can change whitelisted account", async () => {
            await eController.connect(admin).addAddressToWhitelist(account1.address)
            await expect(eController.connect(account1).changeWhitelistedAccount(account2.address))
                .to.emit(eController, "RoleGranted")
                .withArgs(WHITELISTED, account2.address, account1.address)
                .to.emit(eController, "RoleRevoked")
                .withArgs(WHITELISTED, account1.address, account1.address)
            expect(await eController.hasRole(WHITELISTED, account1.address))
                .to.be.false
            expect(await eController.hasRole(WHITELISTED, account2.address))
                .to.be.true
        })
    })
});
