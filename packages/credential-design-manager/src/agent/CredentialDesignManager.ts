import { IAgentPlugin } from '@veramo/core'
import {
  AbstractCredentialDesignStore,
  CredentialDesign,
  NonPersistedCredentialDesign,
  NonPersistedMetadataKey,
  NonPersistedSchemaDefinition,
  ValueType,
} from '@sphereon/ssi-sdk.data-store-types'
import { CredentialDesignCountResult, FormStepGetOrCreateResult, RemoveCredentialDesignResult, schema } from '../index'
import {
  AddCredentialDesignArgs,
  CredentialConfigurationOptions,
  CredentialDesignBrandingInput,
  CredentialDesignCountArgs,
  FormStepGetOrCreateArgs,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  ICredentialDesignManager,
  RemoveCredentialDesignArgs,
  RequiredContext,
  UpdateCredentialDesignArgs,
} from '../types/ICredentialDesignManager'

export const credentialDesignManagerMethods: Array<string> = [
  'cdmGetCredentialDesign',
  'cdmGetCredentialDesigns',
  'cdmAddCredentialDesign',
  'cdmUpdateCredentialDesign',
  'cdmRemoveCredentialDesign',
  'cdmCredentialDesignCount',
  'cdmFormStepGetOrCreate',
]

/**
 * {@inheritDoc ICredentialDesignManager}
 */
export class CredentialDesignManager implements IAgentPlugin {
  readonly schema = schema.ICredentialDesignManager
  readonly methods: ICredentialDesignManager = {
    cdmGetCredentialDesign: this.cdmGetCredentialDesign.bind(this),
    cdmGetCredentialDesigns: this.cdmGetCredentialDesigns.bind(this),
    cdmAddCredentialDesign: this.cdmAddCredentialDesign.bind(this),
    cdmUpdateCredentialDesign: this.cdmUpdateCredentialDesign.bind(this),
    cdmRemoveCredentialDesign: this.cdmRemoveCredentialDesign.bind(this),
    cdmCredentialDesignCount: this.cdmCredentialDesignCount.bind(this),
    cdmFormStepGetOrCreate: this.cdmFormStepGetOrCreate.bind(this),
  }

  private readonly store: AbstractCredentialDesignStore

  constructor(options: { store: AbstractCredentialDesignStore }) {
    this.store = options.store
  }

  /** {@inheritDoc ICredentialDesignManager.cdmGetCredentialDesign} */
  private async cdmGetCredentialDesign(args: GetCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    return this.store.getCredentialDesign({ credentialDesignId: args.credentialDesignId })
  }

  /** {@inheritDoc ICredentialDesignManager.cdmGetCredentialDesigns} */
  private async cdmGetCredentialDesigns(args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>> {
    return this.store.getCredentialDesigns({
      filter: args?.filter,
      limit: args?.limit,
      offset: args?.offset,
    })
  }

  /** {@inheritDoc ICredentialDesignManager.cdmAddCredentialDesign} */
  private async cdmAddCredentialDesign(args: AddCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    const design = this.buildDesign(args)

    let formStepId: string | undefined
    if (args.formStepId) {
      formStepId = await this.store.formStepGetOrCreate({ formStepId: args.formStepId })
    }

    return this.store.addCredentialDesign({
      identifier: args.identifier,
      tenantId: args.tenantId,
      design,
      formStepId,
    })
  }

  /** {@inheritDoc ICredentialDesignManager.cdmUpdateCredentialDesign} */
  private async cdmUpdateCredentialDesign(args: UpdateCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign> {
    const design = this.buildDesign(args)
    return this.store.updateCredentialDesign({
      credentialDesignId: args.credentialDesignId,
      identifier: args.identifier,
      tenantId: args.tenantId,
      design,
    })
  }

  /** {@inheritDoc ICredentialDesignManager.cdmRemoveCredentialDesign} */
  private async cdmRemoveCredentialDesign(args: RemoveCredentialDesignArgs, context: RequiredContext): Promise<RemoveCredentialDesignResult> {
    return this.store.removeCredentialDesign({ credentialDesignId: args.credentialDesignId }).then(() => ({ result: true }))
  }

  /** {@inheritDoc ICredentialDesignManager.cdmCredentialDesignCount} */
  private async cdmCredentialDesignCount(args: CredentialDesignCountArgs, context: RequiredContext): Promise<CredentialDesignCountResult> {
    const count = await this.store.countCredentialDesigns({ filter: args.filter })
    return { count }
  }

  /** {@inheritDoc ICredentialDesignManager.cdmFormStepGetOrCreate} */
  private async cdmFormStepGetOrCreate(args: FormStepGetOrCreateArgs, context: RequiredContext): Promise<FormStepGetOrCreateResult> {
    const formStepId = await this.store.formStepGetOrCreate({ formStepId: args.formId })
    return { formStepId }
  }

  /**
   * Translate high-level create/update args into the store-level NonPersistedCredentialDesign format.
   *
   * Maps:
   * - options fields → metadataKeys (format, vct, scope, etc.)
   * - schema → schemaDefinition with schemaType 'Data'
   * - uiSchema → schemaDefinition with schemaType 'UI_Form'
   * - branding → NonPersistedCredentialDesignBranding
   */
  private buildDesign(args: {
    identifier: string
    schema: Record<string, unknown>
    uiSchema: Record<string, unknown> | Array<Record<string, unknown>>
    options: CredentialConfigurationOptions
    isAdvancedSchema?: boolean
    statusListUri?: string
    branding?: CredentialDesignBrandingInput
  }): NonPersistedCredentialDesign {
    const metadataKeys = this.buildMetadataKeys(args.options, args.isAdvancedSchema, args.statusListUri)
    const schemaDefinitions = this.buildSchemaDefinitions(args.identifier, args.schema, args.uiSchema)
    const branding = args.branding ? this.buildBranding(args.branding) : undefined

    return {
      identifier: args.identifier,
      metadataKeys,
      schemaDefinitions,
      branding,
    }
  }

  private buildMetadataKeys(
    options: CredentialConfigurationOptions,
    isAdvancedSchema?: boolean,
    statusListUri?: string,
  ): Array<NonPersistedMetadataKey> {
    const keys: Array<NonPersistedMetadataKey> = []

    keys.push({
      key: 'format',
      valueType: ValueType.Text,
      metadataValues: [{ index: 0, textValue: options.format }],
    })

    if (options.vct !== undefined) {
      keys.push({
        key: 'vct',
        valueType: ValueType.Text,
        metadataValues: [{ index: 0, textValue: options.vct }],
      })
    }

    if (options.scope !== undefined) {
      keys.push({
        key: 'scope',
        valueType: ValueType.Text,
        metadataValues: [{ index: 0, textValue: options.scope }],
      })
    }

    if (options.cryptographicBindingMethodsSupported?.length) {
      keys.push({
        key: 'cryptographicBindingMethodsSupported',
        valueType: ValueType.Text,
        metadataValues: options.cryptographicBindingMethodsSupported.map((method, index) => ({
          index,
          textValue: method,
        })),
      })
    }

    if (options.credentialSigningAlgValuesSupported?.length) {
      keys.push({
        key: 'credentialSigningAlgValuesSupported',
        valueType: ValueType.Text,
        metadataValues: options.credentialSigningAlgValuesSupported.map((alg, index) => ({
          index,
          textValue: alg,
        })),
      })
    }

    if (options.proofTypesSupported && Object.keys(options.proofTypesSupported).length > 0) {
      keys.push({
        key: 'proofTypesSupported',
        valueType: ValueType.Text,
        metadataValues: [{ index: 0, textValue: JSON.stringify(options.proofTypesSupported) }],
      })
    }

    if (isAdvancedSchema !== undefined) {
      keys.push({
        key: 'isAdvancedSchema',
        valueType: ValueType.Boolean,
        metadataValues: [{ index: 0, booleanValue: isAdvancedSchema }],
      })
    }

    if (statusListUri !== undefined) {
      keys.push({
        key: 'statusListUri',
        valueType: ValueType.Text,
        metadataValues: [{ index: 0, textValue: statusListUri }],
      })
    }

    return keys
  }

  private buildSchemaDefinitions(
    identifier: string,
    schema: Record<string, unknown>,
    uiSchema: Record<string, unknown> | Array<Record<string, unknown>>,
  ): Array<NonPersistedSchemaDefinition> {
    return [
      {
        correlationId: identifier,
        schemaType: 'Data',
        entityType: 'VC',
        schema: JSON.stringify(schema),
      },
      {
        correlationId: identifier,
        schemaType: 'UI_Form',
        entityType: 'VC',
        schema: JSON.stringify(uiSchema),
      },
    ]
  }

  private buildBranding(input: CredentialDesignBrandingInput): NonPersistedCredentialDesign['branding'] {
    return {
      textColor: input.textColor,
      backgroundColor: input.backgroundColor,
      logo: input.logo,
      backgroundImage: input.backgroundImage,
    }
  }
}
