import hardhat from 'hardhat';
import { exec } from "child_process";

const el = "0x2781246fe707bb15cee3e5ea354e2154a2877b16";
// Deployscript Result
const txResult = `
ePriceOracleEL:0x9b234029d72B3B5061F1b743CDE1471A88056D88
ePriceOracleEth:0xC2d1cEC44E1689c7655F103A4795941496002566
controller:0xE2BF90b946C4cBBCF6Db65023C4567D2471A970B
assetTokenEL:0x6D9d6908767f08B54f557071AAE628d1f836Ace4
assetTokenEth:0xdf18B7561b9e82379120878BFFd6545D0b0FdC10
`;

const [
  priceOracleEl,
  priceOracleEth,
  controller,
  assetTokenEl,
  assetTokenEth
] = txResult.split('\n').filter((body) => body).map((result) => result.split(':')[1]);

/*
// Verify Controller
exec(`yarn hardhat verify --network ${hardhat.network.name} ${controller}`, (error, stdout, stderr) => {
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

// Verify PriceOracleEL
exec(`yarn hardhat verify --network ${hardhat.network.name} ${priceOracleEl}`, (error, stdout, stderr) => {
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

// Verify PriceOracleEth
exec(`yarn hardhat verify --network ${hardhat.network.name} --constructor-args scripts/verifyArguments/EPriceOracleEthVerify.js ${priceOracleEth}`, (error, stdout, stderr) => {
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
*/

// Verify AssetTokenEl
exec(`CONTROLLER=${controller} EL=${el} yarn hardhat verify --network ${hardhat.network.name} --constructor-args scripts/verifyArguments/AssetTokenELVerify.js ${assetTokenEl}`, (error, stdout, stderr) => {
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

// Verify AssetTokenEth
exec(`CONTROLLER=${controller} yarn hardhat verify --network ${hardhat.network.name} --constructor-args scripts/verifyArguments/AssetTokenEthVerify.js ${assetTokenEth}`, (error, stdout, stderr) => {
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