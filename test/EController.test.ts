import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBase } from "../typechain/AssetTokenBase"
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { expandToDecimals, makeAssetTokenBase } from "./Utils/AssetToken";
import { deployContract } from "ethereum-waffle";
import EPriceOracleTestArtifact from "../artifacts/contracts/test/EPriceOracleTest.sol/EPriceOracleTest.json"


describe("Controller", () => {

    let eController: EController;

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        const EController = await ethers.getContractFactory("EController");
        eController = (await EController.connect(admin).deploy()) as EController;
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

            console.log(await ePriceOracleTest0.getPrice())

            expect(await eController.connect(assetTokenBase0.address).getPrice())
                .to.equal(await ePriceOracleTest0.getPrice())

            console.log(await ePriceOracleTest1.getPrice())

            expect(await eController.connect(assetTokenBase1.address).getPrice())
                .to.equal(await ePriceOracleTest1.getPrice())
        })

        it("mulPrice return exchange ratio", async () => {
            expect(await eController.connect(assetTokenBase0.address).mulPrice(expandToDecimals(5, 18)))
                .to.equal(expandToDecimals(1, 21))
        })
    })
});
