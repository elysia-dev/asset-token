// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

const hre = require("hardhat");

const ePriceOracleEthArguments = require("./deployArguments/EPriceOracleEth.js");
const assetTokenELArguments = require("./deployArguments/AssetTokenEL");
const assetTokenEthArguments = require("./deployArguments/AssetTokenEth.js");
const kovanELArguements = require("./deployArguments/KovanEL.js");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const EPriceOracleEth = await hre.ethers.getContractFactory(
    "EPriceOracleEth"
  );
  const EPriceOracleEL = await hre.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hre.ethers.getContractFactory("EController");
  const AssetTokenEL = await hre.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hre.ethers.getContractFactory("AssetTokenEth");
  const KovanEL = await hre.ethers.getContractFactory("KovanEL")

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

  await ePriceOracleEL.deployed();
  await ePriceOracleEth.deployed();
  await controller.deployed();
  await kovanEL.deployed()

  console.log("ePriceOracleEL address:", ePriceOracleEL.address);
  console.log("ePriceOracleEth address:", ePriceOracleEth.address);
  console.log("controller address:", controller.address);

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

  console.log("assetTokenEL address", assetTokenEL.address);
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
