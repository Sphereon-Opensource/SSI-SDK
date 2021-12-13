// @ts-ignore
import React from 'react';
// @ts-ignore
import Enzyme, { shallow } from 'enzyme';
// @ts-ignore
import Adapter from 'enzyme-adapter-react-16';
import {QRMode, QRType, QRContent, SSIQRCode} from '../../src';
import {QRPropsData} from "./qrCodePropsData";

Enzyme.configure({ adapter: new Adapter() });

describe("<SSIQRCode /> shallow rendering", () => {
  let qrContent: QRContent;

  it("should have props", () => {
    const qrProps = QRPropsData.getQRProps()
    const wrapper = shallow(<SSIQRCode type={QRType.AUTHENTICATION} did={qrProps.did} mode={QRMode.DID_AUTH_SIOP_V2} />);
    expect(wrapper.props().value).toContain(`"type":"auth","did":"${qrProps.did}","mode":"didauth"`)
  });

  it("should present qr content in onGenerate", () => {
    const qrProps = QRPropsData.getQRProps()
    shallow(<SSIQRCode type={QRType.AUTHENTICATION} did={qrProps.did} mode={QRMode.DID_AUTH_SIOP_V2} onGenerate={content => testOnGenerate(content)}/>);
    expect(qrContent.did).toEqual(qrProps.did);
  });

  const testOnGenerate = (content: QRContent) => {
    qrContent = content;
  }
});
