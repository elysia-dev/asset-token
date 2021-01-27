// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import hardhat from 'hardhat';
import ePriceOracleEthArguments from "./deployArguments/EPriceOracleEth";
import assetTokenELArguments from "./deployArguments/AssetTokenEL";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";
import testnetELArguements from "./deployArguments/TestnetEL";

async function main() {

  const EPriceOracleEL = await hardhat.ethers.getContractFactory("EPriceOracleEL");

  const ePriceOracleEL = await EPriceOracleEL.deploy();

  await ePriceOracleEL.deployed();
  console.log("ePriceOracleEL address:", ePriceOracleEL.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
