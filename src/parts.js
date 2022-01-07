import { parse } from './parse.js'
import { direct } from './processor.js'

export default (node, params={}, processor=direct) => {
  let parts = parse(node),
      // throttled for batch update, but - first set is immediate, rest is throttled
      planned,
      update = () => !planned && ( planned = Promise.resolve().then(() => (planned = null, processor.processCallback?.(node, parts, params))) )

  processor.createCallback?.(node, parts, params)
  processor.processCallback?.(node, parts, params)

  return new Proxy(params,  {
    set: (state, k, v) => (state[k] = v, update(), 1),
    deleteProperty: (state,k) => (delete state[k], update())
  })
}