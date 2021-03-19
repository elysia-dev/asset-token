import { expect } from "chai";
import { AssetTokenEth } from "../typechain/AssetTokenEth"
import expandToDecimals from "./utils/expandToDecimals";
import { ethers, upgrades, waffle } from "hardhat";
import { deployContract } from "ethereum-waffle";
import EControllerArtifact from "../artifacts/contracts/test/EControllerTest.sol/EControllerTest.json"
import { Contract, ContractFactory } from "@ethersproject/contracts";

describe("Upgradeable test", () => {
    let assetTokenEth: Contract;
    let eController: Contract;
    let eControllerUpgraded: Contract;

    let EController: ContractFactory;
    let EControllerUpgraded: ContractFactory
    let AssetTokenEth: ContractFactory
    let AssetTokenEthUpgraded: ContractFactory

    const amount_ = expandToDecimals(10000, 18)
    // 0.005 ether = 1 assetToken
    const price_ = expandToDecimals(5, 15)
    // price * interestRate / (secondsPerYear * blockTime)
    const rewardPerBlock_ = expandToDecimals(237, 6)
    const payment_ = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const coordinate_ = [123, 456]
    const interestRate_ = expandToDecimals(1, 17)
    const cashReserveRatio_ = expandToDecimals(5, 17)
    const name_ = "ExampleAsset"
    const symbol_ = "EA"

    const provider = waffle.provider;

    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        EController = await ethers.getContractFactory("EController", admin);
        EControllerUpgraded = await ethers.getContractFactory("EController", admin);

        AssetTokenEth = await ethers.getContractFactory("AssetTokenEth", admin);
        AssetTokenEthUpgraded = await ethers.getContractFactory("AssetTokenEth", admin);

        eController = await upgrades.deployProxy(EController, {initializer: 'initialize'})
        assetTokenEth = await upgrades.deployProxy(AssetTokenEth, [
            eController.address,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            coordinate_,
            interestRate_,
            cashReserveRatio_,
            name_,
            symbol_,
        ])
        await eController.connect(admin)
            .setAssetTokens([assetTokenEth.address])
    })

    describe(".EController upgrade proxy", async () => {
        beforeEach(async () => {
        })

        context('state variables', async () => {
            it('return variables previously set', async () => {
                eControllerUpgraded = await upgrades.upgradeProxy(eController.address, EControllerUpgraded);
                expect(await eControllerUpgraded.isAssetToken(assetTokenEth.address))
                    .to.be.true
            })
        })

        context('balance', async () => {
            it('should have ether reserves before upgrading', async () => {
                await assetTokenEth.connect(account1).purchase({gasLimit: 999999, value: ethers.utils.parseEther("0.1")})
                const reserve = await provider.getBalance(eController.address)
                eControllerUpgraded = await upgrades.upgradeProxy(eController.address, EControllerUpgraded);
                const reserveNew = await provider.getBalance(eControllerUpgraded.address)
                expect(reserve).to.be.equal(reserveNew)
                console.log(reserve.toString(), reserveNew.toString())
            })

            it('should have ERC20 reserves before upgrading', async () => {})
        })

        context('')
    })

    describe(".AssetTokenEth upgrade proxy", async () => {
        context('state variables', async () => {
            it('return variables previously set', async () => {
            })
        })
        context('balance', async () => {
            it('return variables previously set', async () => {
            })
        })
        context('function', async () => {
            it('return variables previously set', async () => {
            })
        })
    })
})