/*
 * Copyright 2020 - MATTR Limited
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { extendContextLoader } from 'jsonld-signatures'
import {
  bbs as bbsContext,
  citizen_vocab as citizenVocab,
  credential_vocab as credentialContext,
  jws as jwsContext,
  odrl as odrlContext,
  schemaOrg,
  v3_unstable as securityV3,
  vc_example_vocab as vcExampleContext,
} from './contexts'

export const documents: any = {
  'https://w3id.org/security/v3-unstable': securityV3,
  'https://www.w3id.org/security/v3-unstable': securityV3,
  'https://www.w3.org/2018/credentials/examples/v1': vcExampleContext,
  'https://www.w3.org/2018/credentials/v1': credentialContext,
  'https://www.w3.org/ns/odrl.jsonld': odrlContext,
  'https://w3id.org/security/suites/jws-2020/v1': jwsContext,
  'https://w3id.org/citizenship/v1': citizenVocab,
  'https://w3id.org/security/bbs/v1': bbsContext,
  'https://schema.org': schemaOrg,
  'https://schema.org/': schemaOrg,
  'http://schema.org/': schemaOrg,
}

const customDocLoader = (url: string): any => {
  const context = documents[url]

  if (context) {
    return {
      contextUrl: null, // this is for a context via a link header
      document: context, // this is the actual document that was loaded
      documentUrl: url, // this is the actual context URL after redirects
    }
  }

  throw new Error(`Error attempted to load document remotely, please cache '${url}'`)
}

export const customLoader = extendContextLoader(customDocLoader)

export const securityBbsContext = 'https://w3id.org/security/bbs/v1'
