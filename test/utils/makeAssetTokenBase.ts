import { AssetTokenBaseTest } from "../../typechain/AssetTokenBaseTest"
import AssetTokenBaseArtifact from "../../artifacts/contracts/test/AssetTokenBaseTest.sol/AssetTokenBaseTest.json"
import { BigNumber, Contract, Wallet } from "ethers";
import { deployContract } from "ethereum-waffle";
import expandToDecimals from "./expandToDecimals";

async function makeAssetTokenBase({
    from,
    eController_ = "",
    amount_ = 10000,
    price_ = expandToDecimals(5, 18),
    rewardPerBlock_ = expandToDecimals(237, 6),
    payment_ = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    coordinate_ = [expandToDecimals(123, 0), expandToDecimals(456, 0)],
    interestRate_ = expandToDecimals(1, 17),
    cashReserveRatio_ = expandToDecimals(5, 17),
    name_ = "ExampleAsset",
    symbol_ = "EA",
}: {
    from: Wallet
    eController_: string
    amount_?: number
    price_?: BigNumber
    rewardPerBlock_?: BigNumber
    payment_?: string,
    coordinate_?: Array<BigNumber>,
    interestRate_?: BigNumber,
    cashReserveRatio_?: BigNumber,
    name_?: string,
    symbol_?: string
}): Promise<AssetTokenBaseTest> {

    let assetTokenBase: AssetTokenBaseTest;

    assetTokenBase = (await deployContract(
        from,
        AssetTokenBaseArtifact,
        [
            eController_,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            coordinate_,
            interestRate_,
            cashReserveRatio_,
            name_,
            symbol_,
        ]
    )) as AssetTokenBaseTest;

    return assetTokenBase;
}

export default makeAssetTokenBase