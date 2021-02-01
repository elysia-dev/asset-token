import { BigNumber } from "ethers";

function expandToDecimals(n: number, m: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(m))
}

export default expandToDecimals