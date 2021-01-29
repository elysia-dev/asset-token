import hardhat from 'hardhat';
import { exec } from "child_process";

const el = "0x2781246fe707bb15cee3e5ea354e2154a2877b16";
// Deployscript Result
const txResult = `
ePriceOracleEL:0x4335AFb7CE6C815eBaAb4f9A3F3fBd51b686480e
ePriceOracleEth:0x6E8DfFA9dcc2c41D6fa2888eb0E479F9e4F4846E
controller:0x99fB964b68F08846D11537005d9Ab272D740A19a
assetTokenEL:0x4ADDFEE8F0F6af9d1d67D6328801bee3D70722eB
assetTokenEth:0x7a747c0b66FBc2597C71fD0cEd772BD0d8Cc130b
`;

const [
  priceOracleEl,
  priceOracleEth,
  controller,
  assetTokenEl,
  assetTokenEth
] = txResult.split('\n').filter((body) => body).map((result) => result.split(':')[1]);

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