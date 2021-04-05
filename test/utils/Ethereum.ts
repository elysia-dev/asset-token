import { BigNumber } from "ethers";
import { waffle } from "hardhat";

export function expandToDecimals(n: number, m: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(m))
}

export async function advanceBlock() {
    return waffle.provider.send("evm_mine", [])
}

export async function advanceBlockTo(to: number) {
    for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
      await advanceBlock()
    }
  }