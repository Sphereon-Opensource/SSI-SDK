// noinspection JSUnusedGlobalSymbols
import {AuthorizationResponsePayload} from "@sphereon/did-auth-siop";

export interface ClaimPayloadCommonOpts {
    [x: string]: any;
}
export declare enum AuthorizationRequestStateStatus {
    CREATED = "created",
    SENT = "sent",
    RECEIVED = "received",
    VERIFIED = "verified",
    ERROR = "error"
}
export declare enum AuthorizationResponseStateStatus {
    CREATED = "created",
    SENT = "sent",
    RECEIVED = "received",
    VERIFIED = "verified",
    ERROR = "error"
}

export interface GenerateAuthRequestURIResponse {
    correlationId: string;
    definitionId: string;
    authRequestURI: string;
    authStatusURI: string;
}


export interface AuthStatusResponse {
    status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus;
    correlationId: string;
    error?: string
    definitionId: string;
    lastUpdated: number;
    payload?: AuthorizationResponsePayload; // Only put in here once the status reaches Verified on the RP side
}
