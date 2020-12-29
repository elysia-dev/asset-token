const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const AssetToken = artifacts.require('AssetToken');
const ELToken = artifacts.require('ELToken');

const to18DecimalBN = (amount) => {
    return new BN(amount.toString() + '0'.repeat(18));
}

contract('AssetToken', ([deployer, admin, account1, account2]) => {
    const price = '5' + '0'.repeat(18);
    const elPrice = '3' + '0'.repeat(16);
    const rewardPerBlock = '5' + '0'.repeat(14);
    const elTotalSupplyString = '7000000000' + '0'.repeat(18);
    const latitude = '37' + '0'.repeat(18);
    const longitude = '127' + '0'.repeat(18);
    const assetPrice = '5' + '0'.repeat(21);
    const interestRate = '1' + '0'.repeat(17);

    let el;

    beforeEach(async () => {
        el = await ELToken.new('Elysia', 'EL', {from: deployer})
    })

    context('AssetToken.new', () => {
        it('has given data', async () => {
            const assetToken = await AssetToken.new(
                el.address,
                'name',
                'symbol',
                0,
                10000,
                admin,
                elPrice,
                price,
                rewardPerBlock,
                latitude,
                longitude,
                assetPrice,
                interestRate,
                {from : admin}
            )

            expect(await assetToken.name()).to.equal('name')
            expect(await assetToken.symbol()).to.equal('symbol')
            expect(await assetToken.totalSupply()).to.be.bignumber.equal('10000')
            expect(await assetToken.getPrice()).to.be.bignumber.equal(new BN(price));
            expect(await assetToken.getElPrice()).to.be.bignumber.equal(new BN(elPrice));
            expect(await assetToken.getRewardPerBlock()).to.be.bignumber.equal(new BN(rewardPerBlock));
        })
    })

    context('AssetToken is deployed', () => {
        let assetToken;
        const totalSupply = 10000;

        beforeEach(async () => {
            assetToken = await AssetToken.new(
                el.address,
                'name',
                'symbol',
                0,
                totalSupply,
                admin,
                elPrice,
                price,
                rewardPerBlock,
                latitude,
                longitude,
                assetPrice,
                interestRate,
                {from : admin}
            )
        })

        describe('.purchase', async () => {
            it('if account has sufficient allowed el balance, can purchase token', async () => {
                await el.transfer(account1, to18DecimalBN(10000).toString(), {from: deployer});
                await el.approve(assetToken.address, elTotalSupplyString, {from: account1})

                await assetToken.purchase(20, {from: account1});

                expect(await assetToken.balanceOf(account1)).to.be.bignumber.equal(new BN(20));;

                expect(
                    await assetToken.balanceOf(assetToken.address)
                ).to.be.bignumber.equal(new BN(totalSupply - 20));

                expect(await el.balanceOf(assetToken.address)).to.be.bignumber.equal(
                    await assetToken.toElAmount(20)
                );

                expect(await el.balanceOf(account1)).to.be.bignumber.equal(
                    to18DecimalBN(10000).sub(await assetToken.toElAmount(20))
                );
            })

            it('if account does not have sufficient allowed el balance, transfer is failed', async () => {
                try {
                    await assetToken.purchase(10, {from: account1});
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Insufficient');
                }
            })

            it('if account does not have sufficient el balance, transfer is failed', async () => {
                await el.approve(assetToken.address, elTotalSupplyString, {from: account1})

                try {
                    await assetToken.purchase(10, {from: account1});
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Insufficient');
                }
            })
        })

        describe('.refund', async () => {
            it('if account and contract has sufficient balance, refund token', async () => {
                await el.transfer(account1, to18DecimalBN(10000).toString(), {from: deployer});
                await el.transfer(assetToken.address, to18DecimalBN(10000).toString(), {from: deployer});
                await el.approve(assetToken.address, elTotalSupplyString, {from: account1})
                await assetToken.purchase(20, {from: account1});

                await assetToken.refund(10, {from: account1});

                expect(await assetToken.balanceOf(account1)).to.be.bignumber.equal(new BN(10));;

                expect(
                    await assetToken.balanceOf(assetToken.address)
                ).to.be.bignumber.equal(new BN(totalSupply - 10));

                // INFO
                // Below test code is tricky.
                // All variables in contract is integer, last number can be missing.
                // This contract usually get 1 * 10^-18 el more than expected.
                // So BN's eq operation is always failed.
                // This test code use lte or gte operation for test with very small value.
                expect(
                    (await el.balanceOf(assetToken.address)).sub(to18DecimalBN(10000)).add(await assetToken.toElAmount(10))
                ).to.be.bignumber.gte(new BN(1));

                expect(
                    (await el.balanceOf(account1)).sub(to18DecimalBN(10000)).sub(await assetToken.toElAmount(10))
                ).to.be.bignumber.lte(new BN(1));
            })

            it('if account does not have sufficient allowed balance, transfer is failed', async () => {
                try {
                    await assetToken.refund(10, {from: account1});
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Insufficient');
                }
            })

            it('if account does not have sufficient balance, transfer is failed', async () => {
                await assetToken.approve(assetToken.address, totalSupply, {from: account1})

                try {
                    await assetToken.refund(10, {from: account1});
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Insufficient');
                }
            })
        })

        describe('.claimReward', async () => {
            beforeEach(async () => {
                await el.transfer(account1, to18DecimalBN(10000).toString(), {from: deployer});
                await el.transfer(assetToken.address, to18DecimalBN(10000).toString(), {from: deployer});
                await el.approve(assetToken.address, elTotalSupplyString, {from: account1});

                this.firstBlock = (await assetToken.purchase(20, {from: account1})).receipt.blockNumber;

                await assetToken.addAddressToWhitelist(account1, {from: admin});
                await el.transfer(account2, await el.balanceOf(account1), {from: account1});

                this.secondBlock = (await assetToken.transfer(account2, 10, {from: account1})).receipt.blockNumber;
                this.thirdBlock = (await assetToken.transfer(account2, 10, {from: account1})).receipt.blockNumber;
            })

            it('whitelisted account can claim reward.', async () => {
                await assetToken.claimReward({from: account1})

                const expectedReward = to18DecimalBN(
                    20 * (this.secondBlock - this.firstBlock) +
                    10 * (this.thirdBlock - this.secondBlock)
                ).mul(new BN(rewardPerBlock))
                    .div(new BN(totalSupply))
                    .div(new BN(elPrice));

                expect(await el.balanceOf(account1)).to.be.bignumber.equal(expectedReward);
                expect(await assetToken.getReward(account1)).to.be.bignumber.equal(new BN(0));
            })

            it('un whitelisted account cannot claim reward.', async () => {
                expect(await assetToken.getReward(account2)).not.to.be.bignumber.equal(new BN(0));

                try {
                    await assetToken.claimReward({from: account2})
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Restricted');
                }
            })
        })

        describe('.withdrawElToAdmin', async () => {
            beforeEach(async () => {
                await el.transfer(assetToken.address, to18DecimalBN(10000).toString(), {from: deployer});
            })

            it('admin can withdrwal all el.', async () => {
                await assetToken.withdrawElToAdmin({from: admin});

                expect(await el.balanceOf(assetToken.address)).to.be.bignumber.equal(new BN(0));
                expect(await el.balanceOf(admin)).to.be.bignumber.equal(new BN(to18DecimalBN(10000)));
            })

            it('account cannot withdrwa el.', async () => {
                try {
                    await assetToken.withdrawElToAdmin({from: account1})
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'Restricted');
                }
            })
        })
    })
})
