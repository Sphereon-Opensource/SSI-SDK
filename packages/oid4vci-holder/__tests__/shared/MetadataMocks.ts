export const GET_PRE_AUTHORIZED_OPENID_CREDENTIAL_OFFER = {
  credentialBranding: {},
  credentialsSupported: [],
  openID4VCIClientState: {
    authorizationRequestOpts: {
      redirectUri: 'openid-credential-offer://',
    },
    credentialIssuer: 'https://issuer.research.identiproof.io',
    credentialOffer: {
      baseUrl: 'openid-credential-offer://',
      credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'OpenBadgeCredential'],
          },
        ],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': 'adhjhdjajkdkhjhdj',
            user_pin_required: true,
          },
        },
      },
      original_credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'OpenBadgeCredential'],
          },
        ],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': 'adhjhdjajkdkhjhdj',
            user_pin_required: true,
          },
        },
      },
      preAuthorizedCode: 'adhjhdjajkdkhjhdj',
      scheme: 'openid-credential-offer',
      supportedFlows: ['Pre-Authorized Code Flow'],
      userPinRequired: true,
      version: 1011,
    },
    endpointMetadata: {
      authorizationServerMetadata: {
        authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
        introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
        introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        issuer: 'https://auth.research.identiproof.io',
        jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
        response_types_supported: ['code'],
        revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
        revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      },
      authorizationServerType: 'OID4VCI',
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      authorization_server: 'https://auth.research.identiproof.io',
      credentialIssuerMetadata: {
        authorization_server: 'https://auth.research.identiproof.io',
        credential_endpoint: 'https://issuer.research.identiproof.io/credential',
        credentials_supported: {
          'Cyber Security Certificate': {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'Cyber Security Certificate'],
              },
            },
          },
          OpenBadgeCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeCredential'],
              },
            },
          },
          OpenBadgeExtendedCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
              },
            },
          },
        },
        issuer: 'https://issuer.research.identiproof.io',
        jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
      },
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      issuer: 'https://issuer.research.identiproof.io',
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
    },
    pkce: {
      codeChallengeMethod: 'S256',
      disabled: false,
    },
  },
  serverMetadata: {
    authorizationServerMetadata: {
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
      introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
      introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      issuer: 'https://auth.research.identiproof.io',
      jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
      response_types_supported: ['code'],
      revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
      revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
    },
    authorizationServerType: 'OID4VCI',
    authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
    authorization_server: 'https://auth.research.identiproof.io',
    credentialIssuerMetadata: {
      authorization_server: 'https://auth.research.identiproof.io',
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      credentials_supported: {
        'Cyber Security Certificate': {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'Cyber Security Certificate'],
            },
          },
        },
        OpenBadgeCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeCredential'],
            },
          },
        },
        OpenBadgeExtendedCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
            },
          },
        },
      },
      issuer: 'https://issuer.research.identiproof.io',
      jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
    },
    credential_endpoint: 'https://issuer.research.identiproof.io/credential',
    issuer: 'https://issuer.research.identiproof.io',
    token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
  },
}

export const GET_INITIATION_DATA_PRE_AUTHORIZED_OPENID_INITIATE_ISSUANCE = {
  credentialBranding: {},
  credentialsSupported: [],
  openID4VCIClientState: {
    authorizationRequestOpts: {
      redirectUri: 'openid-credential-offer://',
    },
    credentialIssuer: 'https://issuer.research.identiproof.io',
    credentialOffer: {
      baseUrl: 'openid-initiate-issuance://',
      credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: ['OpenBadgeCredential', 'VerifiableCredential'],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code':
              '4jLs9xZHEfqcoow0kHE7d1a8hUk6Sy-5bVSV2MqBUGUgiFFQi-ImL62T-FmLIo8hKA1UdMPH0lM1xAgcFkJfxIw9L-lI3mVs0hRT8YVwsEM1ma6N3wzuCdwtMU4bcwKp',
            user_pin_required: true,
          },
        },
      },
      original_credential_offer: {
        credential_type: ['OpenBadgeCredential', 'VerifiableCredential'],
        issuer: 'https://issuer.research.identiproof.io',
        'pre-authorized_code':
          '4jLs9xZHEfqcoow0kHE7d1a8hUk6Sy-5bVSV2MqBUGUgiFFQi-ImL62T-FmLIo8hKA1UdMPH0lM1xAgcFkJfxIw9L-lI3mVs0hRT8YVwsEM1ma6N3wzuCdwtMU4bcwKp',
        user_pin_required: 'true',
      },
      preAuthorizedCode:
        '4jLs9xZHEfqcoow0kHE7d1a8hUk6Sy-5bVSV2MqBUGUgiFFQi-ImL62T-FmLIo8hKA1UdMPH0lM1xAgcFkJfxIw9L-lI3mVs0hRT8YVwsEM1ma6N3wzuCdwtMU4bcwKp',
      scheme: 'openid-initiate-issuance',
      supportedFlows: ['Pre-Authorized Code Flow'],
      userPinRequired: true,
      version: 1008,
    },
    endpointMetadata: {
      authorizationServerMetadata: {
        authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
        introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
        introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        issuer: 'https://auth.research.identiproof.io',
        jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
        response_types_supported: ['code'],
        revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
        revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      },
      authorizationServerType: 'OID4VCI',
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      authorization_server: 'https://auth.research.identiproof.io',
      credentialIssuerMetadata: {
        authorization_server: 'https://auth.research.identiproof.io',
        credential_endpoint: 'https://issuer.research.identiproof.io/credential',
        credentials_supported: {
          'Cyber Security Certificate': {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'Cyber Security Certificate'],
              },
            },
          },
          OpenBadgeCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeCredential'],
              },
            },
          },
          OpenBadgeExtendedCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
              },
            },
          },
        },
        issuer: 'https://issuer.research.identiproof.io',
        jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
      },
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      issuer: 'https://issuer.research.identiproof.io',
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
    },
    pkce: {
      codeChallengeMethod: 'S256',
      disabled: false,
    },
  },
  serverMetadata: {
    authorizationServerMetadata: {
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
      introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
      introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      issuer: 'https://auth.research.identiproof.io',
      jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
      response_types_supported: ['code'],
      revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
      revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
    },
    authorizationServerType: 'OID4VCI',
    authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
    authorization_server: 'https://auth.research.identiproof.io',
    credentialIssuerMetadata: {
      authorization_server: 'https://auth.research.identiproof.io',
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      credentials_supported: {
        'Cyber Security Certificate': {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'Cyber Security Certificate'],
            },
          },
        },
        OpenBadgeCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeCredential'],
            },
          },
        },
        OpenBadgeExtendedCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
            },
          },
        },
      },
      issuer: 'https://issuer.research.identiproof.io',
      jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
    },
    credential_endpoint: 'https://issuer.research.identiproof.io/credential',
    issuer: 'https://issuer.research.identiproof.io',
    token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
  },
}

export const GET_CREDENTIAL_OFFER_AUTHORIZATION_CODE_HTTPS = {
  authorizationCodeURL: expect.any(String),
  credentialBranding: {},
  credentialsSupported: [],
  openID4VCIClientState: {
    authorizationRequestOpts: {
      redirectUri: 'openid-credential-offer://',
    },
    authorizationURL: expect.any(String),
    credentialIssuer: 'https://issuer.research.identiproof.io',
    credentialOffer: {
      baseUrl: 'https://issuer.research.identiproof.io',
      credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
          },
        ],
        grants: {
          authorization_code: {
            issuer_state: 'eyJhbGciOiJSU0Et...FYUaBy',
          },
        },
      },
      issuerState: 'eyJhbGciOiJSU0Et...FYUaBy',
      original_credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
          },
        ],
        grants: {
          authorization_code: {
            issuer_state: 'eyJhbGciOiJSU0Et...FYUaBy',
          },
        },
      },
      scheme: 'https',
      supportedFlows: ['Authorization Code Flow'],
      userPinRequired: false,
      version: 1011,
    },
    endpointMetadata: {
      authorizationServerMetadata: {
        authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
        introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
        introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        issuer: 'https://auth.research.identiproof.io',
        jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
        response_types_supported: ['code'],
        revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
        revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      },
      authorizationServerType: 'OID4VCI',
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      authorization_server: 'https://auth.research.identiproof.io',
      credentialIssuerMetadata: {
        authorization_server: 'https://auth.research.identiproof.io',
        credential_endpoint: 'https://issuer.research.identiproof.io/credential',
        credentials_supported: {
          'Cyber Security Certificate': {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'Cyber Security Certificate'],
              },
            },
          },
          OpenBadgeCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeCredential'],
              },
            },
          },
          OpenBadgeExtendedCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
              },
            },
          },
        },
        issuer: 'https://issuer.research.identiproof.io',
        jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
      },
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      deferred_credential_endpoint: undefined,
      issuer: 'https://issuer.research.identiproof.io',
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
    },
    pkce: {
      codeChallenge: expect.any(String),
      codeChallengeMethod: 'S256',
      codeVerifier: expect.any(String),
      disabled: false,
    },
  },
  serverMetadata: {
    authorizationServerMetadata: {
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
      introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
      introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      issuer: 'https://auth.research.identiproof.io',
      jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
      response_types_supported: ['code'],
      revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
      revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
    },
    authorizationServerType: 'OID4VCI',
    authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
    authorization_server: 'https://auth.research.identiproof.io',
    credentialIssuerMetadata: {
      authorization_server: 'https://auth.research.identiproof.io',
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      credentials_supported: {
        'Cyber Security Certificate': {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'Cyber Security Certificate'],
            },
          },
        },
        OpenBadgeCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeCredential'],
            },
          },
        },
        OpenBadgeExtendedCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
            },
          },
        },
      },
      issuer: 'https://issuer.research.identiproof.io',
      jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
    },
    credential_endpoint: 'https://issuer.research.identiproof.io/credential',
    issuer: 'https://issuer.research.identiproof.io',
    token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
  },
}

export const GET_CREDENTIAL_OFFER_PRE_AUTHORIZED_CODE_HTTPS = {
  credentialBranding: {},
  credentialsSupported: [],
  openID4VCIClientState: {
    authorizationRequestOpts: {
      redirectUri: 'openid-credential-offer://',
    },
    credentialIssuer: 'https://issuer.research.identiproof.io',
    credentialOffer: {
      baseUrl: 'https://issuer.research.identiproof.io',
      credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'UniversityDegreeCredential'],
          },
        ],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': 'adhjhdjajkdkhjhdj',
            user_pin_required: true,
          },
        },
      },
      original_credential_offer: {
        credential_issuer: 'https://issuer.research.identiproof.io',
        credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'UniversityDegreeCredential'],
          },
        ],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': 'adhjhdjajkdkhjhdj',
            user_pin_required: true,
          },
        },
      },
      preAuthorizedCode: 'adhjhdjajkdkhjhdj',
      scheme: 'https',
      supportedFlows: ['Pre-Authorized Code Flow'],
      userPinRequired: true,
      version: 1011,
    },
    endpointMetadata: {
      authorizationServerMetadata: {
        authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
        introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
        introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        issuer: 'https://auth.research.identiproof.io',
        jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
        response_types_supported: ['code'],
        revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
        revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
        token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      },
      authorizationServerType: 'OID4VCI',
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      authorization_server: 'https://auth.research.identiproof.io',
      credentialIssuerMetadata: {
        authorization_server: 'https://auth.research.identiproof.io',
        credential_endpoint: 'https://issuer.research.identiproof.io/credential',
        credentials_supported: {
          'Cyber Security Certificate': {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'Cyber Security Certificate'],
              },
            },
          },
          OpenBadgeCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeCredential'],
              },
            },
          },
          OpenBadgeExtendedCredential: {
            formats: {
              jwt_vc: {
                cryptographic_binding_methods_supported: ['did'],
                cryptographic_suites_supported: ['ES256'],
                types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
              },
            },
          },
        },
        issuer: 'https://issuer.research.identiproof.io',
        jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
      },
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      issuer: 'https://issuer.research.identiproof.io',
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
    },
    pkce: {
      codeChallengeMethod: 'S256',
      disabled: false,
    },
  },
  serverMetadata: {
    authorizationServerMetadata: {
      authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
      introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
      introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      issuer: 'https://auth.research.identiproof.io',
      jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
      response_types_supported: ['code'],
      revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
      revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
      token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
    },
    authorizationServerType: 'OID4VCI',
    authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
    authorization_server: 'https://auth.research.identiproof.io',
    credentialIssuerMetadata: {
      authorization_server: 'https://auth.research.identiproof.io',
      credential_endpoint: 'https://issuer.research.identiproof.io/credential',
      credentials_supported: {
        'Cyber Security Certificate': {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'Cyber Security Certificate'],
            },
          },
        },
        OpenBadgeCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeCredential'],
            },
          },
        },
        OpenBadgeExtendedCredential: {
          formats: {
            jwt_vc: {
              cryptographic_binding_methods_supported: ['did'],
              cryptographic_suites_supported: ['ES256'],
              types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
            },
          },
        },
      },
      issuer: 'https://issuer.research.identiproof.io',
      jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
    },
    credential_endpoint: 'https://issuer.research.identiproof.io/credential',
    issuer: 'https://issuer.research.identiproof.io',
    token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
  },
}

export const IDENTIPROOF_ISSUER_URL = 'https://issuer.research.identiproof.io'
export const IDENTIPROOF_AS_URL = 'https://auth.research.identiproof.io'
export const WALLET_URL = 'https://wallet.com'

export const IDENTIPROOF_AS_METADATA = {
  issuer: 'https://auth.research.identiproof.io',
  authorization_endpoint: 'https://auth.research.identiproof.io/oauth2/authorize',
  token_endpoint: 'https://auth.research.identiproof.io/oauth2/token',
  token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
  jwks_uri: 'https://auth.research.identiproof.io/oauth2/jwks',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:pre-authorized_code', 'client_credentials', 'refresh_token'],
  revocation_endpoint: 'https://auth.research.identiproof.io/oauth2/revoke',
  revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
  introspection_endpoint: 'https://auth.research.identiproof.io/oauth2/introspect',
  introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
  code_challenge_methods_supported: ['S256'],
}

export const IDENTIPROOF_OID4VCI_METADATA = {
  issuer: 'https://issuer.research.identiproof.io',
  authorization_server: 'https://auth.research.identiproof.io',
  credential_endpoint: 'https://issuer.research.identiproof.io/credential',
  jwks_uri: 'https://issuer.research.identiproof.io/.well-known/did.json',
  credentials_supported: {
    'Cyber Security Certificate': {
      formats: {
        jwt_vc: {
          types: ['VerifiableCredential', 'Cyber Security Certificate'],
          cryptographic_binding_methods_supported: ['did'],
          cryptographic_suites_supported: ['ES256'],
        },
      },
    },
    OpenBadgeCredential: {
      formats: {
        jwt_vc: {
          types: ['VerifiableCredential', 'OpenBadgeCredential'],
          cryptographic_binding_methods_supported: ['did'],
          cryptographic_suites_supported: ['ES256'],
        },
      },
    },
    OpenBadgeExtendedCredential: {
      formats: {
        jwt_vc: {
          types: ['VerifiableCredential', 'OpenBadgeExtendedCredential'],
          cryptographic_binding_methods_supported: ['did'],
          cryptographic_suites_supported: ['ES256'],
        },
      },
    },
  },
}
