import {
  CreateElementArgs,
  CreateValueArgs,
  DIDCommV2OOBInvitation,
  DIDCommV2OOBInvitationData,
  OpenID4VCIDataWithScheme,
  QRData,
  QRRenderingProps,
  QRType,
  SIOPv2DataWithScheme,
  ValueResult,
} from '../../src'
import { render } from '@testing-library/react'
import * as React from 'react'

export const renderingProps: QRRenderingProps = {
  bgColor: 'white',
  fgColor: 'black',
  level: 'L',
  size: 128,
  title: 'title2021120903',
}

export const oobInvitation: DIDCommV2OOBInvitation = {
  type: QRType.DIDCOMM_V2_OOB_INVITATION,
  id: '599f3638-b563-4937-9487-dfe55099d900',
  from: 'did:key:zrfdjkgfjgfdjk',
  body: {
    goal_code: 'streamlined-vp',
    accept: ['didcomm/v2'],
  },
}

export const oobInvitationData: DIDCommV2OOBInvitationData = {
  oobInvitation,
  baseURI: 'https://example.com/?_oob=',
}

export const oobInvitationCreateValue: CreateValueArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData> = {
  data: {
    object: oobInvitationData,
    type: QRType.DIDCOMM_V2_OOB_INVITATION,
    id: '1234',
  },
  onGenerate: (result: ValueResult<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>) => {
    console.log(JSON.stringify(result, null, 2))
  },
}

export const oobInvitationCreateElement: CreateElementArgs<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData> = {
  data: {
    object: oobInvitationData,
    type: QRType.DIDCOMM_V2_OOB_INVITATION,
    id: '1234',
  },
  renderingProps,
  onGenerate: (result: ValueResult<QRType.DIDCOMM_V2_OOB_INVITATION, DIDCommV2OOBInvitationData>) => {
    render(<div data-testid="test-div">{result.data.object.oobInvitation.from}</div>)
    console.log(result.value)
  },
}

const siopv2Object: SIOPv2DataWithScheme = {
  scheme: 'openid-vc',
  requestUri: 'https://test.com?id=23',
}
const siopv2Data: QRData<QRType.SIOPV2, SIOPv2DataWithScheme> = {
  object: siopv2Object,
  type: QRType.SIOPV2,
  id: '456',
}
export const siopv2CreateValue: CreateValueArgs<QRType.SIOPV2, SIOPv2DataWithScheme> = {
  data: siopv2Data,
  onGenerate: (result: ValueResult<QRType.SIOPV2, SIOPv2DataWithScheme>) => {
    console.log(JSON.stringify(result, null, 2))
  },
}

export const siopv2CreateElement: CreateElementArgs<QRType.SIOPV2, SIOPv2DataWithScheme> = {
  data: siopv2Data,
  renderingProps,
  onGenerate: (result: ValueResult<QRType.SIOPV2, SIOPv2DataWithScheme>) => {
    render(<div data-testid="test-div-siopv2">{result.data.object.requestUri}</div>)
    console.log(result.value)
  },
}

export const credentialOffer = JSON.stringify({
  credential_issuer: 'https://credential-issuer.example.com',
  credentials: [
    'UniversityDegree_JWT',
    {
      format: 'mso_mdoc',
      doctype: 'org.iso.18013.5.1.mDL',
    },
  ],
  grants: {
    authorization_code: {
      issuer_state: 'eyJhbGciOiJSU0Et...FYUaBy',
    },
    'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
      'pre-authorized_code': 'adhjhdjajkdkhjhdj',
      user_pin_required: true,
    },
  },
})

const openid4vciObjectReference: OpenID4VCIDataWithScheme = {
  baseUri: 'test.com/resources',
  credentialOfferUri: 'https://test.com?id=234',
}

const openid4vciObjectValue: OpenID4VCIDataWithScheme = {
  scheme: 'https',
  baseUri: 'test.com/credential-offer',
  credentialOffer,
}

const openid4vciObjectValid: OpenID4VCIDataWithScheme = {
  scheme: 'https',
  baseUri: 'https://test.com/credential-offer',
  credentialOfferUri: 'https://test.com?id=234',
}

const openid4vciObjectWrong: OpenID4VCIDataWithScheme = {
  scheme: 'any-scheme',
  baseUri: 'https://test.com/credential-offer',
  credentialOffer,
}

const openid4vciDataReference: QRData<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  object: openid4vciObjectReference,
  type: QRType.OpenID4VCI,
  id: '567',
}

const openid4vciDataValue: QRData<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  object: openid4vciObjectValue,
  type: QRType.OpenID4VCI,
  id: '568',
}

const openid4vciDataWrong: QRData<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  object: openid4vciObjectWrong,
  type: QRType.OpenID4VCI,
  id: '569',
}

const openid4vciDataValid: QRData<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  object: openid4vciObjectValid,
  type: QRType.OpenID4VCI,
  id: '570',
}

export const openid4vciCreateValueByReference: CreateValueArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataReference,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    console.log(result, null, 2)
  },
}

export const openid4vciCreateElementByReference: CreateElementArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataReference,
  renderingProps,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    render(<div data-testid="test-div-openid4vci">{result.data.object.credentialOfferUri}</div>)
    console.log(result.value)
  },
}

export const openid4vciCreateValueByValue: CreateValueArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValue,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    console.log(result, null, 2)
  },
}

export const openid4vciCreateValueWrong: CreateValueArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataWrong,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    console.log(result, null, 2)
  },
}

export const openid4vciCreateElementByValue: CreateElementArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValue,
  renderingProps,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    render(<div data-testid="test-div-openid4vci">{result.data.object.credentialOffer}</div>)
    console.log(result.value)
  },
}

export const openid4vciCreateValueValid: CreateValueArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValid,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {},
}

export const openid4vciCreateElementValid: CreateElementArgs<QRType.OpenID4VCI, OpenID4VCIDataWithScheme> = {
  data: openid4vciDataValid,
  renderingProps,
  onGenerate: (result: ValueResult<QRType.OpenID4VCI, OpenID4VCIDataWithScheme>) => {
    render(<div data-testid="test-div-openid4vci">{result.data.object.credentialOfferUri}</div>)
  },
}
