import { IPresentationDefinition } from '@sphereon/pex'
import { Rules } from '@sphereon/pex-models'

export const entraAndSphereonCompatibleDef: IPresentationDefinition = {
  id: '9449e2db-791f-407c-b086-c21cc677d2e0',
  purpose: 'You need to prove your Wallet Identity data',
  submission_requirements: [
    {
      name: 'Sphereon Wallet Identity',
      rule: Rules.Pick,
      min: 0,
      max: 1,
      from: 'A',
    } /*,
    {
      name: 'Microsoft Authenticator Identity',
      rule: Rules.Pick,
      min: 0,
      max: 1,
      from: 'B',
    },*/,
  ],
  input_descriptors: [
    {
      id: 'SphereonWalletId',
      purpose: 'Checking your Sphereon Wallet information',
      name: 'Wallet Identity',
      group: ['A'],
      schema: [{ uri: 'https://sphereon-opensource.github.io/ssi-mobile-wallet/context/sphereon-wallet-identity-v1.jsonld' }],
    } /*,
    {
      id: 'TrueIdentity',
      name: 'TrueIdentity',
      group: ['B'],
      purpose: 'To verify your demo identity',
      schema: [
        {
          uri: 'TrueIdentity',
        },
      ],
      constraints: {
        fields: [
          {
            path: ['$.issuer', '$.vc.issuer', '$.iss'],
            filter: {
              type: 'string',
              pattern:
                'did:ion:EiDXOEH-YmaP2ZvxoCI-lA5zT1i5ogjgH6foIc2LFC83nQ:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJzaWdfODEwYmQ1Y2EiLCJwdWJsaWNLZXlKd2siOnsiY3J2Ijoic2VjcDI1NmsxIiwia3R5IjoiRUMiLCJ4IjoiRUZwd051UDMyMmJVM1dQMUR0Smd4NjdMMENVVjFNeE5peHFQVk1IMkw5USIsInkiOiJfZlNUYmlqSUpqcHNxTDE2Y0lFdnh4ZjNNYVlNWThNYnFFcTA2NnlWOWxzIn0sInB1cnBvc2VzIjpbImF1dGhlbnRpY2F0aW9uIiwiYXNzZXJ0aW9uTWV0aG9kIl0sInR5cGUiOiJFY2RzYVNlY3AyNTZrMVZlcmlmaWNhdGlvbktleTIwMTkifV0sInNlcnZpY2VzIjpbeyJpZCI6ImxpbmtlZGRvbWFpbnMiLCJzZXJ2aWNlRW5kcG9pbnQiOnsib3JpZ2lucyI6WyJodHRwczovL2RpZC53b29kZ3JvdmVkZW1vLmNvbS8iXX0sInR5cGUiOiJMaW5rZWREb21haW5zIn0seyJpZCI6Imh1YiIsInNlcnZpY2VFbmRwb2ludCI6eyJpbnN0YW5jZXMiOlsiaHR0cHM6Ly9iZXRhLmh1Yi5tc2lkZW50aXR5LmNvbS92MS4wLzNjMzJlZDQwLThhMTAtNDY1Yi04YmE0LTBiMWU4Njg4MjY2OCJdfSwidHlwZSI6IklkZW50aXR5SHViIn1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlCUlNqWlFUYjRzOXJzZnp0T2F3OWVpeDg3N1l5d2JYc2lnaFlMb2xTSV9KZyJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpQXZDTkJoODlYZTVkdUk1dE1wU2ZyZ0k2aVNMMmV2QS0tTmJfUElmdFhfOGciLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaUN2RFdOTFhzcE1sbGJfbTFJal96ZV9SaWNKOWdFLUM1b2dlN1NnZTc5cy1BIn19',
            },
          },
        ],
      },
    },*/,
  ],
}

export const entraVerifiedIdPresentation: IPresentationDefinition = {
  id: '081ea6b1-9009-4ec0-b41a-0afcf668bd50',
  input_descriptors: [
    {
      id: 'TrueIdentity',
      name: 'TrueIdentity',
      purpose: 'To verify your demo identity',
      schema: [
        {
          uri: 'TrueIdentity',
        },
      ],
      constraints: {
        fields: [
          {
            path: ['$.issuer', '$.vc.issuer', '$.iss'],
            filter: {
              type: 'string',
              pattern: 'did.*',
            },
          },
        ],
      },
    },
  ],
}
