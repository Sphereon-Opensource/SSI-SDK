import {importJWK, JWK, jwtVerify, JWTVerifyOptions} from "jose";
import {com} from "@sphereon/openid-federation-client";
import ICryptoCallbackServiceJS = com.sphereon.oid.fed.client.crypto.ICryptoCallbackServiceJS;

export const defaultCryptoJSImpl: ICryptoCallbackServiceJS = {
        verify: async (jwt: string, key: any): Promise<boolean> => {
            const jwk:JWK = { ...key }
            const publicKey = await importJWK(jwk)

            const now = new Date()
            const past = now.setDate(now.getDate() - 60)

            const options: JWTVerifyOptions = {
                currentDate: new Date(past)
            }

            const result = await jwtVerify(jwt, publicKey, options)
            return result !== undefined
        }
}
