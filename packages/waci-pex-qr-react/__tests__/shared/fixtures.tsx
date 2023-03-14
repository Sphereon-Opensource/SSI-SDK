import {
  CreateElementArgs,
  CreateValueArgs,
  DIDCommV2OOBInvitation,
  DIDCommV2OOBInvitationData,
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
