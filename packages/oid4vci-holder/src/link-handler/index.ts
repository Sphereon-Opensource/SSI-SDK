import {CredentialOfferClient} from "@sphereon/oid4vci-client";
import {convertURIToJsonObject} from "@sphereon/oid4vci-common";
import {DefaultLinkPriorities, LinkHandlerAdapter} from "@sphereon/ssi-sdk.core";
import {IMachineStatePersistence, interpreterStartOrResume} from "@sphereon/ssi-sdk.xstate-machine-persistence";
import {IAgentContext} from "@veramo/core";
import {
    GetMachineArgs,
    IOID4VCIHolder,
    OID4VCIMachineEvents,
    OID4VCIMachineInterpreter,
    OID4VCIMachineState
} from "../types/IOID4VCIHolder";


export class OID4VCIHolderLinkHandler extends LinkHandlerAdapter {
    private readonly context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>;
    private readonly stateNavigationListener: ((oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>) | undefined;

    constructor(args: Pick<GetMachineArgs, 'stateNavigationListener'> & { priority?: number | DefaultLinkPriorities; protocols?: Array<string | RegExp> ,context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence> }) {
        super({...args, id: 'OID4VCIHolder'});
        this.context = args.context
        this.stateNavigationListener = args.stateNavigationListener
    }


    async handle(url: string | URL): Promise<void> {
        const uri = new URL(url).toString()
        const offerData = convertURIToJsonObject(uri) as Record<string, unknown>;
        const hasCode = 'code' in offerData && !!offerData.code && !('issuer' in offerData);
        const code = hasCode ? offerData.code : undefined;
        console.log('offer contained code: ', code);

        const oid4vciMachine = await this.context.agent.oid4vciHolderGetMachineInterpreter({
            requestData: {
                credentialOffer: await CredentialOfferClient.fromURI(uri),
                uri,
            },
            stateNavigationListener: this.stateNavigationListener,
        });

        const stateType = hasCode ? 'existing' : 'new';
        const interpreter = oid4vciMachine.interpreter;
        await interpreterStartOrResume({
            stateType,
            interpreter: oid4vciMachine.interpreter,
            context: this.context,
            cleanupAllOtherInstances: true,
            cleanupOnFinalState: true,
            singletonCheck: true,
        });
        if (code && offerData.uri) {
            interpreter.send(OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE, {data: offerData.uri});
        }


    }
}
