declare module '@sphereon/vc-status-list' {
  export class StatusList {
    constructor(options?: { length?: number; buffer?: ArrayBuffer })

    length: number

    setStatus(index: number, status: boolean): void

    getStatus(index: number): boolean

    encode(): Promise<string>

    static decode({ encodedList }: { encodedList: string }): Promise<StatusList>
  }

  export async function createList({ length }: { length: number }): Promise<StatusList>

  export async function decodeList({ encodedList }: { encodedList: any }): Promise<StatusList>

  export async function createCredential({ id, list, statusPurpose }: { id: string; list: StatusList; statusPurpose: string }): Promise<any>

  export async function checkStatus({
    credential,
    documentLoader,
    suite,
    verifyStatusListCredential,
    verifyMatchingIssuers,
  }?: {
    credential: any
    documentLoader: (iri: string) => Promise<any>
    suite?: any
    verifyStatusListCredential?: boolean
    verifyMatchingIssuers?: boolean
  }): Promise<{ verified: boolean; error?: any }>

  export function statusTypeMatches({ credential }: { credential: any }): boolean

  export function assertStatusList2021Context({ credential }: { credential: any }): void

  export function getCredentialStatus({ credential, statusPurpose }: { credential: any; statusPurpose: 'revocation' | 'suspension' }): any

  // Add more type declarations for the functions and utilities here

  export function isArrayOfObjects(x: any): boolean
}
