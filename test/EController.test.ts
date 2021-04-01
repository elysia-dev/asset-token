import { expect } from "chai";
import { waffle, ethers } from "hardhat";
import { deployContract } from "ethereum-waffle";
import makeAssetTokenBase from "./utils/makeAssetTokenBase";
import makeEPriceOracleTest from "./utils/makeEPriceOracle";
import {expandToDecimals} from "./utils/Ethereum";

import { TestnetEL } from "../typechain/TestnetEL";
import { EPriceOracleTest } from "../typechain/EPriceOracleTest"
import { AssetTokenBaseTest } from "../typechain/AssetTokenBaseTest"
import { EControllerTest } from "../typechain/EControllerTest";

import EControllerTestArtifact from "../artifacts/contracts/test/EControllerTest.sol/EControllerTest.json"
import TestnetELArtifact from "../artifacts/contracts/test/TestnetEL.sol/TestnetEL.json"

describe("Controller", () => {
    let eController: EControllerTest;
    let el: TestnetEL;

    const provider = waffle.provider;
    const [admin, account1, account2] = provider.getWallets()

    const elTotalSupply = expandToDecimals(7, 28)

    beforeEach(async () => {
        eController = await deployContract(
            admin,
            EControllerTestArtifact
        ) as EControllerTest

        el = await deployContract(
            admin,
            TestnetELArtifact,
            [
                elTotalSupply,
                "TestnetEL",
                "EL",
            ]
        ) as TestnetEL;
    });

    context(".setEPriceOracle", async () => {
        let ePriceOracleTest: EPriceOracleTest;

        beforeEach(async () => {
            ePriceOracleTest = await makeEPriceOracleTest({
                from: admin,
                eController: eController,
                payment: el.address
            })
        })

        it("Admin can set oracle", async () => {
            expect(await eController.connect(admin).setEPriceOracle(ePriceOracleTest.address, el.address))
                .to.emit(eController, "NewPriceOracle")
                .withArgs(ePriceOracleTest.address)
            expect(await eController.ePriceOracle(el.address)).to.be.equal(ePriceOracleTest.address)
        });

        it("General account cannot set assetToken", async () => {
            expect(await eController.connect(account1).setEPriceOracle(ePriceOracleTest.address, el.address))
                .to.be.revertedWith("Restricted to admin.")
        });
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
    context(".Oracle view function", async () => {
        let ePriceOracleTestEth: EPriceOracleTest
        let ePriceOracleTestEL: EPriceOracleTest
        let assetTokenBase0: AssetTokenBaseTest
        let assetTokenBase1: AssetTokenBaseTest

        beforeEach(async () => {
            ePriceOracleTestEth = await makeEPriceOracleTest({
                from: admin,
                eController: eController
            })
            ePriceOracleTestEL = await makeEPriceOracleTest({
                from: admin,
                eController: eController,
                payment: el.address
            })
            assetTokenBase0 = await makeAssetTokenBase
                ({
                    from: admin,
                    eController_: eController.address
                })
            assetTokenBase1 = await makeAssetTokenBase
                ({
                    from: admin,
                    eController_: eController.address,
                    payment_: el.address
                })
            await eController.connect(admin).setAssetTokens(
                [
                    assetTokenBase0.address,
                    assetTokenBase1.address
                ])
        })

        it("getPrice return assetToken payment type price", async () => {
            expect(await eController.connect(assetTokenBase0.address).getPrice(await assetTokenBase0.getPayment()))
                .to.equal(await ePriceOracleTestEth.getPrice())
            expect(await eController.connect(assetTokenBase1.address).getPrice(await assetTokenBase1.getPayment()))
                .to.equal(await ePriceOracleTestEL.getPrice())
        })
    })
});
