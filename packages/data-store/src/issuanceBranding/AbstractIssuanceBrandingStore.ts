import {
  IAddCredentialBrandingArgs,
  IAddCredentialLocaleBrandingArgs,
  IAddIssuerBrandingArgs,
  IAddIssuerLocaleBrandingArgs,
  ICredentialBranding,
  ICredentialLocaleBranding,
  IGetCredentialBrandingArgs,
  IGetCredentialLocaleBrandingArgs,
  IGetIssuerBrandingArgs,
  IGetIssuerLocaleBrandingArgs,
  IIssuerBranding,
  IIssuerLocaleBranding,
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
  public abstract addCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs): Promise<ICredentialBranding>
  public abstract getCredentialLocaleBranding(args?: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialLocaleBranding>>
  public abstract updateCredentialLocaleBranding(args: IUpdateCredentialLocaleBrandingArgs): Promise<ICredentialLocaleBranding>
  public abstract removeCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs): Promise<void>
  public abstract addIssuerBranding(args: IAddIssuerBrandingArgs): Promise<IIssuerBranding>
  public abstract getIssuerBranding(args?: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>>
  public abstract updateIssuerBranding(args: IUpdateIssuerBrandingArgs): Promise<IIssuerBranding>
  public abstract removeIssuerBranding(args: IRemoveIssuerBrandingArgs): Promise<void>
  public abstract addIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs): Promise<IIssuerBranding>
  public abstract getIssuerLocaleBranding(args?: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerLocaleBranding>>
  public abstract updateIssuerLocaleBranding(args: IUpdateIssuerLocaleBrandingArgs): Promise<IIssuerLocaleBranding>
  public abstract removeIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs): Promise<void>
}
