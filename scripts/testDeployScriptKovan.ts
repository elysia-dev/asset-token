import hardhat from 'hardhat';
import ePriceOracleEthArguments from "./deployArguments/EPriceOracleEth";
import assetTokenELArguments from "./deployArguments/AssetTokenEL";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";
import testnetELArguements from "./deployArguments/TestnetEL";
import { exec } from "child_process";

async function main() {
  console.log("Deploy start")

  const EPriceOracleEth = await hardhat.ethers.getContractFactory(
    "EPriceOracleEth"
  );
  const EPriceOracleEL = await hardhat.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenEL = await hardhat.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");
  const TestnetEL = await hardhat.ethers.getContractFactory("TestnetEL")

  const ePriceOracleEL = await EPriceOracleEL.deploy();
  console.log("ePriceOracleEL address:", ePriceOracleEL.address);

  const ePriceOracleEth = await EPriceOracleEth.deploy(
    ePriceOracleEthArguments.priceFeed
  );
  console.log("ePriceOracleEth address:", ePriceOracleEth.address);

  const controller = await EController.deploy();
  console.log("controller address:", controller.address);

  const testnetEL = await TestnetEL.deploy(
    testnetELArguements.totalSupply_,
    testnetELArguements.name_,
    testnetELArguements.symbol_,
    testnetELArguements.decimals_
  );
  console.log("kovanEl address:", testnetEL.address);

  assetTokenELArguments.eController_ = controller.address;
  assetTokenELArguments.el_ = testnetEL.address;
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

  exec(`EL=${testnetEL.address}\
    CONTROLLER=${controller.address}\
    PRICE_ORACLE_EL=${ePriceOracleEL.address}\
    PRICE_ORACLE_ETH=${ePriceOracleEth.address}\
    ASSET_TOKEN_ETH=${assetTokenEth.address}\
    ASSET_TOKEN_EL=${assetTokenEL.address}\
    yarn ts-node scripts/testVerifyScriptKovan.ts`, (error, stdout, stderr) => {
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
