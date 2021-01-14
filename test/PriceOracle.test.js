const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const PriceOracle = artifacts.require('EPriceOracleTest');

const price = '5' + '0'.repeat(18);
const elPrice = '3' + '0'.repeat(16);
const ethPrice = '1' + '0'.repeat(21);
const overFlowNumber = '1' + '0'.repeat(80);

contract('EPriceOracleTest', (accounts) => {
    let priceOracle;

    const [admin, account1] = accounts;

    beforeEach(async () => {
        priceOracle = await PriceOracle.new({from : admin})
    })

    context('.setElPrice', async () => {
        it('Admin can set ElPrice', async () => {
            const setElPriceTx = await priceOracle.setElPrice(elPrice, {from: admin})

            expect(await priceOracle.getElPrice()).to.be.bignumber.equal(elPrice)

            expectEvent(setElPriceTx, 'NewElPrice', {newElPrice: elPrice})
        })

        it('General account cannot set ElPrice', async () => {
            await expectRevert(
                priceOracle.setElPrice(elPrice, {from: account1}),
                "Restricted to admin."
            );
        })
    })

    context('When price is set', async () => {
        beforeEach(async () => {
            await priceOracle.setElPrice(elPrice, {from: admin});
        })

        context('.toElAmount', async () => {
            it('return El amount from asset token amount', async () => {
                expect(await priceOracle.toElAmount(10, price)).to.be.bignumber.equal(
                    (new BN('1' + '0'.repeat(18))).mul(new BN(5000)).div(new BN(3))
                )
            })

            it('throw exception when amount is so big', async () => {
                try {
                    // 2^256 ~= 1e77
                    await priceOracle.toElAmount(overFlowNumber, price);
                    assert.fail("The method should have thrown an error");
                }
                catch (error) {
                    assert.include(error.message, 'overflow');
                }
            })
        })
    })
})
