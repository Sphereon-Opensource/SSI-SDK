import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { IAgentPlugin } from '@veramo/core'
import { CountryResponse, Reader } from 'mmdb-lib'
import {
  AnomalyDetectionLookupLocationArgs,
  AnomalyDetectionLookupLocationResult,
  IAnomalyDetection,
  IRequiredContext,
  schema
} from '../index'

type DnsLookupFn = (hostname: string) => Promise<string>

export const anomalyDetectionMethods: Array<string> = ['lookupLocation']

/**
 * {@inheritDoc IAnomalyDetection}
 */
export class AnomalyDetection implements IAgentPlugin {
  readonly schema = schema.IAnomalyDetection
  private readonly db: Uint8Array
  private readonly dnsLookup?: DnsLookupFn
  readonly methods: IAnomalyDetection = {
    anomalyDetectionLookupLocation: this.anomalyDetectionLookupLocation.bind(this)
  }

  constructor(args: { geoIpDB: Uint8Array; dnsLookupCallback?: DnsLookupFn }) {
    const { geoIpDB, dnsLookupCallback } = { ...args }
    if (geoIpDB === undefined || geoIpDB === null) {
      throw new Error('The geoIpDB argument is required')
    }
    this.db = geoIpDB
    this.dnsLookup = dnsLookupCallback
  }

  private async anomalyDetectionLookupLocation(
    args: AnomalyDetectionLookupLocationArgs,
    context: IRequiredContext
  ): Promise<AnomalyDetectionLookupLocationResult> {
    const { ipOrHostname, storeId, namespace } = { ...args }
    const reader = new Reader<CountryResponse>(Buffer.from(this.db))
    const ipv4Reg = '(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])'
    const ipv6Reg =
      '(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))'
    let result: CountryResponse | null

    if (!new RegExp(ipv4Reg).test(ipOrHostname) && !new RegExp(ipv6Reg).test(ipOrHostname)) {
      const ip = await this.resolveDns(ipOrHostname)
      result = reader.get(ip)
    } else {
      result = reader.get(ipOrHostname)
    }

    const lookupResult = {
      continent: result?.continent?.code,
      country: result?.country?.iso_code
    }

    if (contextHasPlugin(context, 'geolocationStorePersistLocation'))
      await context.agent.geolocationStorePersistLocation({
        namespace,
        storeId,
        ipOrHostname,
        locationArgs: lookupResult
      })
    return Promise.resolve(lookupResult)
  }

  private async resolveDns(hostname: string): Promise<string> {
    if (this.dnsLookup) {
      return this.dnsLookup(hostname)
    }

    // Fallback to Node.js dns
    let dns
    try {
      dns = eval('require("dns")')
    } catch (e) {
      console.error(e)
      throw new Error(
        `DNS resolution not available on this platform, use the dnsLookupCallback in the AnomalyDetection constructor to implement DNS resolution for your platform.\r\n${e.message}`
      )
    }

    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (error: NodeJS.ErrnoException | null, address: string, family: number) => {
        if (error) {
          reject(error)
          return
        }
        resolve(address)
      })
    })
  }
}
