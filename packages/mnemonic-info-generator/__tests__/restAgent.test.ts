import 'cross-fetch/polyfill';
import * as fs from 'fs';
import { Server } from 'http';

import { createObjects } from '@veramo/cli/build/lib/objectCreator';
import { getConfig } from '@veramo/cli/build/setup';
import {createAgent, IAgent, IAgentOptions, IDataStore, IKeyManager} from '@veramo/core';
import { AgentRestClient } from '@veramo/remote-client';
import { AgentRouter, RequestWithAgentRouter } from '@veramo/remote-server';
// @ts-ignore
import express from 'express';
import { Connection } from 'typeorm';

import { IMnemonicInfoGenerator } from '../src/types/IMnemonicInfoGenerator';

import mnemonicGenerator from './shared/generateMnemonic';
import seedGenerator from './shared/generateSeed';
import storeSeed from './shared/storeMnemonicInfo';
import {KeyManager} from "@veramo/key-manager";
import {KeyStore, PrivateKeyStore} from "@veramo/data-store";
import {KeyManagementSystem, SecretBox} from "@veramo/kms-local";

jest.setTimeout(30000);

const databaseFile = 'rest-database.sqlite';
const port = 3002;
const basePath = '/agent';

let serverAgent: IAgent;
let restServer: Server;
let dbConnection: Promise<Connection>;

const KMS_SECRET_KEY = "d17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f";

const getAgent = (options?: IAgentOptions) =>
  createAgent<IMnemonicInfoGenerator & IKeyManager & IDataStore>({
    ...options,
    plugins: [
      new KeyManager({
        store: new KeyStore(dbConnection),
        kms: {
          local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))),
        },
      }),
      new AgentRestClient({
        url: 'http://localhost:' + port + basePath,
        enabledMethods: serverAgent.availableMethods(),
        schema: serverAgent.getSchema(),
      }),
    ],
  });

const setup = async (): Promise<boolean> => {
  const config = getConfig('./packages/mnemonic-info-generator/agent.yml');
  config.constants.databaseFile = databaseFile;

  const { agent, db } = createObjects(config, {
    agent: '/agent',
    db: '/dbConnection',
  });
  serverAgent = agent;
  dbConnection = db;

  const agentRouter = AgentRouter({
    exposedMethods: serverAgent.availableMethods(),
  });

  const requestWithAgent = RequestWithAgentRouter({
    agent: serverAgent,
  });

  return new Promise((resolve) => {
    const app = express();
    app.use(basePath, requestWithAgent, agentRouter);
    restServer = app.listen(port, () => {
      resolve(true);
    });
  });
};

const tearDown = async (): Promise<boolean> => {
  restServer.close();
  await (await dbConnection).close();
  fs.unlinkSync(databaseFile);
  return true;
};

const testContext = { getAgent, setup, tearDown };

describe('REST integration tests', () => {
  mnemonicGenerator(testContext);
  seedGenerator(testContext);
  storeSeed(testContext);
});
