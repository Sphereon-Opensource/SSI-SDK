import { TAgent } from '@veramo/core'

import { IGeolocationStore } from '../../src'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type ConfiguredAgent = TAgent<IGeolocationStore>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Anomaly Detection Store Agent Plugin', (): void => {
    let agent: ConfiguredAgent
    let ip: string
    let location: { continent: string; country: string }

    beforeAll(async (): Promise<void> => {
      ip = '77.247.248.1'
      location = { continent: 'EU', country: 'AL' }
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should persist location', async () => {
      await expect(
        agent.geolocationStorePersistLocation({
          ipOrHostname: ip,
          locationArgs: location,
        }),
      ).resolves.toEqual({ value: location })

      await expect(
        agent.geolocationStoreHasLocation({
          ipOrHostname: ip,
          storeId: '_default',
          namespace: 'anomaly-detection',
        }),
      ).resolves.toBeTruthy()
    })

    it('should have a location persisted', async () => {
      await expect(
        agent.geolocationStoreGetLocation({
          ipOrHostname: ip,
          storeId: '_default',
          namespace: 'anomaly-detection',
        }),
      ).resolves.toEqual(location)
    })

    it('should retrieve a location', async () => {
      const ipv6 = '2001:4860:7:27f::f5'
      const ipv6Location = {
        continent: 'NA',
        country: 'US',
      }
      await agent.geolocationStorePersistLocation({
        ipOrHostname: ipv6,
        locationArgs: ipv6Location,
      })

      await expect(
        agent.geolocationStoreGetLocation({
          storeId: '_default',
          namespace: 'anomaly-detection',
          ipOrHostname: ipv6,
        }),
      ).resolves.toEqual(ipv6Location)
    })

    it('should remove a location', async () => {
      const hostname = 'sphereon.com'
      const hostnameLocation = {
        continent: 'EU',
        country: 'DE',
      }
      await agent.geolocationStorePersistLocation({
        ipOrHostname: hostname,
        locationArgs: hostnameLocation,
      })

      await expect(
        agent.geolocationStoreRemoveLocation({
          ipOrHostname: ip,
          storeId: '_default',
          namespace: 'anomaly-detection',
        }),
      ).resolves.toBeTruthy()
    })

    it('should remove all locations', async () => {
      await expect(agent.geolocationStoreClearAllLocations()).resolves.toBeTruthy()
    })

    it('should retrieve the default location store', async () => {
      await expect(agent.geolocationStoreDefaultLocationStore()).resolves.toBeDefined()
    })
  })
}
