import { TAgent } from '@veramo/core'

import { IAnomalyDetection } from '../../src'

type ConfiguredAgent = TAgent<IAnomalyDetection>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Anomaly Detection Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should lookup the location of an IPv4 address', async () => {
      await expect(agent.lookupLocation({
        ipOrHostname: '77.247.248.1'
      })).resolves.toEqual({
        continent: 'EU',
        country: 'AL'
      })
    })

    it('should lookup the location of an IPv6 address', async () => {
      await expect(agent.lookupLocation({
        ipOrHostname: '2001:4860:7:27f::f5'
      })).resolves.toEqual({
        continent: 'NA',
        country: 'US'
      })
    })

    it('should lookup the location of a hostname', async () => {
      await expect(agent.lookupLocation({
        ipOrHostname: 'sphereon.com'
      })).resolves.toEqual({
        continent: 'EU',
        country: 'DE'
      })
    })
  })
}
