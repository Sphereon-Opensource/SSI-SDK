import { DomainLinkageCredential, IDidConfigurationResource, ISignedDomainLinkageCredential } from '@sphereon/wellknown-dids-client'
import { VerifiableCredential } from '@veramo/core'
import { Credential, Identifier, Claim } from '@veramo/data-store'
import { asArray, computeEntryHash, extractIssuer } from '@veramo/utils'
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BaseEntity } from 'typeorm'

@Entity('DidConfigurationResource')
export class DidConfigurationResourceEntity extends BaseEntity {
  @PrimaryColumn({ nullable: false })
  origin!: string

  @Column({ nullable: false })
  context!: string

  // TODO cascade of delete should be true when the VC is only attached to one DID configuration resource
  @ManyToMany(() => Credential, (credential: Credential) => credential.hash, { nullable: false, cascade: true, onDelete: 'NO ACTION' })
  @JoinTable({ name: 'DidConfigurationResourceCredentials' })
  linkedDids!: Array<Credential>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date
}

export const didConfigurationResourceFrom = (didConfigurationResource: DidConfigurationResourceEntity): IDidConfigurationResource => {
  return {
    '@context': didConfigurationResource.context,
    linked_dids: linkedDidsFrom(didConfigurationResource.linkedDids),
  }
}

const linkedDidsFrom = (credentials: Array<Credential>): Array<DomainLinkageCredential> => {
  return credentials.map((credential: Credential) =>
    credential?.raw?.proof?.type === 'JwtProof2020' && typeof credential?.raw?.proof?.jwt === 'string'
      ? credential.raw.proof.jwt
      : (credential.raw as ISignedDomainLinkageCredential),
  )
}

export const createCredentialEntity = (vci: VerifiableCredential): Credential => {
  const vc = vci
  const credential = new Credential()
  credential.context = asArray(vc['@context'])
  credential.type = asArray(vc.type || [])
  credential.id = vc.id

  if (vc.issuanceDate) {
    credential.issuanceDate = new Date(vc.issuanceDate)
  }

  if (vc.expirationDate) {
    credential.expirationDate = new Date(vc.expirationDate)
  }

  const issuer = new Identifier()
  issuer.did = extractIssuer(vc)
  credential.issuer = issuer

  if (vc.credentialSubject.id) {
    const subject = new Identifier()
    subject.did = vc.credentialSubject.id
    credential.subject = subject
  }
  credential.claims = []
  for (const type in vc.credentialSubject) {
    if (vc.credentialSubject.hasOwnProperty(type)) {
      const value = vc.credentialSubject[type]

      if (type !== 'id') {
        const isObj = typeof value === 'function' || (typeof value === 'object' && !!value)
        const claim = new Claim()
        claim.hash = computeEntryHash(JSON.stringify(vc) + type)
        claim.type = type
        claim.value = isObj ? JSON.stringify(value) : value
        claim.isObj = isObj
        claim.issuer = credential.issuer
        claim.subject = credential.subject
        claim.expirationDate = credential.expirationDate
        claim.issuanceDate = credential.issuanceDate
        claim.credentialType = credential.type
        claim.context = credential.context
        credential.claims.push(claim)
      }
    }
  }

  credential.raw = vci
  return credential
}
