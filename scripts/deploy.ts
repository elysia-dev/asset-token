import hardhat from 'hardhat';
import assetTokenELArguments from "./deployArguments/AssetTokenEL";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";
import testnetELArguements from "./deployArguments/TestnetEL";
import { exec } from "child_process";

let el = process.env.EL || '';
let priceOracleEL = process.env.PRICE_ORACLE_EL || '';
let priceOracleETH = process.env.PRICE_ORACLE_ETH || '';

async function main() {
  console.log(`${hardhat.network.name} deploy start`);

  const EPriceOracleEth = await hardhat.ethers.getContractFactory(
    "EPriceOracleEth"
  );
  const EPriceOracleEL = await hardhat.ethers.getContractFactory("EPriceOracleEL");
  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenEL = await hardhat.ethers.getContractFactory("AssetTokenEL");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");
  const TestnetEL = await hardhat.ethers.getContractFactory("TestnetEL")

  if (!priceOracleEL) {
    const ePriceOracleEL = await EPriceOracleEL.deploy();
    console.log("ePriceOracleEL address:", ePriceOracleEL.address);
    priceOracleEL = ePriceOracleEL.address;
  }

  // https://docs.chain.link/docs/ethereum-addresses#mainnet
  if (!priceOracleETH) {
    const ePriceOracleEth = await EPriceOracleEth.deploy(
      hardhat.network.name === 'mainnet' ? '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419' : '0x9326BFA02ADD2366b30bacB125260Af641031331'
    );
    console.log("ePriceOracleEth address:", ePriceOracleEth.address);
    priceOracleETH = ePriceOracleEth.address;
  }

  const controller = await EController.deploy();
  console.log("controller address:", controller.address);

  if (!el) {
    const testnetEL = await TestnetEL.deploy(
      testnetELArguements.totalSupply_,
      testnetELArguements.name_,
      testnetELArguements.symbol_,
      testnetELArguements.decimals_
    );
    console.log("kovanEl address:", testnetEL.address);
    el = testnetEL.address
  }

  assetTokenELArguments.eController_ = controller.address;
  assetTokenELArguments.el_ = el;
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

  await controller.setEPriceOracle(priceOracleEL, 0);
  await controller.setEPriceOracle(priceOracleETH, 1);
  await controller.setAssetTokens([
    assetTokenEL.address,
    assetTokenEth.address,
  ]);

  exec(`EL=${el}\
    CONTROLLER=${controller.address}\
    PRICE_ORACLE_EL=${priceOracleEL}\
    PRICE_ORACLE_ETH=${priceOracleETH}\
    ASSET_TOKEN_ETH=${assetTokenEth.address}\
    ASSET_TOKEN_EL=${assetTokenEL.address}\
    NETWORK=${hardhat.network.name}\
    yarn ts-node scripts/verify.ts`, (error, stdout, stderr) => {
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
