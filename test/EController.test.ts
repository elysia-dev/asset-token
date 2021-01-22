import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { EController } from "../typechain/EController";
import { AssetTokenBase } from "../typechain/AssetTokenBase"
import { EPriceOracleEL } from "../typechain/EPriceOracleEL"
import { EPriceOracleEth } from "../typechain/EPriceOracleEth"
import { makeAssetTokenBase } from "./Utils/AssetToken";

describe("PriceOracle", () => {

    let eController: EController;

    const provider = waffle.provider;
    const [admin, account1] = provider.getWallets()

    beforeEach(async () => {
        const EController = await ethers.getContractFactory("EController");
        eController = (await EController.connect(admin).deploy()) as EController;
    });

    context(".setEPriceOracle", async () => {
        beforeEach(async () => {
            const EPriceOracleEL = await ethers.getContractFactory("EPriceOracleEL")
        })

        it("Admin can set oracle", async () => {
            // const testOracle
            // await expect(priceOracle.connect(admin).setPrice(30))
            //     .to.emit(priceOracle, "NewPrice")
            //     .withArgs(30);

            // expect(await priceOracle.getPrice()).to.eq(30);
        });

        it("General account cannot set assetToken", async () => {
            // await expect(
            //     priceOracle.connect(account1).setPrice(30)
            // ).to.be.revertedWith("PriceOracle: Restricted to admin");
            //      });
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
            await expect(eController.connect(admin).setAssetTokens([assetTokenBase.address]))
                .to.be.revertedWith("Restricted to admin.")

            //await expect(priceOracle.mulPrice(`1${"0".repeat(75)}`)).to.be.reverted;
        });
    })
});
