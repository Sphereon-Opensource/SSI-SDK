import {
  IAddCredentialBrandingArgs,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  ICredentialBranding,
  IGetCredentialBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerBrandingArgs,
  IGetIssuerLocaleBrandingArgs,
  IIssuerBranding,
  IRemoveCredentialBrandingArgs,
  IRemoveCredentialLocaleBrandingArgs,
  IRemoveIssuerBrandingArgs,
  IRemoveIssuerLocaleBrandingArgs,
  IUpdateCredentialBrandingArgs,
  IUpdateCredentialLocaleBrandingArgs,
  IUpdateIssuerBrandingArgs,
  IUpdateIssuerLocaleBrandingArgs,
} from '../types'

export abstract class AbstractIssuanceBrandingStore {
  public abstract addCredentialBranding(args: IAddCredentialBrandingArgs): Promise<ICredentialBranding>
  public abstract getCredentialBranding(args?: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>>
  public abstract updateCredentialBranding(args: IUpdateCredentialBrandingArgs): Promise<ICredentialBranding>
  public abstract removeCredentialBranding(args: IRemoveCredentialBrandingArgs): Promise<void>

  // TODO maybe we can get these with same function issuer / credential
  public abstract addCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs): Promise<ICredentialBranding>
  public abstract getCredentialLocaleBranding(args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialBranding>>
  public abstract updateCredentialLocaleBranding(args: IUpdateCredentialLocaleBrandingArgs): Promise<ICredentialBranding>
  public abstract removeCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs): Promise<void>

  public abstract addIssuerBranding(args: IAddIssuerBrandingArgs): Promise<IIssuerBranding>
  public abstract getIssuerBranding(args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>>
  public abstract updateIssuerBranding(args: IUpdateIssuerBrandingArgs): Promise<IIssuerBranding>
  public abstract removeIssuerBranding(args: IRemoveIssuerBrandingArgs): Promise<void>

  public abstract addIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs): Promise<IIssuerBranding>
  public abstract getIssuerLocaleBranding(args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerBranding>>
  public abstract updateIssuerLocaleBranding(args: IUpdateIssuerLocaleBrandingArgs): Promise<IIssuerBranding>
  public abstract removeIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs): Promise<void>

  // TODO get all

  //public abstract getBranding(args: IGetBrandingArgs): Promise<something>
}
