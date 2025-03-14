import { defaultHasher as defaultHasherOrig, sha256 as sha256Orig } from '@sphereon/ssi-types'

// re-export as these where here before
export const sha256 = sha256Orig
export const shaHasher = defaultHasherOrig
export const defaultHasher = defaultHasherOrig
