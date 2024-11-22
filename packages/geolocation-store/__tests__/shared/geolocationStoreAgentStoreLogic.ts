import { TAgent } from '@veramo/core'

import { IGeolocationStore } from '../../src'

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
        agent.anomalyDetectionStorePersistLocation({
          ipOrHostname: ip,
          locationArgs: location
        }),
      ).resolves.toEqual({ value: location })

      await expect(agent.anomalyDetectionStoreHasLocation({
        ipOrHostname: ip,
        storeId: '_default',
        namespace: 'anomaly-detection'
      })).resolves.toBeTruthy()
    })

    it('should have a location persisted', async () => {
      await expect(agent.anomalyDetectionStoreGetLocation({
        ipOrHostname: ip,
        storeId: '_default',
        namespace: 'anomaly-detection'}
      )).resolves.toEqual(location)
    })

    it('should retrieve a location', async () => {
      const ipv6 = '2001:4860:7:27f::f5'
      const ipv6Location = {
        continent: 'NA',
        country: 'US',
      }
      await agent.anomalyDetectionStorePersistLocation({
        ipOrHostname: ipv6,
        locationArgs: ipv6Location
      })

      await expect(agent.anomalyDetectionStoreGetLocation({
        storeId: '_default',
        namespace: 'anomaly-detection',
        ipOrHostname: ipv6
      })).resolves.toEqual(ipv6Location)
    })

    it('should remove a location', async () => {
      const hostname = 'sphereon.com'
      const hostnameLocation = {
        continent: 'EU',
        country: 'DE',
      }
      await agent.anomalyDetectionStorePersistLocation({
        ipOrHostname: hostname,
        locationArgs: hostnameLocation
      })

      await expect(agent.anomalyDetectionStoreRemoveLocation({
        ipOrHostname: ip,
        storeId: '_default',
        namespace: 'anomaly-detection'
      })).resolves.toBeTruthy()
    })

    it('should remove all locations', async () => {
      await expect(agent.anomalyDetectionStoreClearAllLocations()).resolves.toBeTruthy()
    })

    it('should retrieve the default location store', async () => {
      await expect(agent.anomalyDetectionStoreDefaultLocationStore()).resolves.toBeDefined()
      })
    })
}
