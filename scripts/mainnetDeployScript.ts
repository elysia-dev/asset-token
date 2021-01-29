import hardhat from 'hardhat';
import ePriceOracleEthArguments from "./deployArguments/EPriceOracleEth";
import assetTokenELArguments from "./deployArguments/AssetTokenEL";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";

async function main() {
  console.log(`${hardhat.network.name} deploy start`)

  const EPriceOracleEth = await hardhat.ethers.getContractFactory(
    "EPriceOracleEth"
  );
  const EPriceOracleEL = await hardhat.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenEL = await hardhat.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");

  const ePriceOracleEL = await EPriceOracleEL.deploy();
  console.log(`ePriceOracleEL:${ePriceOracleEL.address}`);

  const ePriceOracleEth = await EPriceOracleEth.deploy(
    ePriceOracleEthArguments.priceFeed
  );
  console.log(`ePriceOracleEth:${ePriceOracleEth.address}`);

  const controller = await EController.deploy();
  console.log(`controller:${controller.address}`);

  assetTokenELArguments.eController_ = controller.address;
  assetTokenELArguments.el_ = "0x2781246fe707bb15cee3e5ea354e2154a2877b16"; // mainnet el
  assetTokenEthArguments.eController_ = controller.address;

  const assetTokenEL = await AssetTokenEL.deploy(
    assetTokenELArguments.el_,
    assetTokenELArguments.eController_,
    assetTokenELArguments.amount_,
    assetTokenELArguments.price_,
    assetTokenELArguments.rewardPerBlock_,
    assetTokenELArguments.payment_,
    assetTokenELArguments.latitude_,
    assetTokenELArguments.longitude_,
    assetTokenELArguments.assetPrice_,
    assetTokenELArguments.interestRate_,
    assetTokenELArguments.name_,
    assetTokenELArguments.symbol_,
    assetTokenELArguments.decimals_
  );
  console.log(`assetTokenEL:${assetTokenEL.address}`);

  const assetTokenEth = await AssetTokenEth.deploy(
    assetTokenEthArguments.eController_,
    assetTokenEthArguments.amount_,
    assetTokenEthArguments.price_,
    assetTokenEthArguments.rewardPerBlock_,
    assetTokenEthArguments.payment_,
    assetTokenEthArguments.latitude_,
    assetTokenEthArguments.longitude_,
    assetTokenEthArguments.assetPrice_,
    assetTokenEthArguments.interestRate_,
    assetTokenEthArguments.name_,
    assetTokenEthArguments.symbol_,
    assetTokenEthArguments.decimals_
  );
  console.log(`assetTokenEth:${assetTokenEth.address}`);

  await controller.setEPriceOracle(ePriceOracleEL.address, 0);
  await controller.setEPriceOracle(ePriceOracleEth.address, 1);
  await controller.setAssetTokens([
    assetTokenEL.address,
    assetTokenEth.address,
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
