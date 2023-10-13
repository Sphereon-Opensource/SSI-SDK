import {AuthorizationRequest, RP, URI} from '@sphereon/did-auth-siop'
import {ICreateAuthRequestArgs, IPEXOptions, IRequiredContext, IRPOptions} from './types/ISIOPv2RP'
import {IPresentationDefinition} from '@sphereon/pex'
import {createRPBuilder, getRequestVersion} from './functions'
import {v4 as uuidv4} from 'uuid'

export class RPInstance {
    private _rp: RP | undefined
    private readonly _pexOptions: IPEXOptions | undefined
    private readonly _rpOptions: IRPOptions

    public constructor({rpOpts, pexOpts}: { rpOpts: IRPOptions; pexOpts?: IPEXOptions }) {
        this._rpOptions = rpOpts
        this._pexOptions = pexOpts
    }

    public async get(context: IRequiredContext): Promise<RP> {
        if (!this._rp) {
            const builder = await createRPBuilder({
                rpOpts: this._rpOptions,
                pexOpts: this._pexOptions,
                context,
            })
            this._rp = builder.build()
        }
        return this._rp!
    }

    get rpOptions() {
        return this._rpOptions
    }

    get pexOptions() {
        return this._pexOptions
    }

    public hasDefinition(): boolean {
        return this.definitionId !== undefined
    }

    get definitionId(): string | undefined {
        return this.pexOptions?.definitionId
    }

    public async getPresentationDefinition(context: IRequiredContext): Promise<IPresentationDefinition | undefined> {
        return this.definitionId
            ? await context.agent.pexStoreGetDefinition({
                definitionId: this.definitionId,
                storeId: this.pexOptions?.storeId,
                namespace: this.pexOptions?.storeNamespace,
            })
            : undefined
    }

    public async createAuthorizationRequestURI(createArgs: Omit<ICreateAuthRequestArgs, 'definitionId'>, context: IRequiredContext): Promise<URI> {
        const {correlationId, claims, requestByReferenceURI, responseURI, responseURIType} = createArgs
        const nonce = createArgs.nonce ?? uuidv4()
        const state = createArgs.state ?? correlationId
        return await this.get(context).then((rp) =>
            rp.createAuthorizationRequestURI({
                version: getRequestVersion(this.rpOptions),
                correlationId,
                nonce,
                state,
                claims,
                requestByReferenceURI,
                responseURI,
                responseURIType
            })
        )
    }

    public async createAuthorizationRequest(
        createArgs: Omit<ICreateAuthRequestArgs, 'definitionId'>,
        context: IRequiredContext
    ): Promise<AuthorizationRequest> {
        const {correlationId, claims, requestByReferenceURI, responseURI, responseURIType} = createArgs
        const nonce = createArgs.nonce ?? uuidv4()
        const state = createArgs.state ?? correlationId
        return await this.get(context).then((rp) =>
            rp.createAuthorizationRequest({
                version: getRequestVersion(this.rpOptions),
                correlationId,
                nonce,
                state,
                claims,
                requestByReferenceURI,
                responseURIType,
                responseURI,
            })
        )
    }
}
