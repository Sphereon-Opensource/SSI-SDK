export { AzureKeyVaultKeyManagementSystem } from './AzureKeyVaultKeyManagementSystem'

export interface KeyMetadata {
  algorithms?: string[]

  [x: string]: any
}
