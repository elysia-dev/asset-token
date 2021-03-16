import hardhat from 'hardhat';
import { exec } from "child_process";

const el = "0xea26b65ed9571832a7f056ab7e6b7e755bb1d7be";
// Deployscript Result
const txResult = `
controller address: 0xbc0d9B8f91F1cCD28cd6966bf3C7c692DeF23604
assetTokenEL address 0xa1e8DAe38a6164d7D8721E98c2dd5B7ba86a16d9
assetTokenEth address 0xa212F0d560c90a2C48Cc2b0B5C05ab4EE7007Ab00
`;

const [
  controller,
  assetTokenERC,
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

// Verify AssetTokenERC
exec(`CONTROLLER=${controller} EL=${el} yarn hardhat verify --network ${hardhat.network.name} --constructor-args scripts/verifyArguments/AssetTokenERCVerify.js ${assetTokenERC}`, (error, stdout, stderr) => {
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