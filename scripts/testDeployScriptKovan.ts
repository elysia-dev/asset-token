// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import hardhat from 'hardhat';
import ePriceOracleEthArguments from "./deployArguments/EPriceOracleEth";
import assetTokenELArguments from "./deployArguments/AssetTokenEL";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";
import kovanELArguements from "./deployArguments/KovanEL";

async function main() {
  const EPriceOracleEth = await hardhat.ethers.getContractFactory(
    "EPriceOracleEth"
  );
  const EPriceOracleEL = await hardhat.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenEL = await hardhat.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");
  const KovanEL = await hardhat.ethers.getContractFactory("KovanEL")

  const ePriceOracleEL = await EPriceOracleEL.deploy();
  const ePriceOracleEth = await EPriceOracleEth.deploy(
    ePriceOracleEthArguments.priceFeed
  );
  const controller = await EController.deploy();
  const kovanEL = await KovanEL.deploy(
    kovanELArguements.totalSupply_,
    kovanELArguements.name_,
    kovanELArguements.symbol_,
    kovanELArguements.decimals_
  );

  console.log("Deploy start")
  await ePriceOracleEL.deployed();
  console.log("ePriceOracleEL address:", ePriceOracleEL.address);

  await ePriceOracleEth.deployed();
  console.log("ePriceOracleEth address:", ePriceOracleEth.address);

  await controller.deployed();
  console.log("controller address:", controller.address);

  await kovanEL.deployed()
  console.log("kovalEl address:", kovanEL.address);


  assetTokenELArguments.eController_ = controller.address;
  assetTokenELArguments.el_ = kovanEL.address;
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
  console.log("assetTokenEL address", assetTokenEL.address);

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
  console.log("assetTokenEth address", assetTokenEth.address);

  await controller.setEPriceOracle(ePriceOracleEL.address, 0);
  await controller.setEPriceOracle(ePriceOracleEth.address, 1);
  await controller.setAssetTokens([
    assetTokenEL.address,
    assetTokenEth.address,
  ]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
