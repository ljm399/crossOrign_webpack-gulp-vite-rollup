export const add = (a, b) => a + b

const SUB_SHOULD_BE_REMOVED_MARKER = 'SUB_SHOULD_BE_REMOVED_0123456789'

export const sub = (a, b) => {
  const payload = SUB_SHOULD_BE_REMOVED_MARKER.repeat(200)
  return a - b + payload.length
}
