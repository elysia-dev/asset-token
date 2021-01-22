
import { Address } from "cluster"
import { AssetTokenBase } from "../../typechain/AssetTokenBase"
import { EController } from "../../typechain/EController"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import EControllerArtifact from "../../artifacts/contracts/EController.sol/EController.json"
import AssetTokenBaseArtifact from "../../artifacts/contracts/AssetTokenBase.sol/AssetTokenBase.json"
import { BigNumber, Wallet } from "ethers";
import { deployContract } from "ethereum-waffle";

export async function makeAssetTokenBase({
    from,
    eController_ = "", //아직 eController가 없어요
    amount_ = 10000,
    price_ = expandToDecimals(5, 18),
    rewardPerBlock_ = expandToDecimals(5, 14),
    payment_ = 0,
    latitude_ = 123,
    longitude_ = 456,
    assetPrice_ = expandToDecimals(5, 21),
    interestRate_ = expandToDecimals(1, 17),
    name_ = "ExampleAsset",
    symbol_ = "EA",
    decimals_ = 0
}: {
    from: Wallet
    eController_?: string
    amount_?: number
    price_?: BigNumber
    rewardPerBlock_?: BigNumber
    payment_?: number
    latitude_?: number
    longitude_?: number,
    assetPrice_?: BigNumber,
    interestRate_?: BigNumber,
    name_?: string,
    symbol_?: string
    decimals_?: number
}): Promise<AssetTokenBase> {

    let assetTokenBase: AssetTokenBase;

    assetTokenBase = (await deployContract(
        from,
        AssetTokenBaseArtifact,
        [
            eController_,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            latitude_,
            longitude_,
            assetPrice_,
            interestRate_,
            name_,
            symbol_,
            decimals_,
        ]
    )) as AssetTokenBase

    return assetTokenBase;
}

export function expandToDecimals(n: number, m: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(m))
  }