import {
    com
} from "../../../../../OpenID-Federation/build/js/packages/openid-federation-modules-openid-federation-client";
import * as jose from 'jose'
import ICryptoServiceCallbackJS = com.sphereon.oid.fed.client.crypto.ICryptoServiceCallbackJS;
import {JWK} from "jose";

type JWKS = {
    keys: JWK[]
}

export class CryptoPlatformCallback implements ICryptoServiceCallbackJS {

    async verify(jwt: string): Promise<boolean> {
        const decodedProtectedHeader = jose.decodeProtectedHeader(jwt)
        const kid = decodedProtectedHeader.kid

        const payload = jose.decodeJwt(jwt)

        const key = (payload?.jwks as JWKS).keys.find(publicKey => publicKey.kid === kid)

        if (key === undefined || key === null) {
            return false
        }

        const publicKey = await jose.importJWK(key)

        const options = {
            currentDate: new Date(Date.parse("Oct 14, 2024 01:00:00"))
        }

        const result = await jose.jwtVerify(jwt, publicKey, options)
        return result !== undefined
    }
}
