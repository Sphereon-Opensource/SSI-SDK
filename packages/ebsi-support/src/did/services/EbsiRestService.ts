import fetch from "cross-fetch";
import {DIDDocument} from "did-resolver";
import {ApiOpts} from "../../types/IEbsiSupport";
import {ebsiGetRegistryAPIUrls} from "../functions";
import {GetDidDocumentParams, GetDidDocumentsParams, GetDidDocumentsResponse} from "../types";

/**
 * Gets the DID document corresponding to the DID.
 * @param {{ params: GetDidDocumentParams, apiOpts?: ApiOpts }} args
 * @returns a did document
 */
export const ebsiGetDidDocument = async (args: { params: GetDidDocumentParams; apiOpts?: ApiOpts }): Promise<DIDDocument> => {
    const { params, apiOpts } = args
    const { did, validAt } = params
    if (!did) {
        throw new Error('did parameter is required')
    }
    const query = validAt ? `?valid_at=${validAt}` : ''
    return await (await fetch(`${ebsiGetRegistryAPIUrls({ ...apiOpts }).query}/${did}${query}`)).json()
}

/**
 * listDidDocuments - Returns a list of identifiers.
 * @param {{ params: GetDidDocumentsParams; apiOpts?: ApiOpts }} args
 * @returns a list of identifiers
 */
export const ebsiListDidDocuments = async (args: { params: GetDidDocumentsParams; apiOpts?: ApiOpts }): Promise<GetDidDocumentsResponse> => {
    const { params, apiOpts } = args
    const { offset, size, controller } = params
    const queryParams: string[] = []
    if (offset) {
        queryParams.push(`page[after]=${offset}`)
    }
    if (size) {
        queryParams.push(`page[size]=${size}`)
    }
    if (controller) {
        queryParams.push(`controller=${controller}`)
    }
    const query = `?${queryParams.filter(Boolean).join('&')}`
    return await (await fetch(`${ebsiGetRegistryAPIUrls({ ...apiOpts }).query}/${query}`)).json()
}
