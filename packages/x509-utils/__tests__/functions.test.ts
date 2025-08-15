import { describe, expect, it } from 'vitest'
import { assertCertificateMatchesClientIdScheme, getCertificateInfo, pemOrDerToX509Certificate, validateX509CertificateChain } from '../src'

const sphereonCA =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBa\n' +
  'MQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBC\n' +
  'LlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0\n' +
  'MDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNV\n' +
  'BAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAW\n' +
  'BgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\n' +
  'BEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQq\n' +
  'T1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6A\n' +
  'sywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8E\n' +
  'BTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8A\n' +
  'QlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI=\n' +
  '-----END CERTIFICATE-----'

const sphereonTest =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIDSDCCAu6gAwIBAgISK90y2oo7lOTaCgILZPsHpoI1MAoGCCqGSM49BAMCMFox\n' +
  'CzAJBgNVBAYTAk5MMSQwIgYDVQQKDBtTcGhlcmVvbiBJbnRlcm5hdGlvbmFsIEIu\n' +
  'Vi4xCzAJBgNVBAsMAklUMRgwFgYDVQQDDA9jYS5zcGhlcmVvbi5jb20wHhcNMjQx\n' +
  'MTI2MTk0OTMyWhcNMjUwMjI0MjE0OTMyWjCBjjELMAkGA1UEBhMCTkwxFjAUBgNV\n' +
  'BAgMDU5vb3JkLUhvbGxhbmQxEjAQBgNVBAcMCUFtc3RlcmRhbTEkMCIGA1UECgwb\n' +
  'U3BoZXJlb24gSW50ZXJuYXRpb25hbCBCLlYuMQswCQYDVQQLDAJJVDEgMB4GA1UE\n' +
  'AwwXZnVua2UuZGVtby5zcGhlcmVvbi5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMB\n' +
  'BwNCAATfCH3q528xCDpTCHAd1bgjh5wytgU0qWKG4XOihHTpXyFW9budmWwOFioR\n' +
  'OIbSx1mN6En8E560QjlZzRknIzOzo4IBXTCCAVkwHQYDVR0OBBYEFIdPsQ39CfxO\n' +
  'JY1T2qlddg7Gwv6nMB8GA1UdIwQYMBaAFOcHyl2VXPnIoP7O42RFHoCzLDLBMGEG\n' +
  'CCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDovL2V1LmNlcnQuZXpjYS5p\n' +
  'by9jZXJ0cy9kYWExYjRiNC04NWZkLTRiYTQtYjk2Yi0zMzJhZGQ4OTljZTkuY2Vy\n' +
  'MB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAiBgNVHREEGzAZghdmdW5r\n' +
  'ZS5kZW1vLnNwaGVyZW9uLmNvbTAOBgNVHQ8BAf8EBAMCBaAwYQYDVR0fBFowWDBW\n' +
  'oFSgUoZQaHR0cDovL2V1LmNybC5lemNhLmlvL2NybC8yY2RmN2M1ZS1iOWNkLTQz\n' +
  'MTctYmI1Ni0zODZkMjQ0MzgwZTIvY2FzcGhlcmVvbmNvbS5jcmwwCgYIKoZIzj0E\n' +
  'AwIDSAAwRQIhALz0V+89FVAIEamNEnXy/TP2bBJR5yE8i/1l4fhSeGdUAiAk8/1f\n' +
  'vlqgdD+DS48bBXK0s0ZfALgdAGO/jOttA+tLYg==\n' +
  '-----END CERTIFICATE-----'

const walletPEM =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIDwzCCA2mgAwIBAgISKDZBYxEV61yg6xUjrxcTZ17WMAoGCCqGSM49BAMCMFox\n' +
  'CzAJBgNVBAYTAk5MMSQwIgYDVQQKDBtTcGhlcmVvbiBJbnRlcm5hdGlvbmFsIEIu\n' +
  'Vi4xCzAJBgNVBAsMAklUMRgwFgYDVQQDDA9jYS5zcGhlcmVvbi5jb20wHhcNMjQw\n' +
  'NzI4MjAwMjQ0WhcNMjQxMDI2MjIwMjQ0WjAjMSEwHwYDVQQDDBh3YWxsZXQudGVz\n' +
  'dC5zcGhlcmVvbi5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE\n' +
  'NxhvsnlZr48eRNYk90qv80Xokko2mBWHLQVGwbJHIjkKhPV7aC1ezcaMHGtvLwhq\n' +
  'EvnI+xefeMYUlw1sFhAqGq3UnhqwYLNm6dSIQe1pgHP74nfX06hfgvdGmfZkVxMM\n' +
  'XyxK5gasFg5TuAIsEv8wsqf0vFF2SGKaVFmN5qH4FQvSUtOtJAWQKsee1NSGVkpK\n' +
  't/POXrG8LidXlpYj17Sh0P8YoFT4DEEj8ZAm6r1W/SDlaZywvEmNLr1ld+MLdm1i\n' +
  'UbtjC/kqB3wDbu2W8T9Yz6jPOsJy3nv/tHiB4Yh8fF9R7+18tZiIt+P+awJrza1D\n' +
  'w1GbuVBTKx00KUtZ2CzlAgMBAAGjggF5MIIBdTAdBgNVHQ4EFgQUuCN6sAJCz64f\n' +
  'CZ3js3ITfKQzFF4wHwYDVR0jBBgwFoAU5wfKXZVc+cig/s7jZEUegLMsMsEwYQYI\n' +
  'KwYBBQUHAQEEVTBTMFEGCCsGAQUFBzAChkVodHRwOi8vZXUuY2VydC5lemNhLmlv\n' +
  'L2NlcnRzL2RhYTFiNGI0LTg1ZmQtNGJhNC1iOTZiLTMzMmFkZDg5OWNlOS5jZXIw\n' +
  'HQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMD4GA1UdEQQ3MDWCGHdhbGxl\n' +
  'dC50ZXN0LnNwaGVyZW9uLmNvbYIZZnVua2Uud2FsbGV0LnNwaGVyZW9uLmNvbTAO\n' +
  'BgNVHQ8BAf8EBAMCBLAwYQYDVR0fBFowWDBWoFSgUoZQaHR0cDovL2V1LmNybC5l\n' +
  'emNhLmlvL2NybC8yY2RmN2M1ZS1iOWNkLTQzMTctYmI1Ni0zODZkMjQ0MzgwZTIv\n' +
  'Y2FzcGhlcmVvbmNvbS5jcmwwCgYIKoZIzj0EAwIDSAAwRQIgfY5MD3fWNf8Q0j5C\n' +
  'mYHDHcwOkwygISpMDOh9K5DBBV4CIQCuQ3nToCr/II2WVsAqRXFeZup08fzKLrU2\n' +
  'KZxmdxeoew==\n' +
  '-----END CERTIFICATE-----'

const externalTestCert =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIDezCCAmOgAwIBAgIhAIhyE4lj2NAOEV7WfxQzdUfai0kmzBvHuNcDacKoZdoY\n' +
  'MA0GCSqGSIb3DQEBBQUAMFAxCTAHBgNVBAYTADEJMAcGA1UECgwAMQkwBwYDVQQL\n' +
  'DAAxDTALBgNVBAMMBHRlc3QxDzANBgkqhkiG9w0BCQEWADENMAsGA1UEAwwEdGVz\n' +
  'dDAeFw0yNDA4MDYxNjI4NTdaFw0zNDA4MDcxNjI4NTdaMEExCTAHBgNVBAYTADEJ\n' +
  'MAcGA1UECgwAMQkwBwYDVQQLDAAxDTALBgNVBAMMBHRlc3QxDzANBgkqhkiG9w0B\n' +
  'CQEWADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAI/7Qxc3dcOCmL6Q\n' +
  'zsnVAtWfNnLNwBOf+gAURg4kDHoFlc8bfa52uiB+ryKOXMO1xunhE+dEYZYHjaHM\n' +
  'jum6cH7MpmWPDhI01UhiOxY+nJ9xDJE81B/lTbI8FEZ5Z1roqGPQA2es6yBlO2i9\n' +
  'paa6RDQg9xJyqbLl1Y2xM6t16xBM20EIefGJGCpMkDryiF9QiFDoxivZI8SuOfC4\n' +
  '+avmNvQ2PuWaPjELoAe/4I9qHmXvUZSJZxpmnqR1I19+ySaQ8huVDI8UqCkG0/jB\n' +
  'n101s7emyFlkuMmr2zLV48/ckHVFZXpjBiAaCZJlHNA9kMfNUwEaWNobiNemIVLM\n' +
  'rLn4KN8CAwEAAaNPME0wHQYDVR0OBBYEFN+fvlWXGUPNLtSigoSfnnJV8O7cMB8G\n' +
  'A1UdIwQYMBaAFN+fvlWXGUPNLtSigoSfnnJV8O7cMAsGA1UdEQQEMAKCADANBgkq\n' +
  'hkiG9w0BAQUFAAOCAQEAj4HlAZ1rpzoa2m/wbHbZsLlmfV+3GH6Cf/BBP4HeY/p2\n' +
  'M5bDDeAwKSi3vF+ZlpdkwDiXbHxNVPtrhNAD9o2Oe6NicuhnTTMzdDUVvRPzfRkw\n' +
  'zRUgyEcQUUShoma7K2EKG4HgHKZ5xCPvp0RQ8qwN4yrCm85HXHemdINHLrxOGBuX\n' +
  'p9K4zhfl3aHn4PMGGN0KG/dxmhFs4475dHnF2KeyhrDVpoqKVY5NFhuNXF9MiRnG\n' +
  'cS4jCEbpYwEhSlIxCHCWQgkFPohtg+aR/YtOwm0xNsaXdw/jYk0j2nin3AawdhBv\n' +
  'opkupVtRIrPA4fHKmUknr6WK1h+sS4qKhPsLSBGGkQ==\n' +
  '-----END CERTIFICATE-----\n'

const funkeTestCA =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==\n' +
  '-----END CERTIFICATE-----'

const funkeTestIssuer =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf/7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2/J0WVeghyw+mIwDAYDVR0TAQH/BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr+ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW/U/5S5vAEC5XxcOanusOBroBbU=\n' +
  '-----END CERTIFICATE-----'

const animoFunkeDER =
  'MIH6MIGhoAMCAQICEDlbxpcN1V1PRbmc2TtPjNQwCgYIKoZIzj0EAwIwADAeFw03MDAxMDEwMDAwMDBaFw0yNTExMjIwODIyMTJaMAAwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMdMBswGQYDVR0RBBIwEIIOZnVua2UuYW5pbW8uaWQwCgYIKoZIzj0EAwIDSAAwRQIhAIFd2jlrZAzLTLsXdUE7O+CRuxuzk04lGo1eVYIbgT8iAiAQhR/FonhoLLTFjU/3tn5rPyB2DaOl3W18W5ugLWHjhQ=='

describe('functions: validateX5cCertificateChain', () => {
  // FIXME SDK-46
  const validChain = [walletPEM, sphereonCA]

  const invalidChain = [externalTestCert, walletPEM, sphereonCA]

  // FIXME: These CA CERTS are not valid anymore
  it.skip('should validate a valid certificate SDJWT chain without providing a CA as trust anchor, but with trustRoot enabled', async () => {
    const chain = [
      'MIIDSDCCAu6gAwIBAgISK90y2oo7lOTaCgILZPsHpoI1MAoGCCqGSM49BAMCMFoxCzAJBgNVBAYTAk5MMSQwIgYDVQQKDBtTcGhlcmVvbiBJbnRlcm5hdGlvbmFsIEIuVi4xCzAJBgNVBAsMAklUMRgwFgYDVQQDDA9jYS5zcGhlcmVvbi5jb20wHhcNMjQxMTI2MTk0OTMyWhcNMjUwMjI0MjE0OTMyWjCBjjELMAkGA1UEBhMCTkwxFjAUBgNVBAgMDU5vb3JkLUhvbGxhbmQxEjAQBgNVBAcMCUFtc3RlcmRhbTEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBCLlYuMQswCQYDVQQLDAJJVDEgMB4GA1UEAwwXZnVua2UuZGVtby5zcGhlcmVvbi5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATfCH3q528xCDpTCHAd1bgjh5wytgU0qWKG4XOihHTpXyFW9budmWwOFioROIbSx1mN6En8E560QjlZzRknIzOzo4IBXTCCAVkwHQYDVR0OBBYEFIdPsQ39CfxOJY1T2qlddg7Gwv6nMB8GA1UdIwQYMBaAFOcHyl2VXPnIoP7O42RFHoCzLDLBMGEGCCsGAQUFBwEBBFUwUzBRBggrBgEFBQcwAoZFaHR0cDovL2V1LmNlcnQuZXpjYS5pby9jZXJ0cy9kYWExYjRiNC04NWZkLTRiYTQtYjk2Yi0zMzJhZGQ4OTljZTkuY2VyMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAiBgNVHREEGzAZghdmdW5rZS5kZW1vLnNwaGVyZW9uLmNvbTAOBgNVHQ8BAf8EBAMCBaAwYQYDVR0fBFowWDBWoFSgUoZQaHR0cDovL2V1LmNybC5lemNhLmlvL2NybC8yY2RmN2M1ZS1iOWNkLTQzMTctYmI1Ni0zODZkMjQ0MzgwZTIvY2FzcGhlcmVvbmNvbS5jcmwwCgYIKoZIzj0EAwIDSAAwRQIhALz0V+89FVAIEamNEnXy/TP2bBJR5yE8i/1l4fhSeGdUAiAk8/1fvlqgdD+DS48bBXK0s0ZfALgdAGO/jOttA+tLYg==',
      'MIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBaMQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBCLlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0MDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNVBAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAWBgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQqT1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6AsywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8AQlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI=',
    ]

    const trustAnchors = [
      '-----BEGIN CERTIFICATE-----\nMIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBa\nMQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBC\nLlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0\nMDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNV\nBAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAW\nBgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\nBEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQq\nT1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6A\nsywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8E\nBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8A\nQlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI=\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nMIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==\n-----END CERTIFICATE-----',
    ]
    const result = await validateX509CertificateChain({
      chain,
      trustAnchors,
      // opts: {trustRootWhenNoAnchors: false} /*, trustedCerts: [sphereonCA]*/,
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  // FIXME: These CA CERTS are not valid anymore
  it.skip('should validate a valid certificate chain without providing a CA as trust anchor, but with trustRoot enabled', async () => {
    const sphereonSDJWTCA =
      '-----BEGIN CERTIFICATE-----\n' +
      'MIICCDCCAa6gAwIBAgITAPMgqwtYzWPBXaobHhxG9iSydTAKBggqhkjOPQQDAjBa\n' +
      'MQswCQYDVQQGEwJOTDEkMCIGA1UECgwbU3BoZXJlb24gSW50ZXJuYXRpb25hbCBC\n' +
      'LlYuMQswCQYDVQQLDAJJVDEYMBYGA1UEAwwPY2Euc3BoZXJlb24uY29tMB4XDTI0\n' +
      'MDcyODIxMjY0OVoXDTM0MDcyODIxMjY0OVowWjELMAkGA1UEBhMCTkwxJDAiBgNV\n' +
      'BAoMG1NwaGVyZW9uIEludGVybmF0aW9uYWwgQi5WLjELMAkGA1UECwwCSVQxGDAW\n' +
      'BgNVBAMMD2NhLnNwaGVyZW9uLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\n' +
      'BEiA0KeESSNrOcmCDga8YsBkUTgowZGwqvL2n91JUpAMdRSwvlVFdqdiLXnk2pQq\n' +
      'T1vZnDG0I+x+iz2EbdsG0aajUzBRMB0GA1UdDgQWBBTnB8pdlVz5yKD+zuNkRR6A\n' +
      'sywywTAOBgNVHQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8E\n' +
      'BTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIHH7ie1OAAbff5262rzZVQa8J9zENG8A\n' +
      'QlHHFydMdgaXAiEA1Ib82mhHIYDziE0DDbHEAXOs98al+7dpo8fPGVGTeKI=\n' +
      '-----END CERTIFICATE-----'
    const result = await validateX509CertificateChain({
      chain: [sphereonTest, sphereonCA],
      trustAnchors: [sphereonSDJWTCA],
      opts: { trustRootWhenNoAnchors: false } /*, trustedCerts: [sphereonCA]*/,
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })
  it('should validate a single certificate in the chain that is not signed by a CA and blindly trusted', async () => {
    const result = await validateX509CertificateChain({
      chain: [animoFunkeDER],
      trustAnchors: [sphereonCA, funkeTestCA],
      opts: {
        trustRootWhenNoAnchors: true,
        allowSingleNoCAChainElement: true,
        blindlyTrustedAnchors: [animoFunkeDER],
      },
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain validation success as single cert if blindly trusted. WARNING: ONLY USE FOR TESTING PURPOSES.',
    })

    const certInfo = await getCertificateInfo(pemOrDerToX509Certificate(animoFunkeDER))
    expect('funke.animo.id').toEqual(certInfo.subject.subjectAlternativeNames[0].value)
  })

  // TODO disabled as cert expired
  it.skip('should validate a valid certificate chain without providing a CA as trust anchor, but with trustRoot enabled', async () => {
    const result = await validateX509CertificateChain({
      chain: [walletPEM],
      trustAnchors: [sphereonCA],
      opts: {
        client: {
          clientId: 'wallet.test.sphereon.com',
          clientIdScheme: 'x509_san_dns',
        },
      },
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  // TODO: Current implementation does not resolve the chain by itself
  it.skip('should validate a valid chain without providing trust anchor in chain, but one that is resolvable and specified as its trustanchor', async () => {
    const result = await validateX509CertificateChain({
      chain: [sphereonTest],
      opts: { trustRootWhenNoAnchors: false },
      trustAnchors: [sphereonCA],
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  it('should validate Funke certificate chain', async () => {
    const result = await validateX509CertificateChain({
      chain: [funkeTestIssuer, funkeTestCA],
      trustAnchors: [funkeTestCA],
      verificationTime: new Date('2025-01-01'),
    })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  it('should not validate an invalid certificate chain', async () => {
    const result = await validateX509CertificateChain({ chain: invalidChain })
    expect(result).toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain validation failed for C=,O=,OU=,CN=test,E-mail=.',
    })
  })

  it('should throw an error for an empty chain', async () => {
    await expect(validateX509CertificateChain({ chain: [] })).resolves.toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain in DER or PEM format must not be empty',
    })
  })

  // TODO: disabled as cert expired
  it.skip('should validate with a trusted root certificate', async () => {
    const result = await validateX509CertificateChain({ chain: validChain, trustAnchors: [sphereonCA] })
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  it('should not validate with an untrusted root certificate', async () => {
    const result = await validateX509CertificateChain({ chain: validChain, trustAnchors: [externalTestCert] })
    console.log(JSON.stringify(result, null, 2))
    expect(result).toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain validation failed for CN=wallet.test.sphereon.com.',
    })
  })

  it('should validate with allowNoTrustAnchorsFound', async () => {
    const verificationDate = new Date('2024-08-07')
    const result = await validateX509CertificateChain({
      chain: validChain,
      verificationTime: verificationDate,
      trustAnchors: [externalTestCert],
      opts: { allowNoTrustAnchorsFound: true },
    })
    console.log(JSON.stringify(result, null, 2))
    expect(result).toMatchObject({
      critical: false,
      error: false,
      message: 'Certificate chain was valid',
    })
  })

  it('should validate with a valid verification date', async () => {
    const verificationDate = new Date('2024-07-07')
    const result = await validateX509CertificateChain({
      chain: validChain,
      verificationTime: verificationDate,
      trustAnchors: [sphereonCA, funkeTestCA],
    })
    expect(result).toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain validation failed for CN=wallet.test.sphereon.com.',
    })
  })

  it('should not validate with a verification date after expiry', async () => {
    const verificationDate = new Date('2033-06-01')
    const result = await validateX509CertificateChain({
      chain: validChain,
      verificationTime: verificationDate,
      opts: { trustRootWhenNoAnchors: true },
    })
    expect(result).toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain validation failed for CN=wallet.test.sphereon.com.',
    })
  })

  it('should not validate with a verification date before becoming valid', async () => {
    const verificationDate = new Date('2013-06-01')
    const result = await validateX509CertificateChain({
      chain: validChain,
      verificationTime: verificationDate,
      opts: { trustRootWhenNoAnchors: true },
    })
    expect(result).toMatchObject({
      critical: true,
      error: true,
      message: 'Certificate chain validation failed for CN=wallet.test.sphereon.com.',
    })
  })

  it('should validate with client id scheme x509_san_dns and san_uri', async () => {
    expect(() =>
      assertCertificateMatchesClientIdScheme(pemOrDerToX509Certificate(sphereonTest), 'funke.demo.sphereon.com', 'x509_san_dns')
    ).not.toThrow()
    expect(() => assertCertificateMatchesClientIdScheme(pemOrDerToX509Certificate(sphereonTest), 'nope.test.sphereon.com', 'x509_san_dns')).toThrow()

    // The extension san_uri is not in the cert, so should throw error in case the above validating clientid for san_dns is used but now for san_uri
    expect(() => assertCertificateMatchesClientIdScheme(pemOrDerToX509Certificate(sphereonTest), 'funke.demo.sphereon.com', 'x509_san_uri')).toThrow()
  })
})
