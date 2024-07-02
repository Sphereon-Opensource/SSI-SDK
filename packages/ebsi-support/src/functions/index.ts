import { ApiOpts, EbsiEnvironment } from '../types/IEbsiSupport'

export const getEbsiApiBaseUrl = ({
  environment = 'pilot',
  version,
  system = 'pilot',
}: ApiOpts & { system?: 'authorisation' | 'conformance' | 'did-registry' | EbsiEnvironment }) => {
  return `https://api-${environment}.ebsi.eu/${system}/${version}`
}

export const wait = async (timeoutInMS: number) => {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMS))
}

export * from './Attestation'
