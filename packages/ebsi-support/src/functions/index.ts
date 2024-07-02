import { ApiOpts, EbsiEnvironment } from '../types/IEbsiSupport'

export const getEbsiApiBaseUrl = ({
  environment = 'pilot',
  version,
  system = 'pilot',
}: ApiOpts & { system?: 'authorisation' | 'conformance' | 'did-registry' | EbsiEnvironment }) => {
  return `https://api-${environment}.ebsi.eu/${system}/${version}`
}

export const wait = async (callback: (arg: void) => void, timeoutInMS: number) => { return new Promise( _resolve => setTimeout(callback, timeoutInMS)); }

export * from './Attestation'
