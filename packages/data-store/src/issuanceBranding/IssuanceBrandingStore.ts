import Debug from 'debug'
import { DataSource, In, Not, Repository } from 'typeorm'
import { OrPromise } from '@sphereon/ssi-types'
import { IssuerBrandingEntity, issuerBrandingEntityFrom } from '../entities/issuanceBranding/IssuerBrandingEntity'
import { CredentialBrandingEntity, credentialBrandingEntityFrom } from '../entities/issuanceBranding/CredentialBrandingEntity'
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from '../entities/issuanceBranding/CredentialLocaleBrandingEntity'
import { BaseLocaleBrandingEntity } from '../entities/issuanceBranding/BaseLocaleBrandingEntity'
import { AbstractIssuanceBrandingStore } from './AbstractIssuanceBrandingStore'
import {
  IAddCredentialBrandingArgs,
  IAddIssuerBrandingArgs,
  IGetCredentialBrandingArgs,
  IGetIssuerBrandingArgs,
  ICredentialBranding,
  IIssuerBranding,
  ILocaleBranding,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerLocaleBrandingArgs,
  IRemoveCredentialBrandingArgs,
  IRemoveCredentialLocaleBrandingArgs,
  IRemoveIssuerBrandingArgs,
  IRemoveIssuerLocaleBrandingArgs,
  IUpdateCredentialBrandingArgs,
  IUpdateCredentialLocaleBrandingArgs,
  IUpdateIssuerBrandingArgs,
  IUpdateIssuerLocaleBrandingArgs,
  IBasicLocaleBranding,
} from '../types'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from '../entities/issuanceBranding/IssuerLocaleBrandingEntity'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:issuance-branding-store')

export class IssuanceBrandingStore extends AbstractIssuanceBrandingStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  // Credential Branding

  public addCredentialBranding = async (args: IAddCredentialBrandingArgs): Promise<ICredentialBranding> => {
    const credentialBrandingEntity: CredentialBrandingEntity = credentialBrandingEntityFrom(args)
    // debug('Adding contact', name)
    const createdResult: CredentialBrandingEntity = await (await this.dbConnection)
      .getRepository(CredentialBrandingEntity)
      .save(credentialBrandingEntity)

    return this.credentialBrandingFrom(createdResult)
  }

  public getCredentialBranding = async (args?: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>> => {
    const result: Array<CredentialBrandingEntity> = await (await this.dbConnection).getRepository(CredentialBrandingEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((credentialBranding: CredentialBrandingEntity) => this.credentialBrandingFrom(credentialBranding))
  }

  public removeCredentialBranding = async (args: IRemoveCredentialBrandingArgs): Promise<void> => {
    const repository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const credentialBranding: CredentialBrandingEntity | null = await repository.findOne({
      where: { id: args.credentialBrandingId },
    })

    if (!credentialBranding) {
      return Promise.reject(Error(`No credential branding found for id: ${args.credentialBrandingId}`))
    }

    // debug('Removing credential branding', args.credentialBrandingId)

    await repository.delete(args.credentialBrandingId)
  }

  // TODO fix contact update, we need to keep identities
  public updateCredentialBranding = async (args: IUpdateCredentialBrandingArgs): Promise<ICredentialBranding> => {
    const repository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const credentialBrandingEntity: CredentialBrandingEntity | null = await repository.findOne({
      where: { id: args.credentialBranding.id },
    })

    if (!credentialBrandingEntity) {
      return Promise.reject(Error(`No credential branding found for id: ${args.credentialBranding.id}`))
    }

    const credentialBranding = {
      ...args.credentialBranding,
      localeBranding: credentialBrandingEntity.localeBranding,
    }

    //debug('Updating credential branding', args.credentialBranding)

    const result: CredentialBrandingEntity = await repository.save(credentialBranding, { transaction: true })

    return this.credentialBrandingFrom(result)
  }

  public addCredentialLocaleBranding = async (args: IAddCredentialLocaleBrandingArgs): Promise<ICredentialBranding> => {
    const credentialBrandingRepository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const credentialBranding: CredentialBrandingEntity | null = await credentialBrandingRepository.findOne({
      where: { id: args.credentialBrandingId },
    })

    if (!credentialBranding) {
      return Promise.reject(Error(`No credential branding found for id: ${args.credentialBrandingId}`))
    }

    // TODO we do have unique constraints for this
    // But this does make sure that we do not do any inserts before getting duplicates
    const locales: Array<CredentialLocaleBrandingEntity> | null = await (await this.dbConnection).getRepository(CredentialLocaleBrandingEntity).find({
      where: {
        credentialBranding: {
          id: args.credentialBrandingId,
        },
        locale: In(args.localeBranding.map((localeBranding: IBasicLocaleBranding) => localeBranding.locale)),
      },
    })

    if (locales?.length > 0) {
      return Promise.reject(
        Error(
          `Credential branding already contains locales: ${locales?.map(
            (credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity) => credentialLocaleBrandingEntity.locale
          )}`
        )
      )
    }

    const credentialLocaleBrandingRepository: Repository<CredentialLocaleBrandingEntity> = (await this.dbConnection).getRepository(
      CredentialLocaleBrandingEntity
    )
    const addCredentialLocaleBranding: Array<Promise<void>> = args.localeBranding.map(async (localeBranding: IBasicLocaleBranding): Promise<void> => {
      const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = credentialLocaleBrandingEntityFrom(localeBranding)
      debug('Adding credential locale branding', credentialLocaleBrandingEntity)
      credentialLocaleBrandingEntity.credentialBranding = credentialBranding
      await credentialLocaleBrandingRepository.save(credentialLocaleBrandingEntity, { transaction: true })
    })

    await Promise.all(addCredentialLocaleBranding)

    const result: CredentialBrandingEntity | null = await credentialBrandingRepository.findOne({
      where: { id: args.credentialBrandingId },
    })

    if (!result) {
      return Promise.reject(Error('Unable to get updated credential branding'))
    }

    return this.credentialBrandingFrom(result)
  }

  public getCredentialLocaleBranding = async (args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialBranding>> => {
    const credentialBrandingLocale: Array<CredentialLocaleBrandingEntity> | null = await (await this.dbConnection)
      .getRepository(CredentialLocaleBrandingEntity)
      .find({
        ...(args?.filter && { where: args?.filter }),
      })

    return credentialBrandingLocale.map(
      (credentialLocaleBranding: CredentialLocaleBrandingEntity) => this.localeBrandingFrom(credentialLocaleBranding) as ICredentialBranding // TODO
    )
  }

  public removeCredentialLocaleBranding = async (args: IRemoveCredentialLocaleBrandingArgs): Promise<void> => {
    const repository: Repository<CredentialLocaleBrandingEntity> = (await this.dbConnection).getRepository(CredentialLocaleBrandingEntity)
    const credentialLocaleBranding: CredentialLocaleBrandingEntity | null = await repository.findOne({
      where: { id: args.credentialLocaleBrandingId },
    })

    if (!credentialLocaleBranding) {
      return Promise.reject(Error(`No credential locale branding found for id: ${args.credentialLocaleBrandingId}`))
    }

    debug('Removing credential locale branding', args.credentialLocaleBrandingId)
    await repository.delete(args.credentialLocaleBrandingId)
  }

  public updateCredentialLocaleBranding = async (args: IUpdateCredentialLocaleBrandingArgs): Promise<ICredentialBranding> => {
    const repository: Repository<CredentialLocaleBrandingEntity> = (await this.dbConnection).getRepository(CredentialLocaleBrandingEntity)
    const result: CredentialLocaleBrandingEntity | null = await repository.findOne({
      where: { id: args.localeBranding.id },
    })

    if (!result) {
      return Promise.reject(Error(`No credential locale branding found for id: ${args.localeBranding.id}`))
    }

    const locales: Array<CredentialLocaleBrandingEntity> | null = await repository.find({
      where: {
        credentialBranding: {
          id: result.credentialBrandingId,
        },
        id: Not(In([args.localeBranding.id])),
        locale: args.localeBranding.locale,
      },
    })

    if (locales?.length > 0) {
      return Promise.reject(Error(`Credential branding: ${result.credentialBrandingId} already contains locale: ${args.localeBranding.locale}`))
    }

    debug('Updating credential locale branding', args.localeBranding)
    const updatedResult: CredentialLocaleBrandingEntity = await repository.save(args.localeBranding, { transaction: true })

    return this.localeBrandingFrom(updatedResult) as ICredentialBranding // TODO
  }

  // Issuer Branding

  public addIssuerBranding = async (args: IAddIssuerBrandingArgs): Promise<IIssuerBranding> => {
    const issuerBrandingEntity: IssuerBrandingEntity = issuerBrandingEntityFrom(args)
    debug('Adding issuer branding', issuerBrandingEntity)
    const createdResult: IssuerBrandingEntity = await (await this.dbConnection).getRepository(IssuerBrandingEntity).save(issuerBrandingEntity)

    return this.issuerBrandingFrom(createdResult)
  }

  public getIssuerBranding = async (args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>> => {
    const result: Array<IssuerBrandingEntity> = await (await this.dbConnection).getRepository(IssuerBrandingEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((issuerBranding: IssuerBrandingEntity) => this.issuerBrandingFrom(issuerBranding))
  }

  public removeIssuerBranding = async (args: IRemoveIssuerBrandingArgs): Promise<void> => {
    const repository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const issuerBranding: IssuerBrandingEntity | null = await repository.findOne({
      where: { id: args.issuerBrandingId },
    })

    if (!issuerBranding) {
      return Promise.reject(Error(`No issuer branding found for id: ${args.issuerBrandingId}`))
    }

    debug('Removing issuer branding', args.issuerBrandingId)
    await repository.delete(args.issuerBrandingId)
  }

  public updateIssuerBranding = async (args: IUpdateIssuerBrandingArgs): Promise<IIssuerBranding> => {
    const repository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const issuerBrandingEntity: IssuerBrandingEntity | null = await repository.findOne({
      where: { id: args.issuerBranding.id },
    })

    if (!issuerBrandingEntity) {
      return Promise.reject(Error(`No issuer branding found for id: ${args.issuerBranding.id}`))
    }

    const issuerBranding = {
      ...args.issuerBranding,
      localeBranding: issuerBrandingEntity.localeBranding,
    }

    debug('Updating issuer branding', issuerBranding)
    const result: IssuerBrandingEntity = await repository.save(issuerBranding, { transaction: true })

    return this.issuerBrandingFrom(result)
  }

  public addIssuerLocaleBranding = async (args: IAddIssuerLocaleBrandingArgs): Promise<IIssuerBranding> => {
    const issuerBrandingRepository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const issuerBranding: IssuerBrandingEntity | null = await issuerBrandingRepository.findOne({
      where: { id: args.issuerBrandingId },
    })

    if (!issuerBranding) {
      return Promise.reject(Error(`No issuer branding found for id: ${args.issuerBrandingId}`))
    }

    const locales: Array<IssuerLocaleBrandingEntity> | null = await (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity).find({
      where: {
        issuerBranding: {
          id: args.issuerBrandingId,
        },
        locale: In(args.localeBranding.map((localeBranding: IBasicLocaleBranding) => localeBranding.locale)),
      },
    })

    if (locales?.length > 0) {
      return Promise.reject(
        Error(
          `Issuer branding already contains locales: ${locales?.map(
            (issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity) => issuerLocaleBrandingEntity.locale
          )}`
        )
      )
    }

    const issuerLocaleBrandingRepository: Repository<IssuerLocaleBrandingEntity> = (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity)
    const addIssuerLocaleBranding: Array<Promise<void>> = args.localeBranding.map(async (localeBranding: IBasicLocaleBranding): Promise<void> => {
      const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = issuerLocaleBrandingEntityFrom(localeBranding)
      debug('Adding issuer locale branding', issuerLocaleBrandingEntity)
      issuerLocaleBrandingEntity.issuerBranding = issuerBranding
      await issuerLocaleBrandingRepository.save(issuerLocaleBrandingEntity, { transaction: true })
    })

    await Promise.all(addIssuerLocaleBranding)

    const result: IssuerBrandingEntity | null = await issuerBrandingRepository.findOne({
      where: { id: args.issuerBrandingId },
    })

    if (!result) {
      return Promise.reject(Error('Unable to get updated issuer branding'))
    }

    return this.issuerBrandingFrom(result)
  }

  public getIssuerLocaleBranding = async (args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerBranding>> => {
    const issuerLocaleBranding: Array<IssuerLocaleBrandingEntity> | null = await (await this.dbConnection)
      .getRepository(IssuerLocaleBrandingEntity)
      .find({
        ...(args?.filter && { where: args?.filter }),
      })

    return issuerLocaleBranding.map(
      (issuerLocaleBranding: IssuerLocaleBrandingEntity) => this.localeBrandingFrom(issuerLocaleBranding) as IIssuerBranding
    )
  }

  public removeIssuerLocaleBranding = async (args: IRemoveIssuerLocaleBrandingArgs): Promise<void> => {
    const repository: Repository<IssuerLocaleBrandingEntity> = (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity)
    const issuerLocaleBranding: IssuerLocaleBrandingEntity | null = await repository.findOne({
      where: { id: args.issuerLocaleBrandingId },
    })

    if (!issuerLocaleBranding) {
      return Promise.reject(Error(`No issuer locale branding found for id: ${args.issuerLocaleBrandingId}`))
    }

    debug('Removing issuer locale branding', args.issuerLocaleBrandingId)
    await repository.delete(args.issuerLocaleBrandingId)
  }

  public updateIssuerLocaleBranding = async (args: IUpdateIssuerLocaleBrandingArgs): Promise<IIssuerBranding> => {
    const repository: Repository<IssuerLocaleBrandingEntity> = (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity)
    const result: IssuerLocaleBrandingEntity | null = await repository.findOne({
      where: { id: args.localeBranding.id },
    })

    if (!result) {
      return Promise.reject(Error(`No issuer locale branding found for id: ${args.localeBranding.id}`))
    }

    const locales: Array<IssuerLocaleBrandingEntity> | null = await repository.find({
      where: {
        issuerBranding: {
          id: result.issuerBrandingId,
        },
        id: Not(In([args.localeBranding.id])),
        locale: args.localeBranding.locale,
      },
    })

    if (locales?.length > 0) {
      return Promise.reject(Error(`Issuer branding: ${result.issuerBrandingId} already contains locale: ${args.localeBranding.locale}`))
    }

    debug('Updating issuer locale branding', args.localeBranding)
    const updatedResult: IssuerLocaleBrandingEntity = await repository.save(args.localeBranding, { transaction: true })

    return this.localeBrandingFrom(updatedResult) as IIssuerBranding // TODO
  }

  private credentialBrandingFrom = (credentialBranding: CredentialBrandingEntity): ICredentialBranding => {
    return {
      id: credentialBranding.id,
      issuerCorrelationId: credentialBranding.issuerCorrelationId,
      vcHash: credentialBranding.vcHash,
      localeBranding: credentialBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => this.localeBrandingFrom(localeBranding)),
      createdAt: credentialBranding.createdAt,
      lastUpdatedAt: credentialBranding.lastUpdatedAt,
    }
  }

  private issuerBrandingFrom = (issuerBranding: IssuerBrandingEntity): IIssuerBranding => {
    return {
      id: issuerBranding.id,
      issuerCorrelationId: issuerBranding.issuerCorrelationId,
      localeBranding: issuerBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => this.localeBrandingFrom(localeBranding)),
      createdAt: issuerBranding.createdAt,
      lastUpdatedAt: issuerBranding.lastUpdatedAt,
    }
  }

  private localeBrandingFrom = (localeBranding: BaseLocaleBrandingEntity): ILocaleBranding => {
    // TODO maybe add the issuer or credential branding as well

    return {
      id: localeBranding.id,
      alias: localeBranding.alias,
      locale: localeBranding.locale,
      logo: localeBranding.logo,
      description: localeBranding.description,
      background: localeBranding.background,
      text: localeBranding.text,
      createdAt: localeBranding.createdAt,
      lastUpdatedAt: localeBranding.lastUpdatedAt,
    }
  }
}
