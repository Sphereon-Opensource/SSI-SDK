import type { WrappedVerifiableCredential, WrappedVerifiablePresentation, WrappedW3CVerifiableCredential, WrappedW3CVerifiablePresentation } from '../types'

export function isWrappedW3CVerifiableCredential(vc: WrappedVerifiableCredential): vc is WrappedW3CVerifiableCredential {
  return vc.format === 'jwt_vc' || vc.format === 'ldp_vc'
}

export function isWrappedW3CVerifiablePresentation(vp: WrappedVerifiablePresentation): vp is WrappedW3CVerifiablePresentation {
  return vp.format === 'jwt_vp' || vp.format === 'ldp_vp'
}
