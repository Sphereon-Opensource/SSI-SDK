import fs from 'fs';

import { createObjects } from '@veramo/cli/build/lib/objectCreator';
import { getConfig } from '@veramo/cli/build/setup';
import { Connection } from 'typeorm';

import mnemonicGenerator from './shared/generateMnemonic';
import seedGenerator from './shared/generateSeed';
import storeSeed from './shared/storeMnemonicInfo';

jest.setTimeout(30000);

let dbConnection: Promise<Connection>;
let agent: any;

const setup = async (): Promise<boolean> => {
  const config = getConfig('./packages/mnemonic-info-generator/agent.yml');
  const { localAgent, db } = createObjects(config, {
    localAgent: '/agent',
    db: '/dbConnection',
  });
  agent = localAgent;
  dbConnection = db;

  return true;
};

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close();
  fs.unlinkSync('./database.sqlite');
  return true;
};

const getAgent = () => agent;

const testContext = { getAgent, setup, tearDown };

describe('Local integration tests', () => {
  mnemonicGenerator(testContext);
  seedGenerator(testContext);
  storeSeed(testContext);
});
