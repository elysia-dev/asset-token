const { expect } = require("chai");

describe("PriceOracle", () => {
  let priceOracle;

  let admin, account1;

  beforeEach(async () => {
    [admin, account1] = await ethers.getSigners();

    PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.connect(admin).deploy(10000);

    await priceOracle.deployed();
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
