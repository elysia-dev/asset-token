const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const RewardManagerTest = artifacts.require("RewardManagerTest");

contract("RewardManager", (accounts) => {
  let rewardManager;
  const totalSupply = 10000;
  const rewardPerBlock = "5" + "0".repeat(14);
  const account1RewardPerBlock = new BN(rewardPerBlock)
    .mul(new BN(10))
    .div(new BN(totalSupply));
  const [admin, account1, account2] = accounts;

  beforeEach(async () => {
    rewardManager = await RewardManagerTest.new(
      "name",
      "symbol",
      0,
      totalSupply,
      admin,
      { from: admin }
    );
  });

  describe(".setRewardPerBlock", async () => {
    it("admin can set rewardPerBlock", async () => {
      const tx = await rewardManager.setRewardPerBlock(rewardPerBlock, {
        from: admin,
      });

      expect(await rewardManager.getRewardPerBlock()).to.be.bignumber.equal(
        new BN(rewardPerBlock)
      );

      expectEvent(tx, "NewRewardPerBlock", {
        newRewardPerBlock: rewardPerBlock,
      });
    });

    it("general account cannot set price", async () => {
      await expectRevert(
        rewardManager.setRewardPerBlock(rewardPerBlock, { from: account1 }),
        "Restricted to admin."
      );
    });
  });

  context("when rewardPerBlock is set", async () => {
    beforeEach(async () => {
      await rewardManager.setRewardPerBlock(rewardPerBlock, { from: admin });
      await rewardManager.transfer(account1, 10, { from: admin });
    });

    describe(".getReward", async () => {
      beforeEach(async () => {
        const tx = await rewardManager.saveRewardTest(account1);
        firstBlockNumber = tx.receipt.blockNumber;
      });

      it("if account has token, return increased reward with blockNumbers", async () => {
        const txBefore = await rewardManager.transfer(account2, 10, {
          from: admin,
        });
        const beforeReward = await rewardManager.getReward(account1);
        const txAfter = await rewardManager.transfer(account2, 10, {
          from: admin,
        });
        const afterReward = await rewardManager.getReward(account1);

        expect(afterReward.sub(beforeReward)).to.be.bignumber.equal(
          account1RewardPerBlock.mul(
            new BN(txAfter.receipt.blockNumber - txBefore.receipt.blockNumber)
          )
        );
      });

      it("if account do not have token, return zero", async () => {
        const beforeReward = await rewardManager.getReward(account2);
        await rewardManager.transfer(account1, 10, { from: admin });
        const afterReward = await rewardManager.getReward(account2);

        expect(beforeReward).to.be.bignumber.equal(new BN(0));

        expect(afterReward).to.be.bignumber.equal(new BN(0));
      });
    });

    describe(".saveReward", async () => {
      it("if account has token, reward is saved", async () => {
        const tx1 = await rewardManager.saveRewardTest(account1);
        const tx2 = await rewardManager.saveRewardTest(account1);

        expect(await rewardManager.getReward(account1)).to.be.bignumber.equal(
          account1RewardPerBlock.mul(
            new BN(tx2.receipt.blockNumber - tx1.receipt.blockNumber)
          )
        );
      });

      it("if user has no token, save zero value", async () => {
        await rewardManager.saveRewardTest(account2);
        await rewardManager.saveRewardTest(account2);

        expect(await rewardManager.getReward(account2)).to.be.bignumber.equal(
          new BN(0)
        );
      });
    });

    describe(".clearReward", async () => {
      it("clear reward", async () => {
        await rewardManager.saveRewardTest(account1);
        await rewardManager.saveRewardTest(account1);
        await rewardManager.clearRewardTest(account1);

        expect(await rewardManager.getReward(account1)).to.be.bignumber.equal(
          new BN(0)
        );
      });
    });
  });
});
