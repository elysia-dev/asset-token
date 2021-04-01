import { expect } from "chai";
import { ethers, upgrades, waffle } from "hardhat";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { expandToDecimals } from "./utils/Ethereum";
import makeEPriceOracleTest from "./utils/makeEPriceOracle";
import { EPriceOracleTest } from "../typechain/EPriceOracleTest";

describe("Upgradeable test", () => {
    let assetTokenEth: Contract;
    let assetTokenEthUpgraded: Contract;
    let eController: Contract;
    let eControllerUpgraded: Contract;

    let EController: ContractFactory;
    let EControllerUpgraded: ContractFactory
    let AssetTokenEth: ContractFactory
    let AssetTokenEthUpgraded: ContractFactory

    const amount_ = expandToDecimals(10000, 18)
    const price_ = expandToDecimals(5, 18)
    const rewardPerBlock_ = expandToDecimals(237, 6)
    const payment_ = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const coordinate_ = [123, 456]
    const interestRate_ = expandToDecimals(1, 17)
    const blockRemaining_ = 31530000 / 3
    const name_ = "ExampleAsset"
    const symbol_ = "EA"

    const provider = waffle.provider;

    let ePriceOracleTestEth: EPriceOracleTest;

    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        EController = await ethers.getContractFactory("EController", admin);
        EControllerUpgraded = await ethers.getContractFactory("EController", admin);

        AssetTokenEth = await ethers.getContractFactory("AssetTokenEth", admin);
        AssetTokenEthUpgraded = await ethers.getContractFactory("AssetTokenEth", admin);

        eController = await upgrades.deployProxy(EController, { initializer: 'initialize' })
        assetTokenEth = await upgrades.deployProxy(AssetTokenEth, [
            eController.address,
            amount_,
            price_,
            rewardPerBlock_,
            payment_,
            coordinate_,
            interestRate_,
            blockRemaining_,
            name_,
            symbol_,
        ])
        await eController.connect(admin)
            .setAssetTokens([assetTokenEth.address])

        ePriceOracleTestEth = await makeEPriceOracleTest({
            from: admin,
            eController: eController
        })
    })

    describe(".EController upgrade proxy", async () => {
        context('state variables', async () => {
            it('return variables previously set', async () => {
                eControllerUpgraded = await upgrades.upgradeProxy(eController.address, EControllerUpgraded);
                expect(await eControllerUpgraded.isAssetToken(assetTokenEth.address))
                    .to.be.true
            })
        })

        context('balance', async () => {
            it('should have ether reserves before upgrading', async () => {
                await assetTokenEth.connect(account1).purchase({ gasLimit: 999999, value: ethers.utils.parseEther("0.1") })
                const reserve = await provider.getBalance(eController.address)
                eControllerUpgraded = await upgrades.upgradeProxy(eController.address, EControllerUpgraded);
                const reserveNew = await provider.getBalance(eControllerUpgraded.address)
                expect(reserve).to.be.equal(reserveNew)
            })

            it('should have ERC20 reserves before upgrading', async () => { })
        })
    })

    describe(".AssetTokenEth upgrade proxy", async () => {
        context('state variables', async () => {
            it('return variables previously set', async () => {
                assetTokenEthUpgraded = await upgrades.upgradeProxy(assetTokenEth.address, AssetTokenEthUpgraded);
                expect(await assetTokenEthUpgraded.totalSupply()).to.equal(amount_)
                expect(await assetTokenEthUpgraded.price()).to.equal(price_)
                expect(await assetTokenEthUpgraded.rewardPerBlock()).to.equal(rewardPerBlock_)
                expect(await assetTokenEthUpgraded.getPayment()).to.equal(payment_)
                expect(await assetTokenEthUpgraded.latitude()).to.equal(coordinate_[0])
                expect(await assetTokenEthUpgraded.longitude()).to.equal(coordinate_[1])
                expect(await assetTokenEthUpgraded.interestRate()).to.equal(interestRate_)
                expect(await assetTokenEthUpgraded.blockRemaining()).to.equal(blockRemaining_)
                expect(await assetTokenEthUpgraded.name()).to.equal(name_)
                expect(await assetTokenEthUpgraded.symbol()).to.equal(symbol_)
            })
        })

        context('balance', async () => {
            it('should have token reserves and user balances same as before upgrade', async () => {
                await assetTokenEth.connect(account1).purchase({ gasLimit: 999999, value: ethers.utils.parseEther("0.1") })
                assetTokenEthUpgraded = await upgrades.upgradeProxy(assetTokenEth.address, AssetTokenEthUpgraded);
                expect(await assetTokenEthUpgraded.balanceOf(account1.address))
                    .to.be.equal(expandToDecimals(20, 18));
                expect(await assetTokenEthUpgraded.balanceOf(assetTokenEth.address))
                    .to.be.equal(amount_.sub(expandToDecimals(20, 18)));
            })

            it('should deposit reserve to the right proxy admin after upgrade', async () => {
                assetTokenEthUpgraded = await upgrades.upgradeProxy(assetTokenEth.address, AssetTokenEthUpgraded);
                await assetTokenEth.connect(account1).purchase({ gasLimit: 999999, value: ethers.utils.parseEther("0.1") })
                const reserveNew = await provider.getBalance(eControllerUpgraded.address)
                expect(reserveNew).to.be.equal(ethers.utils.parseEther("0.1"))
            })
        })
    })
})