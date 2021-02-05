import hardhat from 'hardhat';

async function main() {
  console.log(`${hardhat.network.name} deploy start`);

  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenEL = await hardhat.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");

  const controller = await EController.deploy();
  console.log("controller address:", controller.address);

  const assetTokenBlue2 = await AssetTokenEL.deploy(
    '0x2781246fe707bb15cee3e5ea354e2154a2877b16',
    controller.address,
    "5487" + "0".repeat(18),
    "5" + "0".repeat(18),
    "895289551784491",
    0,
    37486955000000000000,
    126941055000000000000,
    "27435" + "0".repeat(18),
    "8" + "0".repeat(16),
    "ELYSIA_ASSET_BLUE_2",
    "ELAB2",
    18,
  );
  console.log("assetTokenBlue2 address:", assetTokenBlue2.address);

  const assetTokenBlue3EL = await AssetTokenEL.deploy(
    '0x2781246fe707bb15cee3e5ea354e2154a2877b16',
    controller.address,
    "2688" + "0".repeat(18),
    "5" + "0".repeat(18),
    "895289551784491",
    0,
    37480374200000000000,
    126940674600000000000,
    "27150" + "0".repeat(18),
    "8" + "0".repeat(16),
    "ELYSIA_ASSET_BLUE_3_EL",
    "ELAB3EL",
    18,
  );
  console.log("assetTokenBlue3EL address:", assetTokenBlue3EL.address);

  const assetTokenBlue3Eth = await AssetTokenEth.deploy(
    controller.address,
    "2688" + "0".repeat(18),
    "5" + "0".repeat(18),
    "895289551784491",
    0,
    37480374200000000000,
    126940674600000000000,
    "27150" + "0".repeat(18),
    "8" + "0".repeat(16),
    "ELYSIA_ASSET_BLUE_3_ETH",
    "ELAB3ETH",
    18,
  );
  console.log("assetTokenBlue3Eth address:", assetTokenBlue3Eth.address);

  await controller.setEPriceOracle("0x9b234029d72B3B5061F1b743CDE1471A88056D88", 0);
  await controller.setEPriceOracle("0xC2d1cEC44E1689c7655F103A4795941496002566", 1);
  await controller.setAssetTokens([
    assetTokenBlue2.address,
    assetTokenBlue3EL.address,
    assetTokenBlue3Eth.address,
  ]);
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
