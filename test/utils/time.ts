
import { waffle } from "hardhat";

export async function advanceBlock() {
    return waffle.provider.send("evm_mine", [])
}

export async function advanceBlockTo(to: number) {
    for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
      await advanceBlock()
    }
  }