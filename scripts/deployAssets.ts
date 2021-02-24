import hardhat from 'hardhat';
import { exec } from "child_process";

const el = "0x2781246fe707bb15cee3e5ea354e2154a2877b16";
const controller = "0x5b1Df4d7fAc33B24a8DEF3499ACAE0347AaB31a7";
const supply = "5400" + "0".repeat(18);
const price = "5" + "0".repeat(18);
const rewardPerBlock = "895289551784491"; // APY 8%
const priceOracle = 0 // 0:el, 1:eth;
const latitude = 37486946;
const longitude = 126941097;
const assetPrice = "27435" + "0".repeat(18);
const interestRate = "8" + "0".repeat(16);
const name = "ELYSIA_ASSET_BLUE_2_2";
const symbol = "ELAB2_2";
const decimals = 18;

async function main() {
  console.log(`${hardhat.network.name} deploy start`);

  const AssetTokenEl = await hardhat.ethers.getContractFactory("AssetTokenEL");

  const assetToken = await AssetTokenEl.deploy(
    el,
    controller,
    supply,
    price,
    rewardPerBlock,
    priceOracle,
    latitude,
    longitude,
    assetPrice,
    interestRate,
    name,
    symbol,
    decimals
  );

  console.log("assetTokenBlue2_2 address:", assetToken.address);

  exec(`yarn hardhat verify --network ${hardhat.network.name} ${assetToken.address} \
  '${el} ${controller} ${supply} ${price} ${rewardPerBlock} ${priceOracle} ${latitude} ${longitude} ${assetPrice} ${interestRate} ${name} ${symbol} ${decimals}'
  `, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

if (!['mainnet', 'kovan'].includes(hardhat.network.name)) {
  console.log(`Network shoud be mainnet or kovan only. You select ${hardhat.network.name}`);
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
