import { TAgent } from '@veramo/core'
import { IMsVcApiIssuer, IIssueRequest, IIssueRequestResponse } from '../../src/types/IMsVcApiIssuer'
// import { MsVcApiIssuer } from '../../src/agent/MsVcApiIssuer'
import * as MsAuthenticator from '@sphereon/ms-authenticator'
import { v4 as uuidv4 } from 'uuid'

type ConfiguredAgent = TAgent<IMsVcApiIssuer>
var requestIssuanceResponse : IIssueRequestResponse = {
  requestId: '2e5c6fae-218c-4c7b-8440-df5454f908e9',
  url: 'www.google.com',
  expiry: new Date(1655935606),
  id: 'fbef933e-f786-4b85-b1c8-6679346dc55d',
  pin: '3683'

 } 

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('@sphereon/ms-vc-api-issuer', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      console.log('mockAuthenticationMethod')
      const mockAuthenticationMethod = jest.fn()
      MsAuthenticator.ClientCredentialAuthenticator.prototype = mockAuthenticationMethod
      mockAuthenticationMethod.mockResolvedValue('ey...')


      // console.log('mockCheckMsIdentityHostnameMethod')
      // console.log(' MsAuthenticator.checkMsIdentityHostname.prototype: ' +  MsAuthenticator.checkMsIdentityHostname.prototype)
      // const mockCheckMsIdentityHostnameMethod = jest.fn()
      // MsAuthenticator.checkMsIdentityHostname.prototype = mockCheckMsIdentityHostnameMethod
      // mockCheckMsIdentityHostnameMethod.mockResolvedValue(MsAuthenticator.MS_IDENTITY_HOST_NAME_EU)
      
      // console.log(' MsAuthenticator.checkMsIdentityHostname.prototype: ' +  MsAuthenticator.checkMsIdentityHostname.prototype)

      // jest.spyOn(MsVcApiIssuer.prototype, 'fetchIssuanceRequestMs')
      // .mockResolvedValue(requestIssuanceResponse)
      
      // console.log('jest.spyOn is done')
 
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should request issuance from Issuer', async () => {
      var requestConfigFile = '../../config/issuance_request_config.json';
      var issuanceConfig = require( requestConfigFile );  
      var issuanceRequest : IIssueRequest = {
        authenticationInfo: {
          azClientId: 'AzClientID',
          azClientSecret: 'AzClientSecret',
          azTenantId: 'AzTenantId',
          credentialManifestUrl: 'CredentialManifestUrl'
        },
        issuanceConfig: issuanceConfig
      }

      // modify the callback method to make it easier to debug
      // with tools like ngrok since the URI changes all the time
      // this way you don't need to modify the callback URL in the payload every time
      // ngrok changes the URI
      issuanceRequest.issuanceConfig.callback.url = `https://6270-2a02-a458-e71a-1-68b4-31d2-b44f-12b.eu.ngrok.io/api/issuer/issuance-request-callback`;

      issuanceRequest.issuanceConfig.registration.clientName = "Sphereon Node.js SDK API Issuer";

      // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
      var id = uuidv4();
      issuanceRequest.issuanceConfig.callback.state = id;
  
      // here you could change the payload manifest
      issuanceRequest.issuanceConfig.issuance.claims = {
        "given_name":"FIRSTNAME",
        "family_name":"LASTNAME"
     }
     
      return await expect(
        agent.issuanceRequestMsVc(issuanceRequest)
      ).resolves.toEqual(requestIssuanceResponse)
    })

  })
}


