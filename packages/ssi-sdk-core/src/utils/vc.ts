import { IAgentContext, VerifiableCredential } from '@veramo/core'
import { ICredentialManager, DigitalCredential } from '@sphereon/ssi-sdk.credential-manager'

export async function getCredentialByIdOrHash(
  context: IAgentContext<ICredentialManager>,
  idOrHash: string,
): Promise<{
  id: string
  hash?: string
  vc?: VerifiableCredential
}> {
  let vc: DigitalCredential
  let hash: string
  const uniqueVCs = await context.agent.crmGetCredentials({
    filter: [{ id: idOrHash }],
  })
  if (uniqueVCs.length === 0) {
    hash = idOrHash
    vc = await context.agent.crmGetCredentials({
      filter: [{ hash: hash }],
    })
  } else {
    const uniqueVC = uniqueVCs[0]
    hash = uniqueVC.hash
    vc = uniqueVC.verifiableCredential
  }

  return {
    vc,
    id: idOrHash,
    hash,
  }
}
