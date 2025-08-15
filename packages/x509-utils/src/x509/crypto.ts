import { webcrypto } from 'node:crypto'
export const globalCrypto = (setGlobal: boolean, suppliedCrypto?: webcrypto.Crypto): webcrypto.Crypto => {
  let webcrypto: webcrypto.Crypto
  if (typeof suppliedCrypto !== 'undefined') {
    webcrypto = suppliedCrypto
  } else if (typeof crypto !== 'undefined') {
    webcrypto = crypto
  } else if (typeof global.crypto !== 'undefined') {
    webcrypto = global.crypto
  } else {
    // @ts-ignore
    if (typeof global.window?.crypto?.subtle !== 'undefined') {
      // @ts-ignore
      webcrypto = global.window.crypto
    } else {
      // @ts-ignore
      webcrypto = require('crypto') as webcrypto.Crypto
    }
  }
  if (setGlobal) {
    global.crypto = webcrypto
  }

  return webcrypto
}
