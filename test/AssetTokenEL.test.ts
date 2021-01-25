import { expect } from "chai";
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
    })

    context(".purchase", async () => {

        beforeEach(async () => {

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
                .setPrice(expandToDecimals(3, 16))

        })

        it('if account has sufficient allowed el balance, can purchase token', async () => {
            console.log(assetTokenEL.address)
            console.log("account1 address:",account1.address)
            console.log("admin address:", admin.address)
            const adminBalance = (await el.balanceOf(admin.address)).toString()
            console.log(adminBalance)
            await el.connect(admin).transfer(account1.address, expandToDecimals(10000000, 18))
            console.log(12323444)
            await el.connect(account1).approve(
                assetTokenEL.address,
                elTotalSupply
            )
            console.log(12323)

            await assetTokenEL.connect(account1).purchase(20)

            expect(await assetTokenEL.balanceOf(account1.address))
                .to.be.equal(20);

            expect(await assetTokenEL.balanceOf(assetTokenEL.address))
                .to.be.equal(elTotalSupply.sub(20));

            expect(await el.balanceOf(assetTokenEL.address)).to.be.equal(
                await eController.connect(assetTokenEL.address)
                    .mulPrice(price_.mul(20))
            );

            // expect(await el.balanceOf(account1)).to.be.bignumber.equal(
            //     to18DecimalBN(10000).sub(await assetToken.toElAmount(20))
            // );
        })

        it('has given data', async () => {
        })
    })
})