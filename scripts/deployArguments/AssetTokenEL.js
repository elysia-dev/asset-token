const price = '5' + '0'.repeat(18);
const assetPrice = '5' + '0'.repeat(21);
const rewardPerBlock = '5' + '0'.repeat(14);
const interestRate = '1' + '0'.repeat(17);

module.exports = {
    el_: "0x5735Af25c6BE1b5822ccd03CDaD3C84eB1e0E9C8", // Ropsten EL
    eController_: "Not deployed", //deploy 이후 넣어야 하는 값
    amount_: 10000,
    price_: price,
    rewardPerBlock_: rewardPerBlock,
    payment_: 0,
    latitude_: 123,
    longitude_: 456,
    assetPrice_: assetPrice,
    interestRate_: interestRate,
    name_: "AssetBlueEL",
    symbol_: "ABEL",
    decimals_: 0
}

