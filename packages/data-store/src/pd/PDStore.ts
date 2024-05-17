import {OrPromise} from "@sphereon/ssi-types";
import {DataSource} from "typeorm";
import {AbstractPdStore} from "./AbstractPDStore";
import Debug from "debug";
import {AddPDArgs, GetPDArgs, GetPDsArgs, RemovePDArgs, UpdatePDArgs} from "../types/pd/IAbstractPDStore";
import {PresentationDefinitionItem} from "../types";
import {PartyEntity} from "../entities/contact/PartyEntity";

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:pd-store')

export class PDStore extends AbstractPdStore {
    private readonly dbConnection: OrPromise<DataSource>

    constructor(dbConnection: OrPromise<DataSource>) {
        super()
        this.dbConnection = dbConnection
    }

    getDefinition = async (args: GetPDArgs): Promise<PresentationDefinitionItem> => {
        const repository = (await this.dbConnection).getRepository(PartyEntity)
        return Promise.resolve({} as PresentationDefinitionItem)
    };

    getDefinitions = async (args: GetPDsArgs): Promise<PresentationDefinitionItem> => Promise.resolve({} as PresentationDefinitionItem);

    addDefinition = async (args: AddPDArgs): Promise<PresentationDefinitionItem> => Promise.resolve({} as PresentationDefinitionItem);

    updateDefinition = async (args: UpdatePDArgs): Promise<PresentationDefinitionItem> => Promise.resolve({} as PresentationDefinitionItem);

    deleteDefinition = async (args: RemovePDArgs): Promise<boolean> => Promise.resolve(false);


}