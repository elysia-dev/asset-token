import hardhat from 'hardhat';

async function main() {
  console.log(`${hardhat.network.name} deploy start`);

  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");

  const assetTokenBlue3Eth = await AssetTokenEth.deploy(
    "0x5b1Df4d7fAc33B24a8DEF3499ACAE0347AaB31a7",
    "2688" + "0".repeat(18),
    "5" + "0".repeat(18),
    "895289551784491",
    1,
    374803742,
    1269406746,
    "27150" + "0".repeat(18),
    "8" + "0".repeat(16),
    "ELYSIA_ASSET_BLUE_3_ETH",
    "ELAB3ETH",
    18,
  );

  console.log("assetTokenBlue3Eth address:", assetTokenBlue3Eth.address);
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
