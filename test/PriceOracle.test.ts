import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { PriceOracle } from "../typechain/PriceOracle";

describe("PriceOracle", () => {
  let priceOracle: PriceOracle;

  let admin: SignerWithAddress, account1: SignerWithAddress;

  beforeEach(async () => {
    [admin, account1] = await ethers.getSigners();

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = (await PriceOracle.connect(admin).deploy(10000)) as PriceOracle;
  });

  context(".setPrice", async () => {
    it("Admin can set price", async () => {
      await expect(priceOracle.connect(admin).setPrice(30))
        .to.emit(priceOracle, "NewPrice")
        .withArgs(30);

      expect(await priceOracle.getPrice()).to.eq(30);
    });

    it("General account cannot set price", async () => {
      await expect(
        priceOracle.connect(account1).setPrice(30)
      ).to.be.revertedWith("PriceOracle: Restricted to admin");
    });
  });

  context(".mulPrice", async () => {
    it("it return multiple result", async () => {
      expect(await priceOracle.mulPrice(10)).to.equal(100000);
    });

    it("when overflow, it revert", async () => {
      await expect(priceOracle.mulPrice(`1${"0".repeat(75)}`)).to.be.reverted;
    });
  });
});
