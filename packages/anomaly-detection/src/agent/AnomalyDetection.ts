import {IAgentPlugin} from '@veramo/core'
import {
  AnomalyDetectionLocationPersistArgs,
  AnomalyDetectionLookupLocationArgs,
  AnomalyDetectionLookupLocationResult,
  IAnomalyDetection,
  schema
} from '../index'
import {CountryResponse, Reader} from 'mmdb-lib'
import {IKeyValueStore, KeyValueStore, ValueStoreType} from "@sphereon/ssi-sdk.kv-store-temp";

type DnsLookupFn = (hostname: string) => Promise<string>

export const anomalyDetectionMethods: Array<string> = ['lookupLocation']

/**
 * {@inheritDoc IAnomalyDetection}
 */
export class AnomalyDetection implements IAgentPlugin {
  readonly schema = schema.IAnomalyDetection
  private readonly db: Buffer
  private readonly dnsLookup?: DnsLookupFn
  private readonly defaultStoreId: string
  private readonly defaultNamespace: string
  private readonly _dnsLookupStore: Map<string, IKeyValueStore<AnomalyDetectionLookupLocationResult>>

  readonly methods: IAnomalyDetection = {
    anomalyDetectionLookupLocation: this.anomalyDetectionLookupLocation.bind(this),
  }

  constructor(args: {
    geoIpDB: Buffer;
    dnsLookupCallback?: DnsLookupFn;
    defaultStoreId: string;
    defaultNamespace: string;
    dnsLookupStore?: Map<string, IKeyValueStore<AnomalyDetectionLookupLocationResult>> | IKeyValueStore<AnomalyDetectionLookupLocationResult>
  }) {
    const { geoIpDB, dnsLookupCallback } = { ...args }
    if (geoIpDB === undefined || geoIpDB === null) {
      throw new Error('The geoIpDB argument is required')
    }
    this.db = geoIpDB
    this.dnsLookup = dnsLookupCallback

    this.defaultStoreId = args.defaultStoreId ?? '_default'
    this.defaultNamespace = args.defaultNamespace ?? 'oid4vci'

    if (args?.dnsLookupStore && args.dnsLookupStore instanceof Map) {
      this._dnsLookupStore = args.dnsLookupStore
    } else {
      this._dnsLookupStore = new Map().set(
          this.defaultStoreId,
          new KeyValueStore({
            namespace: this.defaultNamespace,
            store: new Map<string, AnomalyDetectionLookupLocationResult>(),
          }),
      )
    }
  }

  private async anomalyDetectionLookupLocation(args: AnomalyDetectionLookupLocationArgs): Promise<AnomalyDetectionLookupLocationResult> {
    const { ipOrHostname } = { ...args }
    const reader = new Reader<CountryResponse>(this.db)
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
      country: result?.country?.iso_code,
    }

    await this.anomalyDetectionPersistLocation({
      locationId: ipOrHostname,
      storeId: this.defaultStoreId,
      namespace: this.defaultNamespace,
      locationArgs: lookupResult,
    })

    return lookupResult
  }

  private async anomalyDetectionPersistLocation(args: AnomalyDetectionLocationPersistArgs) {
    const storeId = this.storeIdStr(args)
    const namespace = this.namespaceStr(args)
    const { locationId, locationArgs, ttl } = args

    if (args?.validation !== false) {
      // TODO
    }
    const existing = await this.store({ stores: this._dnsLookupStore, storeId }).getAsValueData(
        this.prefix({
          namespace,
          locationId,
        }),
    )
    if (!existing.value || (existing.value && args?.overwriteExisting !== false)) {
      return await this.store({ stores: this._dnsLookupStore, storeId }).set(
          this.prefix({
            namespace,
            locationId,
          }),
          locationArgs,
          ttl,
      )
    }
    return existing
  }

  private store<T extends ValueStoreType>(args: { stores: Map<string, IKeyValueStore<T>>; storeId?: string }): IKeyValueStore<T> {
    const storeId = this.storeIdStr({ storeId: args.storeId })
    const store = args.stores.get(storeId)
    if (!store) {
      throw Error(`Could not get issuer metadata store: ${storeId}`)
    }
    return store
  }

  private storeIdStr({ storeId }: { storeId?: string }): string {
    return storeId ?? this.defaultStoreId
  }

  private namespaceStr({ namespace }: { namespace?: string }): string {
    return namespace ?? this.defaultNamespace
  }

  private prefix({ namespace, locationId }: { namespace?: string; locationId: string }): string {
    return `${this.namespaceStr({ namespace })}:${locationId}`
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
        `DNS resolution not available on this platform, use the dnsLookupCallback in the AnomalyDetection constructor to implement DNS resolution for your platform.\r\n${e.message}`,
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
