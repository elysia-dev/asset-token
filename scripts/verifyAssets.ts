import hardhat from 'hardhat';
import { exec } from "child_process";

// Deployscript Result
const txResult = `
controller address:0x5b1Df4d7fAc33B24a8DEF3499ACAE0347AaB31a7
assetTokenBlue2 address:0x7Aa1BF2f7e42a94b68f4c4Dfc6761ab096bA387e
assetTokenBlue3EL address:0xbbe88f80628BA092b833e6B1804Ed7fc97E334D4
assetTokenBlue3Eth address:0x3206A51f6b129F4E0b23d3064753e58582724aF3
`;

const controller = '0x5b1Df4d7fAc33B24a8DEF3499ACAE0347AaB31a7'
const assetTokenBlue3ETH = '0xC4790246bCbE3e9026235307E53aCE5322496557'

exec(`CONTROLLER=${controller} yarn hardhat verify --network ${hardhat.network.name} --constructor-args scripts/verifyArguments/ELAB3ETH.js ${assetTokenBlue3ETH}`, (error, stdout, stderr) => {
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