/**
 * Represents the metadata associated with a specific SD-JWT VC type.
 */
export interface SdJwtTypeMetadata {
  /**
   * REQUIRED. The VC type URI.
   */
  vct: string

  /**
   * OPTIONAL. A human-readable name for the type.
   */
  name?: string

  /**
   * OPTIONAL. A human-readable description for the type.
   */
  description?: string

  /**
   * OPTIONAL. A URI of another type that this type extends.
   */
  extends?: string

  /**
   * OPTIONAL. Integrity metadata string for the 'extends' field.
   */
  ['extends#integrity']?: string

  /**
   * OPTIONAL. URL pointing towards a JSON Schema document describing the VC's structure.
   */
  schema_uri?: string

  /**
   * OPTIONAL. Integrity metadata string for the 'schema_uri' field.
   */
  ['schema_uri#integrity']?: string

  /**
   * OPTIONAL. Display metadata for various languages.
   */
  display?: Array<SdJwtTypeDisplayMetadata>

  /**
   * OPTIONAL. Metadata for the claims within the VC.
   */
  claims?: Array<SdJwtClaimMetadata>
}

/**
 * Represents the metadata associated with a specific SD-JWT claim.
 */
export interface SdJwtClaimMetadata {
  /**
   * REQUIRED. An array indicating the claim or claims that are being addressed.
   */
  path: Array<SdJwtClaimPath>

  /**
   * OPTIONAL. Display information for the claim.
   */
  display?: Array<SdJwtClaimDisplayMetadata>

  /**
   * OPTIONAL. A string indicating whether the claim is selectively disclosable.
   */
  sd?: SdJwtClaimSelectiveDisclosure

  /**
   * OPTIONAL. A string defining the ID of the claim for reference in the SVG template.
   */
  svg_id?: string
}

/**
 * Represents claim display metadata for a specific language.
 */
export interface SdJwtClaimDisplayMetadata {
  /**
   * REQUIRED. Language tag for the display information.
   */
  lang: string

  /**
   * REQUIRED. A human-readable label for the claim, intended for end users.
   */
  label: string

  /**
   * REQUIRED. A human-readable description for the claim, intended for end users.
   */
  description?: string
}

/**
 * Represents display metadata for a specific language.
 */
export interface SdJwtTypeDisplayMetadata {
  /**
   * REQUIRED. Language tag for the display information.
   */
  lang: string

  /**
   * REQUIRED. Human-readable name for the type.
   */
  name: string

  /**
   * OPTIONAL. Human-readable description for the type.
   */
  description?: string

  /**
   * OPTIONAL. Rendering metadata for the type.
   */
  rendering?: SdJwtTypeRenderingMetadata
}

/**
 * Contains rendering metadata for different methods.
 */
export interface SdJwtTypeRenderingMetadata {
  /**
   * OPTIONAL. Simple rendering method metadata.
   */
  simple?: SdJwtSimpleRenderingMetadata

  /**
   * OPTIONAL. Metadata for SVG templates.
   */
  svg_template?: Array<SdJwtSVGTemplateMetadata>
}

/**
 * Represents metadata for simple rendering.
 */
export interface SdJwtSimpleRenderingMetadata {
  /**
   * OPTIONAL. Metadata for the logo image.
   */
  logo?: SdJwtLogoMetadata

  /**
   * OPTIONAL. Background color for the credential.
   */
  background_color?: string

  /**
   * OPTIONAL. Text color for the credential.
   */
  text_color?: string
}

/**
 * Represents metadata for a logo.
 */
export interface SdJwtLogoMetadata {
  /**
   * REQUIRED. URI pointing to the logo image.
   */
  uri: string

  /**
   * OPTIONAL. Integrity metadata string for the 'uri' field.
   */
  ['uri#integrity']?: string

  /**
   * OPTIONAL. Alternative text for the logo image.
   */
  alt_text?: string
}

/**
 * Represents metadata for SVG templates.
 */
export interface SdJwtSVGTemplateMetadata {
  /**
   * REQUIRED. URI pointing to the SVG template.
   */
  uri: string

  /**
   * OPTIONAL. Integrity metadata string for the 'uri' field.
   */
  ['uri#integrity']?: string

  /**
   * OPTIONAL. Properties for the SVG template.
   */
  properties?: SdJwtSVGTemplateProperties
}

/**
 * Contains properties for SVG templates.
 */
export interface SdJwtSVGTemplateProperties {
  /**
   * OPTIONAL. The orientation for which the SVG template is optimized.
   */
  orientation?: string

  /**
   * OPTIONAL. The color scheme for which the SVG template is optimized.
   */
  color_scheme?: string
}

/**
 * A string indicates that the respective key is to be selected.
 * A null value indicates that all elements of the currently selected array(s) are to be selected.
 * A non-negative integer indicates that the respective index in an array is to be selected.
 */
export type SdJwtClaimPath = string | null | number

/**
 * always: The Issuer MUST make the claim selectively disclosable.
 * allowed: The Issuer MAY make the claim selectively disclosable.
 * never: The Issuer MUST NOT make the claim selectively disclosable.
 */
export type SdJwtClaimSelectiveDisclosure = 'always' | 'allowed' | 'never'

export type SdJwtTypeHasher = (input: any, alg?: string) => string
