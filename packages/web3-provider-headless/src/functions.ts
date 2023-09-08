import { IKey } from '@veramo/core'
import { ethers } from 'ethers'
import { IRequiredContext } from './types'

export async function getAddressFromAgent(context: IRequiredContext, keyRef: Pick<IKey, 'kid'>): Promise<string> {
  const publicKeyHex = await getKey(context, keyRef).then((key) => key?.publicKeyHex)
  if (!publicKeyHex) {
    throw Error(`Could not retrieve public hex key for ${keyRef}`)
  }
  const address = ethers.utils.computeAddress(`${publicKeyHex.startsWith('0x') ? '' : '0x'}${publicKeyHex}`)
  if (!address || !address.startsWith('0x')) {
    throw Error(`Invalid address ${address} public key for key ${publicKeyHex}`)
  }
  return address
}

export async function getKey(context: IRequiredContext, keyRef: Pick<IKey, 'kid'>): Promise<IKey | undefined> {
  return await context.agent.keyManagerGet({ kid: keyRef.kid })
}
