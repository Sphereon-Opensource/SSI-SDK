import {
    com
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import * as jose from 'jose'
import {JWK} from 'jose'
import ICryptoServiceCallback = com.sphereon.oid.fed.client.crypto.ICryptoServiceCallback;

type JWKS = {
    keys: JWK[]
}

export class CryptoPlatformTestCallback implements ICryptoServiceCallback {

    async verify(jwt: string): Promise<boolean> {
        const decodedProtectedHeader = jose.decodeProtectedHeader(jwt)
        const kid = decodedProtectedHeader.kid

        const payload = jose.decodeJwt(jwt)

        const key = (payload?.jwks as JWKS).keys.find(publicKey => publicKey.kid === kid)

        if (key === undefined || key === null) {
            return false
        }

        const publicKey = await jose.importJWK(key)

        const now = new Date()
        now.setDate(now.getDate() + 14)
        const options = {
            currentDate: now
        }

        const result = await jose.jwtVerify(jwt, publicKey, options)
        return result !== undefined
    }
}
