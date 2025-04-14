import { TAgent, IPluginMethodMap, IAgentOptions } from '@veramo/core'
import { createObjects } from './objectCreator'
import yaml from 'yaml'

/**
 * Creates a Veramo agent from a config object containing an `/agent` pointer.
 * @param config - The configuration object
 *
 * @see {@link https://veramo.io/docs/veramo_agent/configuration_internals | Configuration Internals} for details on
 *   the configuration options.
 *
 * @beta - This API may change without a major version bump
 */
export async function createAgentFromConfig<T extends IPluginMethodMap>(config: object): Promise<TAgent<T>> {
  // @ts-ignore
  const { agent } = await createObjects(config, { agent: '/agent' })
  return agent
}

/**
 * Helper function to create a new instance of the {@link Agent} class with correct type
 *
 * @remarks
 * Use {@link TAgent} to configure agent type (list of available methods) for autocomplete in IDE
 *
 * @example
 * ```typescript
 * import { createAgent, IResolver, IMessageHandler } from '@veramo/core'
 * import { AgentRestClient } from '@veramo/remote-client'
 * import { CredentialIssuer, ICredentialIssuer } from '@veramo/credential-w3c'
 * const agent = createAgent<IResolver & IMessageHandler & ICredentialIssuer>({
 *   plugins: [
 *     new CredentialIssuer(),
 *     new AgentRestClient({
 *       url: 'http://localhost:3002/agent',
 *       enabledMethods: [
 *         'resolveDid',
 *         'handleMessage',
 *       ],
 *     }),
 *   ],
 * })
 * ```
 * @param options - Agent configuration options
 * @returns configured agent
 * @public
 */
export async function createAgent<T extends IPluginMethodMap, C = Record<string, any>>(
  options: IAgentOptions & { context?: C },
): Promise<TAgent<T> & { context?: C }> {
  //@ts-ignore
  return new Agent(options) as TAgent<T>
}

/**
 * Parses a yaml config file and returns a config object
 * @param filePath
 */
export const getConfig = async (filePath: string | Buffer | URL): Promise<{ version?: number; [x: string]: any }> => {
  let fileContent: string

  // read file async
  try {
    const fs = await import(/* webpackIgnore: true */ 'fs')
    fileContent = await fs.promises.readFile(filePath, 'utf8')
  } catch (e) {
    console.log('Config file not found: ' + filePath)
    console.log('Use "veramo config create" to create one')
    process.exit(1)
  }

  let config

  try {
    config = yaml.parse(fileContent, { prettyErrors: true })
  } catch (e: any) {
    console.error(`Unable to parse config file: ${e.message} ${e.linePos}`)
    process.exit(1)
  }

  if (config?.version != 3) {
    console.error('Unsupported configuration file version:', config.version)
    process.exit(1)
  }
  return config
}

export async function getAgent<T extends IPluginMethodMap>(fileName: string): Promise<TAgent<T>> {
  try {
    return await createAgentFromConfig<T>(await getConfig(fileName))
  } catch (e: any) {
    console.log('Unable to create agent from ' + fileName + '.', e.message)
    process.exit(1)
  }
}
