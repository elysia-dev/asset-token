const price = "5" + "0".repeat(18);
const assetPrice = "5" + "0".repeat(21);
const rewardPerBlock = "5" + "0".repeat(14);
const interestRate = "1" + "0".repeat(17);

module.exports = [
  process.env.CONTROLLER,
  10000,
  price,
  rewardPerBlock,
  1,
  123,
  456,
  assetPrice,
  interestRate,
  "AssetBlueEth",
  "ABEth",
  0,
];
