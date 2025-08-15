import { sha256 } from '@noble/hashes/sha256'
import { sha384, sha512 } from '@noble/hashes/sha512'
import type { HasherSync } from '@sphereon/ssi-types'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString, SupportedEncodings } = u8a

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'
export type TDigestMethod = (input: string, encoding?: typeof SupportedEncodings) => string

export const digestMethodParams = (
  hashAlgorithm: HashAlgorithm
): { hashAlgorithm: HashAlgorithm; digestMethod: TDigestMethod; hash: (data: Uint8Array) => Uint8Array } => {
  if (hashAlgorithm === 'SHA-256') {
    return { hashAlgorithm: 'SHA-256', digestMethod: sha256DigestMethod, hash: sha256 }
  } else if (hashAlgorithm === 'SHA-384') {
    return { hashAlgorithm: 'SHA-384', digestMethod: sha384DigestMethod, hash: sha384 }
  } else {
    return { hashAlgorithm: 'SHA-512', digestMethod: sha512DigestMethod, hash: sha512 }
  }
}

export const shaHasher: HasherSync = (input: string | ArrayBuffer, alg: string): Uint8Array => {
  const hashAlgorithm: HashAlgorithm = alg.includes('384') ? 'SHA-384' : alg.includes('512') ? 'SHA-512' : 'SHA-256'
  return digestMethodParams(hashAlgorithm).hash(typeof input === 'string' ? fromString(input, 'utf-8') : new Uint8Array(input))
}

const sha256DigestMethod = (input: string, encoding: typeof SupportedEncodings = 'base16'): string => {
  return toString(sha256(fromString(input, 'utf-8')), encoding)
}

const sha384DigestMethod = (input: string, encoding: typeof SupportedEncodings = 'base16'): string => {
  return toString(sha384(fromString(input, 'utf-8')), encoding)
}

const sha512DigestMethod = (input: string, encoding: typeof SupportedEncodings = 'base16'): string => {
  return toString(sha512(fromString(input, 'utf-8')), encoding)
}

/*
// PKCS#1 (PSS) mask generation function
function pss_mgf1_str(seed, len, hash) {
    var mask = '', i = 0;

    while (mask.length < len) {
        mask += hextorstr(hash(rstrtohex(seed + String.fromCharCode.apply(String, [
                (i & 0xff000000) >> 24,
                (i & 0x00ff0000) >> 16,
                (i & 0x0000ff00) >> 8,
                i & 0x000000ff]))));
        i += 1;
    }

    return mask;
}

 */

/*

/!**
 * Generate mask of specified length.
 *
 * @param {String} seed The seed for mask generation.
 * @param maskLen Number of bytes to generate.
 * @return {String} The generated mask.
 *!/
export const mgf1 = (dm: TDigestMethod, seed: string, maskLen: number) => {
  /!* 2. Let T be the empty octet string. *!/
  var t = new forge.util.ByteBuffer();

  /!* 3. For counter from 0 to ceil(maskLen / hLen), do the following: *!/
  var len = Math.ceil(maskLen / md.digestLength);
  for(var i = 0; i < len; i++) {
    /!* a. Convert counter to an octet string C of length 4 octets *!/
    var c = new forge.util.ByteBuffer();
    c.putInt32(i);

    /!* b. Concatenate the hash of the seed mgfSeed and C to the octet
     * string T: *!/
    md.start();
    md.update(seed + c.getBytes());
    t.putBuffer(md.digest());
  }

  /!* Output the leading maskLen octets of T as the octet string mask. *!/
  t.truncate(t.length() - maskLen);
  return t.getBytes();
}
*/
