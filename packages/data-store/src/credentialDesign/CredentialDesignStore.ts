import {
  AbstractCredentialDesignStore,
  AddCredentialDesignArgs,
  CredentialDesign,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  RemoveCredentialDesignArgs,
  UpdateCredentialDesignArgs,
} from '@sphereon/ssi-sdk.data-store-types'
import { OrPromise } from '@sphereon/ssi-types'
import Debug from 'debug'
import { BaseEntity, DataSource, type FindOptionsWhere, In, type Repository } from 'typeorm'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:credential-design-store')

export class CredentialDesignStore extends AbstractCredentialDesignStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  private readonly META_DATA_SET_SELECT = `
  *,
  meta_data_keys:meta_data_keys!fk_meta_data_set (
    *,
    meta_data_values:meta_data_values!fk_meta_data_keys (*)
  ),
  schema_definition:schema_definition!fk_schemadef_metadata (
    *,
    form_step_to_schema_definition:form_step_to_schema_definition!fk_schema_definition (*)
  ),
  credential_design_branding:credential_design_branding!fk_credentialdesignbranding_metadata (
    *,
    logo:ImageAttributes!fk_branding_logo (
      *,
      dimensions:ImageDimensions!FK_ImageAttributes_dimensionsId (*)
    ),
    background_image:ImageAttributes!fk_branding_background_image (
      *,
      dimensions:ImageDimensions!FK_ImageAttributes_dimensionsId (*)
    )
  )
`

  getOrCreateFormStepId(): Promise<string> {
    const client = supabaseServiceClient()
    const formStepResult = await client
    .from('form_step')
    .select('*')
    .eq('form_id', 'credentialIssuanceWizard')
    .single()

    if (formStepResult.data) {
      return formStepResult.data.id
    }

    const formStep = {
      form_id: 'credentialIssuanceWizard',
      step_nr: 1,
      order: 1,
    }
    const result = await client.from('form_step').insert([formStep]).single()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return (result.data as any).id
  }

  getCredentialDesign = async (args: GetCredentialDesignArgs): Promise<CredentialDesign> => {
    try {
      const client = supabaseServiceClient()
      const result = await client
      .from('meta_data_set')
      .select(META_DATA_SET_SELECT)
      .eq('id', id)
      .single()

      return new CredentialDesignEntity(result.data).asDTO()
    } catch (error) {
      throw new ServiceErrorImpl({
        code: 'FETCH_FAILED',
        message: `Failed to fetch credential design: ${error}`,
        statusCode: 500,
        cause: error,
      })
    }
  }

  getCredentialDesigns = async (args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>> => {
    try {
      const client = supabaseServiceClient()
      const formStepId = await getOrCreateFormStepId()
      const credentialDesigns = data as StoreCredentialDesignArgs[]

      const results = await Promise.all(
        credentialDesigns.map((design: StoreCredentialDesignArgs) =>
          client.rpc('insert_credential_design', {
            p_identifier: design.name,
            p_credential_format: design.options.format,
            p_schema: design.schema,
            p_ui_schema: design.uiSchema,
            p_form_step_id: formStepId,
            p_vct: (design.options as SdJwtFormatOptions).vct ?? null,
            p_scope: design.options.scope ?? null,
            p_cryptographic_binding_methods_supported: design.options.cryptographicBindingMethodsSupported ?? [],
            p_credential_signing_alg_values_supported: design.options.credentialSigningAlgValuesSupported ?? [],
            p_proof_types_supported: design.options.proofTypesSupported ?? {},
            p_advanced_schema: design.isAdvancedSchema ?? false,
            p_branding: design.branding
              ? {
                logo: design.branding.logo,
                background_image: design.branding.backgroundImage,
                text_color: design.branding.textColor,
                background_color: design.branding.backgroundColor,
              }
              : null,
          }),
        ),
      )

      return results.map((result: any) => {
        if (result.error) {
          throw new Error(result.error.message)
        }
        return new CredentialDesignEntity(result.data).asDTO()
      })
    } catch (error) {
      throw new ServiceErrorImpl({
        code: 'CREATE_FAILED',
        message: `Failed to create credential designs: ${error}`,
        statusCode: 500,
        cause: error,
      })
    }
  }

  addCredentialDesign = async (args: AddCredentialDesignArgs): Promise<CredentialDesign> => {
    try {
      const client = supabaseServiceClient()
      const vars = data as any
      const { name, schema, uiSchema, branding, statusListUri, options, isAdvancedSchema } = vars

      const enrichedSchema = enrichSchemaWithStatusList(enrichSchemaWithDisclosureFrame(schema), statusListUri)
      const formStepId = await getOrCreateFormStepId()

      const { data: result, error } = await client.rpc('insert_credential_design', {
        p_identifier: name,
        p_credential_format: options.format,
        p_schema: enrichedSchema,
        p_ui_schema: uiSchema,
        p_form_step_id: formStepId,
        p_vct: options.vct ?? null,
        p_scope: options.scope ?? null,
        p_cryptographic_binding_methods_supported: options.cryptographicBindingMethodsSupported ?? [],
        p_credential_signing_alg_values_supported: options.credentialSigningAlgValuesSupported ?? [],
        p_proof_types_supported: options.proofTypesSupported ?? {},
        p_advanced_schema: isAdvancedSchema ?? false,
        p_branding: branding
          ? {
            logo: branding.logo,
            background_image: branding.backgroundImage,
            text_color: branding.textColor,
            background_color: branding.backgroundColor,
          }
          : null,
      })

      if (error) {
        throw new Error(error.message)
      }

      return new CredentialDesignEntity(result).asDTO()
    } catch (error) {
      if (error instanceof ServiceErrorImpl) throw error
      throw new ServiceErrorImpl({
        code: 'CREATE_FAILED',
        message: `Failed to create credential design: ${error}`,
        statusCode: 500,
        cause: error,
      })
    }
  }

  updateCredentialDesign = async (args: UpdateCredentialDesignArgs): Promise<CredentialDesign> => {
    try {
      const client = supabaseServiceClient()
      const vars = data as any
      const { name, schema, uiSchema, branding, options, isAdvancedSchema } = vars

      if (options.format !== 'dc+sd-jwt' && options.format !== 'vc+sd-jwt') {
        delete options.vct
      }

      const { data: result, error } = await client.rpc('update_credential_design', {
        p_set_id: id,
        p_identifier: name,
        p_credential_format: options.format,
        p_schema: schema,
        p_ui_schema: uiSchema,
        p_vct: options.vct ?? null,
        p_scope: options.scope ?? null,
        p_cryptographic_binding_methods_supported: options.cryptographicBindingMethodsSupported ?? [],
        p_credential_signing_alg_values_supported: options.credentialSigningAlgValuesSupported ?? [],
        p_proof_types_supported: options.proofTypesSupported ?? {},
        p_advanced_schema: isAdvancedSchema ?? false,
        p_branding: branding
          ? {
            logo: branding.logo,
            background_image: branding.backgroundImage,
            text_color: branding.textColor,
            background_color: branding.backgroundColor,
          }
          : null,
      })

      if (error) {
        throw new Error(error.message)
      }

      return result
    } catch (error) {
      if (error instanceof ServiceErrorImpl) throw error
      throw new ServiceErrorImpl({
        code: 'UPDATE_FAILED',
        message: `Failed to update credential design: ${error}`,
        statusCode: 500,
        cause: error,
      })
    }
  }

  removeCredentialDesign = async (args: RemoveCredentialDesignArgs): Promise<void> => {
    try {
      const client = supabaseServiceClient()
      const { error } = await client.from('meta_data_set').delete().eq('id', id).single()

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      if (error instanceof ServiceErrorImpl) throw error
      throw new ServiceErrorImpl({
        code: 'DELETE_FAILED',
        message: `Failed to delete credential design: ${error}`,
        statusCode: 500,
        cause: error,
      })
    }
  }

}
