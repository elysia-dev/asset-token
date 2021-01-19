// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const ePriceOracleEthArguments = require("./deployArguments/EPriceOracleEth.js")
const AssetTokenELArguments = require("./deployArguments/AssetTokenEL")
const AssetTokenEthArguments = require("./deployArguments/AssetTokenEth.js")

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const EPriceOracleEth = await hre.ethers.getContractFactory("EPriceOracleEth");
  const EPriceOracleEL = await hre.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hre.ethers.getContractFactory("EController");
  const AssetTokenEl = await hre.ethers.getContractFactory("AssetTokenEl");
  const AssetTokenEth = await hre.ethers.getContractFactory("AssetTokenEth");

  const ePriceOracleEL = await EPriceOracleEL.deploy();
  const ePriceOracleEth = await EPriceOracleEth.depoly(
    ePriceOracleEthArguments.priceFeed
  );
  const controller = await EController.deploy();

  await ePriceOracleEL.deployed();
  await ePriceOracleEth.deployed();
  await controller.deployed();

  console.log("ePriceOracleEL address:", ePriceOracleEL.address)
  console.log("ePriceOracleEth address:", ePriceOracleEth.address)
  console.log("controller address:",controller.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
