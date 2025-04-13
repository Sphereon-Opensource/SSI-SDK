import { TAgent } from '@veramo/core'

import { IAnomalyDetection } from '../../src'

type ConfiguredAgent = TAgent<IAnomalyDetection>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  const hasGeoIpPathEnv = process.env.GEO_IP_DB_PATH!!

  describe('Anomaly Detection Agent Plugin', (): void => {
    let agent: ConfiguredAgent



    beforeAll(async (): Promise<void> => {
      if (!hasGeoIpPathEnv) {
        return
      }
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(() =>{
      if (!hasGeoIpPathEnv) {
        return
      }
      testContext.tearDown
    })

    it('should lookup the location of an IPv4 address', async () => {
      if (!hasGeoIpPathEnv) {
        console.log("No GEO IP Path env var set. Skipping test")
        return
      }
      await expect(
        agent.anomalyDetectionLookupLocation({
          ipOrHostname: '77.247.248.1',
        }),
      ).resolves.toEqual({
        continent: 'EU',
        country: 'AL',
      })
    })

    it('should lookup the location of an IPv6 address', async () => {
      if (!hasGeoIpPathEnv) {
        console.log("No GEO IP Path env var set. Skipping test")
        return
      }
      await expect(
        agent.anomalyDetectionLookupLocation({
          ipOrHostname: '2001:4860:7:27f::f5',
        }),
      ).resolves.toEqual({
        continent: 'NA',
        country: 'US',
      })
    })

    it('should lookup the location of a hostname', async () => {
      if (!hasGeoIpPathEnv) {
        console.log("No GEO IP Path env var set. Skipping test")
        return
      }
      await expect(
        agent.anomalyDetectionLookupLocation({
          ipOrHostname: 'sphereon.com',
        }),
      ).resolves.toEqual({
        continent: 'EU',
        country: 'DE',
      })
    })
  })
}
