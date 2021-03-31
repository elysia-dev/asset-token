import hardhat from 'hardhat';
import assetTokenERC20Arguments from "./deployArguments/AssetTokenERC";
import assetTokenEthArguments from "./deployArguments/AssetTokenEth";
import testnetERC20Arguements from "./deployArguments/testnetEL";
import { exec } from "child_process";

let el = process.env.el || '';

async function main() {
  console.log(`${hardhat.network.name} deploy start`);

  const EController = await hardhat.ethers.getContractFactory("EController");
  const AssetTokenERC20 = await hardhat.ethers.getContractFactory("AssetTokenERC");
  const AssetTokenEth = await hardhat.ethers.getContractFactory("AssetTokenEth");
  const TestnetEl = await hardhat.ethers.getContractFactory("TestnetEL")

  const controller = await EController.deploy();
  console.log("controller address:", controller.address);

  if (!el) {
    const testnetEl = await TestnetEl.deploy(
      testnetERC20Arguements.totalSupply_,
      testnetERC20Arguements.name_,
      testnetERC20Arguements.symbol_,
    );
    console.log(`${hardhat.network.name}EL address:`, testnetEl.address);
    el = testnetEl.address
  }

  assetTokenERC20Arguments.eController_ = controller.address;
  assetTokenEthArguments.eController_ = controller.address;

  const assetTokenERC20 = await AssetTokenERC20.deploy(
    assetTokenERC20Arguments.eController_,
    assetTokenERC20Arguments.amount_,
    assetTokenERC20Arguments.price_,
    assetTokenERC20Arguments.rewardPerBlock_,
    assetTokenERC20Arguments.payment_,
    assetTokenERC20Arguments.coordinate_,
    assetTokenERC20Arguments.interestRate_,
    assetTokenERC20Arguments.cashReserveRatio_,
    assetTokenERC20Arguments.name_,
    assetTokenERC20Arguments.symbol_,
  );
  console.log("assetTokenERC20 address", assetTokenERC20.address);

  const assetTokenEth = await AssetTokenEth.deploy(
    assetTokenEthArguments.eController_,
    assetTokenEthArguments.amount_,
    assetTokenEthArguments.price_,
    assetTokenEthArguments.rewardPerBlock_,
    assetTokenEthArguments.payment_,
    assetTokenEthArguments.coordinate_,
    assetTokenEthArguments.interestRate_,
    assetTokenEthArguments.blockRemaining_,
    assetTokenEthArguments.name_,
    assetTokenEthArguments.symbol_,
  );
  console.log("assetTokenEth address", assetTokenEth.address);

  await controller.setAssetTokens([
    assetTokenERC20.address,
    assetTokenEth.address,
  ]);

  exec(`EL=${el}\
    CONTROLLER=${controller.address}\
    ASSET_TOKEN_ETH=${assetTokenEth.address}\
    ASSET_TOKEN_ERC20=${assetTokenERC20.address}\
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

if (!['mainnet', 'kovan', 'binanceTestnet', 'binanceMainnet'].includes(hardhat.network.name)) {
  console.log(`Network shoud be mainnet or kovan only. You sERC20ect ${hardhat.network.name}`);
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
