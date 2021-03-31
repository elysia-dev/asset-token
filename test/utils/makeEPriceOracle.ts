import { EPriceOracleTest } from "../../typechain/EPriceOracleTest"
import { EControllerTest } from "../../typechain/EControllerTest";
import EPriceOracleTestArtifact from "../../artifacts/contracts/test/EPriceOracleTest.sol/EPriceOracleTest.json"
import { BigNumber, Wallet } from "ethers";
import { deployContract } from "ethereum-waffle";
import expandToDecimals from "./expandToDecimals";
import { Contract } from "@ethersproject/contracts";

// mocking and set price oracle contract
// Default payment = eth
// Default price = 1000 dollars (1000 * 10^18)
async function makeEPriceOracleTest({
    from,
    eController,
    payment = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    price = expandToDecimals(1000, 18),
}: {
    from: Wallet
    eController: EControllerTest | Contract
    payment?: string
    price?: BigNumber
}): Promise<EPriceOracleTest> {

    let ePriceOracleTest: EPriceOracleTest;

    ePriceOracleTest = (await deployContract(
        from,
        EPriceOracleTestArtifact,
        [
            price
        ]
    )) as EPriceOracleTest;

    await eController.connect(from).setEPriceOracle(ePriceOracleTest.address, payment);

    return ePriceOracleTest;
}

export default makeEPriceOracleTest