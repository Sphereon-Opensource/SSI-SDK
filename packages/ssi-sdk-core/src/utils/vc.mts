import { IAgentContext, IDataStore, IDataStoreORM, VerifiableCredential } from '@veramo/core'

export async function getCredentialByIdOrHash(
  context: IAgentContext<IDataStore & IDataStoreORM>,
  idOrHash: string
): Promise<{
  id: string
  hash?: string
  vc?: VerifiableCredential
}> {
  let vc: VerifiableCredential
  let hash: string
  const uniqueVCs = await context.agent.dataStoreORMGetVerifiableCredentials({
    where: [
      {
        column: 'id',
        value: [idOrHash],
        op: 'Equal',
      },
    ],
  })
  if (uniqueVCs.length === 0) {
    hash = idOrHash
    vc = await context.agent.dataStoreGetVerifiableCredential({ hash })
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
