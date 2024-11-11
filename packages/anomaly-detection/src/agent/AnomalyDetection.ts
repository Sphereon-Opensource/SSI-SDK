import {IAgentPlugin} from "@veramo/core";
import {IAnomalyDetection, LookupLocationArgs, LookupLocationResult, schema} from "../index";
import * as fs from 'fs';
import * as dns from 'dns'
import * as mmdb from 'mmdb-lib'
import {CountryResponse} from 'mmdb-lib'

export const anomalyDetectionMethods: Array<string> = [
'lookupLocation'
]

/**
 * {@inheritDoc IAnomalyDetection}
 */
export class AnomalyDetection implements IAgentPlugin {
  readonly schema = schema.IAnomalyDetection
  private readonly db: Buffer
  readonly methods: IAnomalyDetection = {
    lookupLocation: this.lookupLocation.bind(this)
  }

  constructor(args?: { geoIpDBPath: string }) {
    const { geoIpDBPath='/opt/GeoLite2-Country.mmdb' } = { ...args }
    this.db = fs.readFileSync(geoIpDBPath)
  }

  private async lookupLocation(args: LookupLocationArgs): Promise<LookupLocationResult> {
    const { ipOrHostname } = { ...args }
    const reader = new mmdb.Reader<CountryResponse>(this.db)
    const ipv4Reg = "(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])"
    const ipv6Reg = "(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))"
    let result: CountryResponse | null

    if (!new RegExp(ipv4Reg).test(ipOrHostname) && !new RegExp(ipv6Reg).test(ipOrHostname)) {
      const ip = await this.dnsLookupPromise({ hostname: ipOrHostname })
      result = reader.get(ip)
    } else {
      result = reader.get(ipOrHostname)
    }

    if (result !== undefined && result !== null) {
      return Promise.resolve({
        continent: result?.continent?.code,
        country: result?.country?.iso_code
      })
    }
    return null
  }

  private async dnsLookupPromise(args: { hostname: string }): Promise<string> {
    const { hostname } = { ...args }
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (error, ip) => {
        if (error) {
          reject(error)
        }
        resolve(ip)
      })
    })
  }
}
