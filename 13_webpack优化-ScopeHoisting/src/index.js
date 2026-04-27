import { add, mul } from './scope/math'
import { formatMsg } from './scope/msg'

const v1 = add(1, 2)
const v2 = mul(v1, 3)

console.log(formatMsg(v2))

