import { expect } from "chai";
import { waffle } from "hardhat";
import { EPriceOracleEL } from "../typechain/EPriceOracleEL";
import { deployContract } from "ethereum-waffle";
import EPriceOracleELArtifact from "../artifacts/contracts/EPriceOracleEL.sol/EPriceOracleEL.json"

describe("EPriceOracleEL", () => {
  let ePriceOracleEL: EPriceOracleEL;

  const provider = waffle.provider;
  const [admin, account1] = provider.getWallets()

  beforeEach(async () => {
    ePriceOracleEL = await deployContract(
      admin,
      EPriceOracleELArtifact
    ) as EPriceOracleEL;
  });

  context(".setPrice", async () => {
    it("Admin can set price", async () => {
      await expect(ePriceOracleEL.connect(admin).setElPrice(30))
        .to.emit(ePriceOracleEL, "NewElPrice")
        .withArgs(30);
      expect(await ePriceOracleEL.getPrice()).to.equal(30);
    });

    it("General account cannot set price", async () => {
      await expect(ePriceOracleEL.connect(account1).setElPrice(30)
      ).to.be.revertedWith("Restricted to admin");
    });
  });
});