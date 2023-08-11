import Debug from 'debug'
import { DataSource, DeleteResult, In, Not, Repository } from 'typeorm'
import { OrPromise } from '@sphereon/ssi-types'
import { BackgroundAttributesEntity } from '../entities/issuanceBranding/BackgroundAttributesEntity.mjs'
import { ImageAttributesEntity } from '../entities/issuanceBranding/ImageAttributesEntity.mjs'
import { ImageDimensionsEntity } from '../entities/issuanceBranding/ImageDimensionsEntity.mjs'
import { IssuerBrandingEntity, issuerBrandingEntityFrom } from '../entities/issuanceBranding/IssuerBrandingEntity.mjs'
import { CredentialBrandingEntity, credentialBrandingEntityFrom } from '../entities/issuanceBranding/CredentialBrandingEntity.mjs'
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from '../entities/issuanceBranding/CredentialLocaleBrandingEntity.mjs'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from '../entities/issuanceBranding/IssuerLocaleBrandingEntity.mjs'
import { BaseLocaleBrandingEntity } from '../entities/issuanceBranding/BaseLocaleBrandingEntity.mjs'
import { TextAttributesEntity } from '../entities/issuanceBranding/TextAttributesEntity.mjs'
import { AbstractIssuanceBrandingStore } from './AbstractIssuanceBrandingStore.mjs'
import {
  IAddCredentialBrandingArgs,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
  ICredentialBranding,
  IPartialCredentialBranding,
  ICredentialLocaleBranding,
  ICredentialLocaleBrandingFilter,
  IGetCredentialBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerBrandingArgs,
  IGetIssuerLocaleBrandingArgs,
  IIssuerBranding,
  IIssuerBrandingFilter,
  IIssuerLocaleBranding,
  IIssuerLocaleBrandingFilter,
  ILocaleBranding,
  IRemoveCredentialBrandingArgs,
  IRemoveCredentialLocaleBrandingArgs,
  IRemoveIssuerBrandingArgs,
  IRemoveIssuerLocaleBrandingArgs,
  IUpdateCredentialBrandingArgs,
  IUpdateCredentialLocaleBrandingArgs,
  IUpdateIssuerBrandingArgs,
  IUpdateIssuerLocaleBrandingArgs,
  ICredentialBrandingFilter,
} from '../types/index.mjs'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:issuance-branding-store')

export class IssuanceBrandingStore extends AbstractIssuanceBrandingStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  public addCredentialBranding = async (args: IAddCredentialBrandingArgs): Promise<ICredentialBranding> => {
    const repository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const result: CredentialBrandingEntity | null = await repository.findOne({
      where: [{ vcHash: args.vcHash }],
    })

    if (result) {
      return Promise.reject(Error(`Credential branding already present for vc with hash: ${args.vcHash}`))
    }

    if (await this.hasDuplicateLocales(args.localeBranding)) {
      return Promise.reject(Error(`Credential branding contains duplicate locales`))
    }

    const credentialBrandingEntity: CredentialBrandingEntity = credentialBrandingEntityFrom(args)
    debug('Adding credential branding', credentialBrandingEntity)
    const createdResult: CredentialBrandingEntity = await repository.save(credentialBrandingEntity)

    return this.credentialBrandingFrom(createdResult)
  }

  public getCredentialBranding = async (args?: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>> => {
    if (args?.filter) {
      args?.filter.forEach((filter: IPartialCredentialBranding): void => {
        if (filter.localeBranding && 'locale' in filter.localeBranding && filter.localeBranding.locale === undefined) {
          filter.localeBranding.locale = ''
        }
      })
    }

    debug('Getting credential branding', args)
    const result: Array<CredentialBrandingEntity> = await (await this.dbConnection).getRepository(CredentialBrandingEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((credentialBranding: CredentialBrandingEntity) => this.credentialBrandingFrom(credentialBranding))
  }

  public removeCredentialBranding = async (args: IRemoveCredentialBrandingArgs): Promise<void> => {
    const repository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const credentialBranding: Array<CredentialBrandingEntity> = await repository.find({
      where: args.filter,
    })

    debug('Removing credential locale branding', args)
    const localeBrandingDeletions: Array<Array<Promise<void>>> = credentialBranding.map((credentialBranding: CredentialBrandingEntity) =>
      credentialBranding.localeBranding.map(
        async (localeBranding: CredentialLocaleBrandingEntity): Promise<void> => this.removeLocaleBranding(localeBranding)
      )
    )
    await Promise.all(localeBrandingDeletions)

    debug('Removing credential branding', args)
    const credentialBrandingDeletions: Array<Promise<DeleteResult>> = args.filter.map(
      async (filter: ICredentialBrandingFilter): Promise<DeleteResult> => await repository.delete(filter)
    )
    await Promise.all(credentialBrandingDeletions)
  }

  public updateCredentialBranding = async (args: IUpdateCredentialBrandingArgs): Promise<ICredentialBranding> => {
    const repository: Repository<CredentialBrandingEntity> = (await this.dbConnection).getRepository(CredentialBrandingEntity)
    const credentialBrandingEntity: CredentialBrandingEntity | null = await repository.findOne({
      where: { id: args.credentialBranding.id },
    })

    if (!credentialBrandingEntity) {
      return Promise.reject(Error(`No credential branding found for id: ${args.credentialBranding.id}`))
    }

    const credentialBranding: Omit<ICredentialBranding, 'createdAt' | 'lastUpdatedAt'> = {
      ...args.credentialBranding,
      localeBranding: credentialBrandingEntity.localeBranding,
    }

    debug('Updating credential branding', credentialBranding)
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

    const locales: Array<CredentialLocaleBrandingEntity> | null = await (await this.dbConnection).getRepository(CredentialLocaleBrandingEntity).find({
      where: {
        credentialBranding: {
          id: args.credentialBrandingId,
        },
        locale: In(args.localeBranding.map((localeBranding: IBasicCredentialLocaleBranding) => localeBranding.locale)),
      },
    })

    if (locales && locales.length > 0) {
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
    const addCredentialLocaleBranding: Array<Promise<void>> = args.localeBranding.map(
      async (localeBranding: IBasicCredentialLocaleBranding): Promise<void> => {
        const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = credentialLocaleBrandingEntityFrom(localeBranding)
        debug('Adding credential locale branding', credentialLocaleBrandingEntity)
        credentialLocaleBrandingEntity.credentialBranding = credentialBranding
        await credentialLocaleBrandingRepository.save(credentialLocaleBrandingEntity, { transaction: true })
      }
    )

    await Promise.all(addCredentialLocaleBranding)

    const result: CredentialBrandingEntity | null = await credentialBrandingRepository.findOne({
      where: { id: args.credentialBrandingId },
    })

    if (!result) {
      return Promise.reject(Error('Unable to get updated credential branding'))
    }

    return this.credentialBrandingFrom(result)
  }

  public getCredentialLocaleBranding = async (args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialLocaleBranding>> => {
    if (args?.filter) {
      args?.filter.forEach((filter: ICredentialLocaleBrandingFilter): void => {
        if ('locale' in filter && filter.locale === undefined) {
          filter.locale = ''
        }
      })
    }

    debug('Getting credential locale branding', args)
    const credentialBrandingLocale: Array<CredentialLocaleBrandingEntity> | null = await (await this.dbConnection)
      .getRepository(CredentialLocaleBrandingEntity)
      .find({
        ...(args?.filter && { where: args?.filter }),
      })

    return credentialBrandingLocale
      ? credentialBrandingLocale.map(
          (credentialLocaleBranding: CredentialLocaleBrandingEntity) => this.localeBrandingFrom(credentialLocaleBranding) as ICredentialLocaleBranding
        )
      : []
  }

  public removeCredentialLocaleBranding = async (args: IRemoveCredentialLocaleBrandingArgs): Promise<void> => {
    const credentialLocaleBranding: Array<CredentialLocaleBrandingEntity> = await (await this.dbConnection)
      .getRepository(CredentialLocaleBrandingEntity)
      .find({
        where: args.filter,
      })

    debug('Removing credential locale branding', args)
    const localeBrandingDeletions: Array<Promise<void>> = credentialLocaleBranding.map(
      async (localeBranding: CredentialLocaleBrandingEntity): Promise<void> => this.removeLocaleBranding(localeBranding)
    )
    await Promise.all(localeBrandingDeletions)
  }

  public updateCredentialLocaleBranding = async (args: IUpdateCredentialLocaleBrandingArgs): Promise<ICredentialLocaleBranding> => {
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

    if (locales && locales.length > 0) {
      return Promise.reject(Error(`Credential branding: ${result.credentialBrandingId} already contains locale: ${args.localeBranding.locale}`))
    }

    debug('Updating credential locale branding', args.localeBranding)
    const updatedResult: CredentialLocaleBrandingEntity = await repository.save(args.localeBranding, { transaction: true })

    return this.localeBrandingFrom(updatedResult) as ICredentialLocaleBranding
  }

  public addIssuerBranding = async (args: IAddIssuerBrandingArgs): Promise<IIssuerBranding> => {
    const repository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const result: IssuerBrandingEntity | null = await repository.findOne({
      where: [{ issuerCorrelationId: args.issuerCorrelationId }],
    })

    if (result) {
      return Promise.reject(Error(`Issuer branding already present for issuer with correlation id: ${args.issuerCorrelationId}`))
    }

    if (await this.hasDuplicateLocales(args.localeBranding)) {
      return Promise.reject(Error(`Issuer branding contains duplicate locales`))
    }

    const issuerBrandingEntity: IssuerBrandingEntity = issuerBrandingEntityFrom(args)
    debug('Adding issuer branding', issuerBrandingEntity)
    const createdResult: IssuerBrandingEntity = await repository.save(issuerBrandingEntity)

    return this.issuerBrandingFrom(createdResult)
  }

  public getIssuerBranding = async (args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>> => {
    if (args?.filter) {
      args?.filter.forEach((filter: IIssuerBrandingFilter): void => {
        if (filter.localeBranding && 'locale' in filter.localeBranding && filter.localeBranding.locale === undefined) {
          filter.localeBranding.locale = ''
        }
      })
    }

    debug('Getting issuer branding', args)
    const result: Array<IssuerBrandingEntity> = await (await this.dbConnection).getRepository(IssuerBrandingEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((issuerBranding: IssuerBrandingEntity) => this.issuerBrandingFrom(issuerBranding))
  }

  public removeIssuerBranding = async (args: IRemoveIssuerBrandingArgs): Promise<void> => {
    const repository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const issuerBranding: Array<IssuerBrandingEntity> = await repository.find({
      where: args.filter,
    })

    debug('Removing issuer locale branding', args)
    const localeBrandingDeletions: Array<Array<Promise<void>>> = issuerBranding.map((issuerBranding: IssuerBrandingEntity) =>
      issuerBranding.localeBranding.map(
        async (localeBranding: IssuerLocaleBrandingEntity): Promise<void> => this.removeLocaleBranding(localeBranding)
      )
    )
    await Promise.all(localeBrandingDeletions)

    debug('Removing issuer branding', args)
    const issuerBrandingDeletions: Array<Promise<DeleteResult>> = args.filter.map(
      async (filter: IIssuerBrandingFilter): Promise<DeleteResult> => await repository.delete(filter)
    )
    await Promise.all(issuerBrandingDeletions)
  }

  public updateIssuerBranding = async (args: IUpdateIssuerBrandingArgs): Promise<IIssuerBranding> => {
    const repository: Repository<IssuerBrandingEntity> = (await this.dbConnection).getRepository(IssuerBrandingEntity)
    const issuerBrandingEntity: IssuerBrandingEntity | null = await repository.findOne({
      where: { id: args.issuerBranding.id },
    })

    if (!issuerBrandingEntity) {
      return Promise.reject(Error(`No issuer branding found for id: ${args.issuerBranding.id}`))
    }

    const issuerBranding: Omit<IIssuerBranding, 'createdAt' | 'lastUpdatedAt'> = {
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
        locale: In(args.localeBranding.map((localeBranding: IBasicIssuerLocaleBranding) => localeBranding.locale)),
      },
    })

    if (locales && locales.length > 0) {
      return Promise.reject(
        Error(
          `Issuer branding already contains locales: ${locales?.map(
            (issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity) => issuerLocaleBrandingEntity.locale
          )}`
        )
      )
    }

    const issuerLocaleBrandingRepository: Repository<IssuerLocaleBrandingEntity> = (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity)
    const addIssuerLocaleBranding: Array<Promise<void>> = args.localeBranding.map(
      async (localeBranding: IBasicIssuerLocaleBranding): Promise<void> => {
        const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = issuerLocaleBrandingEntityFrom(localeBranding)
        debug('Adding issuer locale branding', issuerLocaleBrandingEntity)
        issuerLocaleBrandingEntity.issuerBranding = issuerBranding
        await issuerLocaleBrandingRepository.save(issuerLocaleBrandingEntity, { transaction: true })
      }
    )

    await Promise.all(addIssuerLocaleBranding)

    const result: IssuerBrandingEntity | null = await issuerBrandingRepository.findOne({
      where: { id: args.issuerBrandingId },
    })

    if (!result) {
      return Promise.reject(Error('Unable to get updated issuer branding'))
    }

    return this.issuerBrandingFrom(result)
  }

  public getIssuerLocaleBranding = async (args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerLocaleBranding>> => {
    if (args?.filter) {
      args?.filter.forEach((filter: IIssuerLocaleBrandingFilter): void => {
        if ('locale' in filter && filter.locale === undefined) {
          filter.locale = ''
        }
      })
    }

    debug('Getting issuer locale branding', args)
    const issuerLocaleBranding: Array<IssuerLocaleBrandingEntity> | null = await (await this.dbConnection)
      .getRepository(IssuerLocaleBrandingEntity)
      .find({
        ...(args?.filter && { where: args?.filter }),
      })

    return issuerLocaleBranding
      ? issuerLocaleBranding.map(
          (issuerLocaleBranding: IssuerLocaleBrandingEntity) => this.localeBrandingFrom(issuerLocaleBranding) as IIssuerLocaleBranding
        )
      : []
  }

  public removeIssuerLocaleBranding = async (args: IRemoveIssuerLocaleBrandingArgs): Promise<void> => {
    const issuerLocaleBranding: Array<IssuerLocaleBrandingEntity> = await (await this.dbConnection).getRepository(IssuerLocaleBrandingEntity).find({
      where: args.filter,
    })

    debug('Removing credential locale branding', args)
    const localeBrandingDeletions: Array<Promise<void>> = issuerLocaleBranding.map(
      async (localeBranding: IssuerLocaleBrandingEntity): Promise<void> => this.removeLocaleBranding(localeBranding)
    )
    await Promise.all(localeBrandingDeletions)
  }

  public updateIssuerLocaleBranding = async (args: IUpdateIssuerLocaleBrandingArgs): Promise<IIssuerLocaleBranding> => {
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

    if (locales && locales.length > 0) {
      return Promise.reject(Error(`Issuer branding: ${result.issuerBrandingId} already contains locale: ${args.localeBranding.locale}`))
    }

    debug('Updating issuer locale branding', args.localeBranding)
    const updatedResult: IssuerLocaleBrandingEntity = await repository.save(args.localeBranding, { transaction: true })

    return this.localeBrandingFrom(updatedResult) as IIssuerLocaleBranding
  }

  private credentialBrandingFrom = (credentialBranding: CredentialBrandingEntity): ICredentialBranding => {
    const result: ICredentialBranding = {
      ...credentialBranding,
      localeBranding: credentialBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => this.localeBrandingFrom(localeBranding)),
    }

    return this.replaceNullWithUndefined(result)
  }

  private issuerBrandingFrom = (issuerBranding: IssuerBrandingEntity): IIssuerBranding => {
    const result: IIssuerBranding = {
      ...issuerBranding,
      localeBranding: issuerBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => this.localeBrandingFrom(localeBranding)),
    }

    return this.replaceNullWithUndefined(result)
  }

  private localeBrandingFrom = (localeBranding: BaseLocaleBrandingEntity): ILocaleBranding => {
    const result: ILocaleBranding = {
      ...localeBranding,
      locale: localeBranding.locale === '' ? undefined : localeBranding.locale,
    }

    return this.replaceNullWithUndefined(result)
  }

  private replaceNullWithUndefined(obj: any): any {
    if (obj === null) {
      return undefined
    }

    if (typeof obj !== 'object' || obj instanceof Date) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((value: any) => this.replaceNullWithUndefined(value))
    }

    const result: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = this.replaceNullWithUndefined(obj[key])
      }
    }
    return result
  }

  private hasDuplicateLocales = async (localeBranding: Array<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding>): Promise<boolean> => {
    let seen: Set<string | undefined> = new Set()
    return localeBranding.some((localeBranding: IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding): boolean => {
      return seen.size === seen.add(localeBranding.locale).size
    })
  }

  private removeLocaleBranding = async (localeBranding: BaseLocaleBrandingEntity): Promise<void> => {
    debug('Removing credential locale branding', localeBranding)
    // Delete background image dimensions
    if (localeBranding.background?.image?.dimensions) {
      await (await this.dbConnection).getRepository(ImageDimensionsEntity).delete({ id: localeBranding.background?.image?.dimensions?.id })
    }

    // Delete background image
    if (localeBranding.background?.image) {
      await (await this.dbConnection).getRepository(ImageAttributesEntity).delete({ id: localeBranding.background?.image?.id })
    }

    // Delete background
    if (localeBranding.background) {
      await (await this.dbConnection).getRepository(BackgroundAttributesEntity).delete({ id: localeBranding.background?.id })
    }

    // Delete logo image dimensions
    if (localeBranding.logo?.dimensions) {
      await (await this.dbConnection).getRepository(ImageDimensionsEntity).delete({ id: localeBranding.logo?.dimensions?.id })
    }

    // Delete logo
    if (localeBranding.logo) {
      await (await this.dbConnection).getRepository(ImageAttributesEntity).delete({ id: localeBranding.logo?.id })
    }

    // Delete text
    if (localeBranding.text) {
      await (await this.dbConnection).getRepository(TextAttributesEntity).delete({ id: localeBranding.text?.id })
    }

    // Delete locale branding
    await (await this.dbConnection).getRepository(CredentialLocaleBrandingEntity).delete({ id: localeBranding.id })
  }
}
