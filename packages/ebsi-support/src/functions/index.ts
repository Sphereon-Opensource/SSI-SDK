import { ApiOpts, EbsiEnvironment } from '../types/IEbsiSupport'

export const getBaseUrl = ({
  environment = 'pilot',
  version,
  system = 'pilot',
}: ApiOpts & { system?: 'authorisation' | 'conformance' | 'did-registry' | EbsiEnvironment }) => {
  return `https://api-${environment}.ebsi.eu/${system}/${version}`
}

export * from './Attestation'
