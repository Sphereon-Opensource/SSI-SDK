import { TAgent } from '@veramo/core'
//@ts-ignore
import express, { Application, NextFunction, Request, Response } from 'express'
import { ImDLMdoc } from '../../src'
import { funkeTestCA, funkeTestIssuer, sphereonCA, sphereonTest } from './testvectors'

type ConfiguredAgent = TAgent<ImDLMdoc>

export default (testContext: {
  getAgent: () => ConfiguredAgent;
  setup: () => Promise<boolean>;
  tearDown: () => Promise<boolean>
}): void => {


  describe('Certificate chain', (): void => {
    let agent: ConfiguredAgent


    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    it('should be verified for Sphereon issued cert from CA', async () => {
      await expect(agent.verifyCertificateChain({
        chain: [sphereonTest, sphereonCA],
        trustAnchors: [sphereonCA]
      })).resolves.toMatchObject({
        'critical': false,
        'error': false,
        'message': 'Certificate chain was valid'
      })
    })

    it('should be verified for Sphereon issued cert from CA without providing full chain', async () => {
      await expect(agent.verifyCertificateChain({
        chain: [sphereonTest],
        trustAnchors: [sphereonCA]
      })).resolves.toMatchObject({
        'critical': false,
        'error': false,
        'message': 'Certificate chain was valid'
      })
    })

    it('should be verified for Funke issued cert from CA', async () => {
      await expect(agent.verifyCertificateChain({
        chain: [funkeTestIssuer, funkeTestCA],
        trustAnchors: [funkeTestCA]
      })).resolves.toMatchObject({
        'critical': false,
        'error': false,
        'message': 'Certificate chain was valid'
      })
    })

    it('should not be verified for Sphereon issued cert from CA when CA is not in trust anchors', async () => {
      await expect(agent.verifyCertificateChain({
        chain: [sphereonTest, sphereonCA],
        trustAnchors: [funkeTestCA]
      })).resolves.toMatchObject({
        'critical': true,
        'error': true,
        'message': 'No valid certificate paths found'
      })
    })

    afterAll(() => {
      testContext.tearDown
    })
  })

}
