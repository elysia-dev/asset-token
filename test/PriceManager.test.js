const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const PriceManagerTest = artifacts.require('PriceManagerTest');

const price = '5' + '0'.repeat(18);
const elPrice = '3' + '0'.repeat(16);
const overFlowNumber = '1' + '0'.repeat(80);

contract('PriceManager', (accounts) => {
    let priceManager;

    const [admin, account1] = accounts;

    beforeEach(async () => {
        priceManager = await PriceManagerTest.new('name', 'symbol', 0, 10000, admin, {from : admin})
    })

    context('.setElPrice', async () => {
        it('Admin can set ElPrice', async () => {
            const setElPriceTx = await priceManager.setElPrice(elPrice, {from: admin})

            expect(await priceManager.getElPrice()).to.be.bignumber.equal(elPrice)

            expectEvent(setElPriceTx, 'NewElPrice', {newElPrice: elPrice})
        })

        it('General account cannot set ElPrice', async () => {
            await expectRevert(
                priceManager.setElPrice(elPrice, {from: account1}),
                "Restricted to admin."
            );
        })
    })

    context('.setPrice', async () => {
        it('Admin can set price', async () => {
            const setPriceTx = await priceManager.setPrice(price, {from: admin})

            expect(await priceManager.getPrice()).to.be.bignumber.equal(new BN(price))

            expectEvent(setPriceTx, 'NewPrice', {newPrice: price})
        })

        it('General account cannot set price', async () => {
            await expectRevert(
                priceManager.setPrice(price, {from: account1}),
                "Restricted to admin."
            );
        })
    })

    context('When price is set', async () => {
        beforeEach(async () => {
            await priceManager.setPrice(price, {from: admin});
            await priceManager.setElPrice(elPrice, {from: admin});
        })

        context('.toElAmount', async () => {
            it('return El amount from asset token amount', async () => {
                expect(await priceManager.toElAmount(10)).to.be.bignumber.equal(
                    (new BN('1' + '0'.repeat(18))).mul(new BN(5000)).div(new BN(3))
                )
            })

            it('throw exception when amount is so big', async () => {
                try {
                    // 2^256 ~= 1e77
                    await priceManager.toElAmount(overFlowNumber);
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'overflow');
                }
            })
        })
    })
})
