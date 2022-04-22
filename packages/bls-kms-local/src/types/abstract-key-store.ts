import { IKey } from './IIdentifier'

export abstract class AbstractKeyStore {
  abstract import(args: Partial<IKey>): Promise<boolean>
  abstract get(args: { kid: string }): Promise<IKey>
  abstract delete(args: { kid: string }): Promise<boolean>
  abstract list(args: {}): Promise<Array<IKey>>
}
