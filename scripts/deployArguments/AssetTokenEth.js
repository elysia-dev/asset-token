const price = "5" + "0".repeat(18);
const assetPrice = "5" + "0".repeat(21);
const rewardPerBlock = "5" + "0".repeat(14);
const interestRate = "1" + "0".repeat(17);

module.exports = {
  //el_: "0x5735Af25c6BE1b5822ccd03CDaD3C84eB1e0E9C8", //Eth는 EL 주소 필요 없음
  eController_: "", //아직 eController가 없어요
  amount_: 10000,
  price_: price,
  rewardPerBlock_: rewardPerBlock,
  payment_: 1,
  latitude_: 123,
  longitude_: 456,
  assetPrice_: assetPrice,
  interestRate_: interestRate,
  name_: "AssetBlueEth",
  symbol_: "ABEth",
  decimals_: 0,
};
