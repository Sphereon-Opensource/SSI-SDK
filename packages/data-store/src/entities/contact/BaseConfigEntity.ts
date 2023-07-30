import { BaseEntity, Entity, PrimaryGeneratedColumn, TableInheritance } from 'typeorm'
import {
  BasicConnectionConfig,
  ConnectionConfig,
  IDidAuthConfig,
  IOpenIdConfig
} from '../../types'
import { OpenIdConfigEntity } from './OpenIdConfigEntity'
import { DidAuthConfigEntity } from './DidAuthConfigEntity'

@Entity('BaseConfigEntity') // FIXME rename it to 'BaseConfig'
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string
}

export const configFrom = (config: BaseConfigEntity): ConnectionConfig => {
  // @ts-ignore
  if (isOpenIdConfig(config)) {
    return openIdConfigFrom(<OpenIdConfigEntity>config)
    // @ts-ignore
  } else if (isDidAuthConfig(config)) {
    // @ts-ignore
    return didAuthConfigFrom(<DidAuthConfigEntity>config)
  }

  throw new Error('config type not supported')
}

export const openIdConfigFrom = (config: OpenIdConfigEntity): IOpenIdConfig => {
  return {
    id: config.id,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    scopes: config.scopes,
    issuer: config.issuer!, // FIXME
    redirectUrl: config.redirectUrl,
    dangerouslyAllowInsecureHttpRequests: config.dangerouslyAllowInsecureHttpRequests,
    clientAuthMethod: config.clientAuthMethod,
  }
}

export const didAuthConfigFrom = (config: DidAuthConfigEntity): IDidAuthConfig => {
  return {
    id: config.id,
    identifier: { did: config.identifier, provider: '', keys: [], services: [] },
    stateId: '', // FIXME
    redirectUrl: config.redirectUrl,
    sessionId: config.sessionId,
  }
}

export const isOpenIdConfig = (config: BasicConnectionConfig): config is IOpenIdConfig =>
  'clientSecret' in config && 'issuer' in config && 'redirectUrl' in config

export const isDidAuthConfig = (config: BasicConnectionConfig): config is IDidAuthConfig =>
  'identifier' in config && 'redirectUrl' in config && 'sessionId' in config
