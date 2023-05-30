import { IAgentPlugin, ICredentialIssuer } from '@veramo/core'
import { extractBase64FromDataURI, downloadImage, getImageDimensions, getImageType, IImageDimensions } from '@sphereon/ssi-sdk.core'
import {
  AbstractIssuanceBrandingStore,
  IAddIssuerBrandingArgs,
  IBasicCredentialBranding,
  IBasicIssuerBranding,
  ICredentialBranding,
  IGetCredentialBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerBrandingArgs,
  IIssuerBranding,
} from '@sphereon/ssi-sdk.data-store'
import { IRemoveCredentialLocaleBrandingArgs, schema } from '../index'
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
} from '../types/IIssuanceBranding'

/**
 * {@inheritDoc IIssuanceBranding}
 */
export class IssuanceBranding implements IAgentPlugin {
  readonly schema = schema.IIssuanceBranding
  readonly methods: IIssuanceBranding = {
    addCredentialBranding: this.addCredentialBranding.bind(this),
    getCredentialBranding: this.getCredentialBranding.bind(this),
    updateCredentialBranding: this.updateCredentialBranding.bind(this),
    removeCredentialBranding: this.removeCredentialBranding.bind(this),
    addCredentialLocaleBranding: this.addCredentialLocaleBranding.bind(this),
    getCredentialLocaleBranding: this.getCredentialLocaleBranding.bind(this),
    removeCredentialLocaleBranding: this.removeCredentialLocaleBranding.bind(this),

    addIssuerBranding: this.addIssuerBranding.bind(this),
    getIssuerBranding: this.getIssuerBranding.bind(this),
    updateIssuerBranding: this.updateIssuerBranding.bind(this),
    removeIssuerBranding: this.removeIssuerBranding.bind(this),
    addIssuerLocaleBranding: this.addIssuerLocaleBranding.bind(this),
    getIssuerLocaleBranding: this.getIssuerLocaleBranding.bind(this),
    removeIssuerLocaleBranding: this.removeIssuerLocaleBranding.bind(this),
  }

  private readonly store: AbstractIssuanceBrandingStore

  constructor(options: { store: AbstractIssuanceBrandingStore }) {
    this.store = options.store
  }

  // private identity<Type>(arg: Type): Type {
  //   return {  };
  // }
  //
  // private identity<Type extends ICredentialBranding | IIssuerBranding>(arg: Type): Type {
  //   return arg;
  // }

  // private async addBranding<Input extends IAddCredentialBrandingArgs | IAddIssuerBrandingArgs, Output extends ICredentialBranding | ICredentialIssuer>(arg: Input): Promise<Output> {
  //   if ((arg as any) as IAddCredentialBrandingArgs) {
  //     console.log('IAddCredentialBrandingArgs');
  //     // @ts-ignore
  //     return await this.addCredentialBranding(arg as IAddCredentialBrandingArgs) as Promise<Output>;
  //   } else if ((arg as any) as IAddIssuerBrandingArgs) {
  //     console.log('IAddIssuerBrandingArgs');
  //     // @ts-ignore
  //     return await this.addIssuerBranding(arg as IAddIssuerBrandingArgs) as Promise<Output>;
  //   } else {
  //     throw new Error('Invalid input type');
  //   }
  // }

  /** {@inheritDoc IIssuanceBranding.addCredentialBranding} */
  private async addCredentialBranding(args: IAddCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    const localeBranding: Array<ILocaleBranding> = await this.setAdditionalImageAttributes(args.localeBranding)
    const credentialBranding: IBasicCredentialBranding = {
      ...args,
      localeBranding,
    }

    return this.store.addCredentialBranding(credentialBranding)
  }

  /** {@inheritDoc IIssuanceBranding.getCredentialBranding} */
  private async getCredentialBranding(args?: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>> {
    return this.store.getCredentialBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.updateCredentialBranding} */
  private async updateCredentialBranding(args: IUpdateCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    return this.store.updateCredentialBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.removeCredentialBranding} */
  private async removeCredentialBranding(args: IRemoveCredentialBrandingArgs, context: IRequiredContext): Promise<void> {

    // await this.addBranding({
    //   issuerCorrelationId: '',
    //   // vcHash: '',
    //   localeBranding: [{
    //     alias: 'abc'
    //   }]
    // })

    return this.store.removeCredentialBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.addCredentialLocaleBranding} */
  private async addCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding> {
    const localeBranding: Array<ILocaleBranding> = await this.setAdditionalImageAttributes(args.localeBranding)
    const addCredentialLocaleBrandingArgs: IAddCredentialLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    return this.store.addCredentialLocaleBranding(addCredentialLocaleBrandingArgs)
  }

  /** {@inheritDoc IIssuanceBranding.getCredentialLocaleBranding} */
  private async getCredentialLocaleBranding(args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialBranding>> {
    return this.store.getCredentialLocaleBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.removeCredentialLocaleBranding} */
  private async removeCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<void> {
    return this.store.removeCredentialLocaleBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.addIssuerBranding} */
  private async addIssuerBranding(args: IAddIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    const localeBranding: Array<ILocaleBranding> = await this.setAdditionalImageAttributes(args.localeBranding)
    const issuerBranding: IBasicIssuerBranding = {
      ...args,
      localeBranding,
    }

    return this.store.addIssuerBranding(issuerBranding)
  }

  /** {@inheritDoc IIssuanceBranding.getIssuerBranding} */
  private async getIssuerBranding(args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>> {
    return this.store.getIssuerBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.updateIssuerBranding} */
  private async updateIssuerBranding(args: IUpdateIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    return this.store.updateIssuerBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.IIssuanceBranding} */
  private async removeIssuerBranding(args: IRemoveIssuerBrandingArgs, context: IRequiredContext): Promise<void> {
    return this.store.removeIssuerBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.addIssuerLocaleBranding} */
  private async addIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding> {
    const localeBranding: Array<ILocaleBranding> = await this.setAdditionalImageAttributes(args.localeBranding)
    const addIssuerLocaleBrandingArgs: IAddIssuerLocaleBrandingArgs = {
      ...args,
      localeBranding,
    }

    return this.store.addIssuerLocaleBranding(addIssuerLocaleBrandingArgs)
  }

  /** {@inheritDoc IIssuanceBranding.getIssuerLocaleBranding} */
  private async getIssuerLocaleBranding(args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerBranding>> {
    return this.store.getIssuerLocaleBranding(args)
  }

  /** {@inheritDoc IIssuanceBranding.removeIssuerLocaleBranding} */
  private async removeIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<void> {
    return this.store.removeIssuerLocaleBranding(args)
  }

  private async setAdditionalImageAttributes(localeBranding: Array<ILocaleBranding>): Promise<Array<ILocaleBranding>> {
    return Promise.all(
      localeBranding.map(
        async (localeBranding: ILocaleBranding): Promise<ILocaleBranding> => ({
          ...localeBranding,
          ...(localeBranding.logo && {
            logo: {
              ...localeBranding.logo,
              ...(localeBranding.logo.uri && {
                ...(await this.getAdditionalImageAttributes(localeBranding.logo.uri)),
              }),
            },
          }),
          ...(localeBranding.background && {
            background: {
              ...localeBranding.background,
              ...(localeBranding.background.image && {
                image: {
                  ...localeBranding.background.image,
                  ...(localeBranding.background.image.uri && {
                    ...(await this.getAdditionalImageAttributes(localeBranding.background.image.uri)),
                  }),
                },
              }),
            },
          }),
        })
      )
    )
  }

  private async getAdditionalImageAttributes(uri: string): Promise<IAdditionalImageAttributes> {
    // TODO refactor to central place
    const IS_IMAGE_URL_REGEX: RegExp = /\.(jpg|jpeg|png|gif|bmp|webp)$/i
    const IS_IMAGE_URI_REGEX: RegExp = /^data:image\/(png|jpg|jpeg|bmp|gif|webp);base64,/

    if (IS_IMAGE_URI_REGEX.test(uri)) {
      const base64Content: string = await extractBase64FromDataURI(uri)
      const dimensions: IImageDimensions = await getImageDimensions(base64Content)
      return {
        type: await getImageType(uri),
        dimensions,
      }
    } else if (IS_IMAGE_URL_REGEX.test(uri)) {
      const base64Content: string = (await downloadImage(uri)).toString('base64')
      const dimensions: IImageDimensions = await getImageDimensions(base64Content)
      return {
        type: await getImageType(uri),
        base64Content,
        dimensions,
      }
    }

    return Promise.reject(Error('invalid image uri'))
  }
}
