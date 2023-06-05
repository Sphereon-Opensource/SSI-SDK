import { IAgentPlugin } from '@veramo/core'
import { downloadImage, getImageDimensions, getImageType, IImageDimensions, IImageResource } from '@sphereon/ssi-sdk.core'
import {
  AbstractIssuanceBrandingStore,
  IAddIssuerBrandingArgs,
  IBasicCredentialBranding,
  IBasicCredentialLocaleBranding,
  IBasicIssuerBranding,
  IBasicIssuerLocaleBranding,
  ICredentialBranding,
  ICredentialLocaleBranding,
  IGetCredentialBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerBrandingArgs,
  IIssuerBranding,
  IIssuerLocaleBranding,
  ILocaleBranding as LocaleBranding,
} from '@sphereon/ssi-sdk.data-store'
import { schema } from '../index'
import {
  IAddCredentialBrandingArgs,
  IAdditionalImageAttributes,
  IIssuanceBranding,
  ILocaleBranding,
  IRequiredContext,
  IRemoveCredentialBrandingArgs,
  IRemoveIssuerBrandingArgs,
  IUpdateCredentialBrandingArgs,
  IUpdateIssuerBrandingArgs,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  IGetIssuerLocaleBrandingArgs,
  IRemoveIssuerLocaleBrandingArgs,
  IRemoveCredentialLocaleBrandingArgs,
  IUpdateCredentialLocaleBrandingArgs,
  IUpdateIssuerLocaleBrandingArgs,
} from '../types/IIssuanceBranding'
import Debug from 'debug'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:issuance-branding')

/**
 * {@inheritDoc IIssuanceBranding}
 */
export class IssuanceBranding implements IAgentPlugin {
  readonly schema = schema.IIssuanceBranding
  readonly methods: IIssuanceBranding = {
    ibAddCredentialBranding: this.ibAddCredentialBranding.bind(this),
    ibGetCredentialBranding: this.ibGetCredentialBranding.bind(this),
    ibUpdateCredentialBranding: this.ibUpdateCredentialBranding.bind(this),
    ibRemoveCredentialBranding: this.ibRemoveCredentialBranding.bind(this),
    ibAddCredentialLocaleBranding: this.ibAddCredentialLocaleBranding.bind(this),
    ibGetCredentialLocaleBranding: this.ibGetCredentialLocaleBranding.bind(this),
    ibRemoveCredentialLocaleBranding: this.ibRemoveCredentialLocaleBranding.bind(this),
    ibUpdateCredentialLocaleBranding: this.ibUpdateCredentialLocaleBranding.bind(this),
    ibAddIssuerBranding: this.ibAddIssuerBranding.bind(this),
    ibGetIssuerBranding: this.ibGetIssuerBranding.bind(this),
    ibUpdateIssuerBranding: this.ibUpdateIssuerBranding.bind(this),
    ibRemoveIssuerBranding: this.inRemoveIssuerBranding.bind(this),
    ibAddIssuerLocaleBranding: this.ibAddIssuerLocaleBranding.bind(this),
    ibGetIssuerLocaleBranding: this.ibAGetIssuerLocaleBranding.bind(this),
    ibRemoveIssuerLocaleBranding: this.ibRemoveIssuerLocaleBranding.bind(this),
    ibUpdateIssuerLocaleBranding: this.ibUpdateIssuerLocaleBranding.bind(this),
  }

  private readonly store: AbstractIssuanceBrandingStore

  constructor(options: { store: AbstractIssuanceBrandingStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IIssuanceBranding.ibAddCredentialBranding} */
  private async ibAddCredentialBranding(args: IAddCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    const localeBranding: Array<IBasicIssuerLocaleBranding> = await Promise.all(
      args.localeBranding.map(
        (localeBranding: ILocaleBranding): Promise<IBasicCredentialLocaleBranding> => this.setAdditionalImageAttributes(localeBranding)
      )
    )
    const credentialBranding: IBasicCredentialBranding = {
      ...args,
      localeBranding,
    }

    debug('Adding credential branding', credentialBranding)
    return this.store.addCredentialBranding(credentialBranding)
  }

  /** {@inheritDoc IIssuanceBranding.ibGetCredentialBranding} */
  private async ibGetCredentialBranding(args?: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>> {
    debug('Getting credential branding', args)
    return this.store.getCredentialBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.ibUpdateCredentialBranding} */
  private async ibUpdateCredentialBranding(args: IUpdateCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    debug('Updating credential branding', args)
    return this.store.updateCredentialBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.ibRemoveCredentialBranding} */
  private async ibRemoveCredentialBranding(args: IRemoveCredentialBrandingArgs, context: IRequiredContext): Promise<boolean> {
    debug('Removing credential branding', args)
    return this.store.removeCredentialBranding(args).then(() => true)
  }

  /** {@inheritDoc IIssuanceBranding.ibAddCredentialLocaleBranding} */
  private async ibAddCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    const localeBranding: Array<ILocaleBranding> = await Promise.all(
      args.localeBranding.map(
        (localeBranding: ILocaleBranding): Promise<IBasicCredentialLocaleBranding> => this.setAdditionalImageAttributes(localeBranding)
      )
    )
    const addCredentialLocaleBrandingArgs: IAddCredentialLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    debug('Adding credential locale branding', addCredentialLocaleBrandingArgs)
    return this.store.addCredentialLocaleBranding(addCredentialLocaleBrandingArgs)
  }

  /** {@inheritDoc IIssuanceBranding.ibGetCredentialLocaleBranding} */
  private async ibGetCredentialLocaleBranding(args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialLocaleBranding>> {
    debug('Getting credential locale branding', args)
    return this.store.getCredentialLocaleBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.ibRemoveCredentialLocaleBranding} */
  private async ibRemoveCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<boolean> {
    debug('Removing credential locale branding', args)
    return this.store.removeCredentialLocaleBranding(args).then(() => true)
  }

  /** {@inheritDoc IIssuanceBranding.ibUpdateCredentialLocaleBranding} */
  private async ibUpdateCredentialLocaleBranding(
    args: IUpdateCredentialLocaleBrandingArgs,
    context: IRequiredContext
  ): Promise<ICredentialLocaleBranding> {
    const localeBranding: Omit<LocaleBranding, 'createdAt' | 'lastUpdatedAt'> = (await this.setAdditionalImageAttributes(
      args.localeBranding
    )) as ICredentialLocaleBranding
    const updateCredentialLocaleBrandingArgs: IUpdateCredentialLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    debug('Updating credential locale branding', updateCredentialLocaleBrandingArgs)
    return this.store.updateCredentialLocaleBranding(updateCredentialLocaleBrandingArgs)
  }

  /** {@inheritDoc IIssuanceBranding.ibAddIssuerBranding} */
  private async ibAddIssuerBranding(args: IAddIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    const localeBranding: Array<IBasicIssuerLocaleBranding> = await Promise.all(
      args.localeBranding.map(
        (localeBranding: ILocaleBranding): Promise<IBasicIssuerLocaleBranding> => this.setAdditionalImageAttributes(localeBranding)
      )
    )
    const issuerBranding: IBasicIssuerBranding = {
      ...args,
      localeBranding,
    }

    debug('Adding issuer branding', issuerBranding)
    return this.store.addIssuerBranding(issuerBranding)
  }

  /** {@inheritDoc IIssuanceBranding.ibGetIssuerBranding} */
  private async ibGetIssuerBranding(args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>> {
    debug('Getting issuer branding', args)
    return this.store.getIssuerBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.ibUpdateIssuerBranding} */
  private async ibUpdateIssuerBranding(args: IUpdateIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    debug('Updating issuer branding', args)
    return this.store.updateIssuerBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.inRemoveIssuerBranding} */
  private async inRemoveIssuerBranding(args: IRemoveIssuerBrandingArgs, context: IRequiredContext): Promise<boolean> {
    debug('Removing issuer branding', args)
    return this.store.removeIssuerBranding(args).then(() => true)
  }

  /** {@inheritDoc IIssuanceBranding.ibAddIssuerLocaleBranding} */
  private async ibAddIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    const localeBranding: Array<ILocaleBranding> = await Promise.all(
      args.localeBranding.map(
        (localeBranding: ILocaleBranding): Promise<IBasicIssuerLocaleBranding> => this.setAdditionalImageAttributes(localeBranding)
      )
    )
    const addIssuerLocaleBrandingArgs: IAddIssuerLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    debug('Adding issuer locale branding', addIssuerLocaleBrandingArgs)
    return this.store.addIssuerLocaleBranding(addIssuerLocaleBrandingArgs)
  }

  /** {@inheritDoc IIssuanceBranding.ibAGetIssuerLocaleBranding} */
  private async ibAGetIssuerLocaleBranding(args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerLocaleBranding>> {
    debug('Getting issuer locale branding', args)
    return this.store.getIssuerLocaleBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.ibRemoveIssuerLocaleBranding} */
  private async ibRemoveIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<boolean> {
    debug('Removing issuer locale branding', args)
    return this.store.removeIssuerLocaleBranding(args).then(() => true)
  }

  /** {@inheritDoc IIssuanceBranding.ibUpdateIssuerLocaleBranding} */
  private async ibUpdateIssuerLocaleBranding(args: IUpdateIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerLocaleBranding> {
    const localeBranding: Omit<LocaleBranding, 'createdAt' | 'lastUpdatedAt'> = (await this.setAdditionalImageAttributes(
      args.localeBranding
    )) as IIssuerLocaleBranding
    const updateIssuerLocaleBrandingArgs: IUpdateIssuerLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    debug('Updating issuer locale branding', updateIssuerLocaleBrandingArgs)
    return this.store.updateIssuerLocaleBranding(updateIssuerLocaleBrandingArgs)
  }

  private async setAdditionalImageAttributes(localeBranding: ILocaleBranding): Promise<ILocaleBranding> {
    return {
      ...localeBranding,
      ...(localeBranding.logo && {
        logo: {
          ...localeBranding.logo,
          ...(localeBranding.logo.uri
            ? {
                ...(await this.getAdditionalImageAttributes(localeBranding.logo.uri)),
              }
            : {
                type: undefined,
                base64Content: undefined,
                dimensions: undefined,
              }),
        },
      }),
      ...(localeBranding.background && {
        background: {
          ...localeBranding.background,
          ...(localeBranding.background.image && {
            image: {
              ...localeBranding.background.image,
              ...(localeBranding.background.image.uri
                ? {
                    ...(await this.getAdditionalImageAttributes(localeBranding.background.image.uri)),
                  }
                : {
                    type: undefined,
                    base64Content: undefined,
                    dimensions: undefined,
                  }),
            },
          }),
        },
      }),
    }
  }

  private async getAdditionalImageAttributes(uri: string): Promise<IAdditionalImageAttributes> {
    const data_uri_regex: RegExp = /^data:image\/[^;]+;base64,/
    if (data_uri_regex.test(uri)) {
      debug('Setting additional image properties for uri', uri)
      const base64Content: string = await this.extractBase64FromDataURI(uri)
      const dimensions: IImageDimensions = await getImageDimensions(base64Content)
      const imageType: string = await this.getDataTypeFromDataURI(uri)

      return {
        type: imageType,
        dimensions,
      }
    }

    debug('Setting additional image properties for url', uri)
    const resource: IImageResource = await downloadImage(uri)
    const dimensions: IImageDimensions = await getImageDimensions(resource.base64Content)
    const imageType: string | undefined = resource.contentType || (await getImageType(resource.base64Content))

    return {
      type: imageType,
      base64Content: resource.base64Content,
      dimensions,
    }
  }

  private async extractBase64FromDataURI(uri: string): Promise<string> {
    const data_uri_base64_regex: RegExp = /^data:[^;]+;base64,([\w+/=-]+)$/i
    const matches: RegExpMatchArray | null = uri.match(data_uri_base64_regex)

    if (!matches || matches.length <= 1) {
      return Promise.reject(Error('invalid base64 uri'))
    }

    return matches[1]
  }

  private async getDataTypeFromDataURI(uri: string): Promise<string> {
    const data_uri_data_type_regex: RegExp = /^data:([^;]+);base64,([\w+/=-]+)$/i
    const matches: RegExpMatchArray | null = uri.match(data_uri_data_type_regex)

    if (!matches || matches.length <= 1) {
      return Promise.reject(Error('invalid base64 uri'))
    }

    return matches[1]
  }
}
