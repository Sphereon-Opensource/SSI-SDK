import { EventEmitter } from 'events'
import { Loggers, LogLevel, LogMethod } from '../logging'

export enum System {
  GENERAL = 'general',
  KMS = 'kms',
  IDENTITY = 'identity',
  OID4VCI = 'oid4vci',
  OID4VP = 'oid4vp',
  SIOPv2 = 'siopv2',
  PE = 'PE',
  CREDENTIALS = 'credentials',
  WEB3 = 'web3',
  PROFILE = 'profile',
  CONTACT = 'contact',
}

export enum SubSystem {
  KEY = 'key',
  DID_PROVIDER = 'did_provider',
  DID_RESOLVER = 'did_resolver',
  OID4VP_OP = 'oid4vp_op',
  OID4VCI_CLIENT = 'oid4vci_client',
  SIOPv2_OP = 'siopv2_op',
  CONTACT_MANAGER = 'contact_manager',
  VC_ISSUER = 'vc_issuer',
  VC_VERIFIER = 'vc_verifier',
  VC_PERSISTENCE = 'vc_persistence',
  TRANSPORT = 'transport',
  PROFILE = 'profile',
  API = 'api',
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
}

export enum DefaultActionSubType {
  KEY_GENERATION = 'Key generation',
  KEY_IMPORT = 'Key import',
  KEY_PERSISTENCE = 'Key persistence',
  KEY_REMOVAL = 'Key removal',
  DID_CREATION = 'DID creation',
  DID_RESOLUTION = 'DID resolution',
  DID_SERVICE_UPDATE = 'DID service update',
  VC_ISSUE = 'VC issue',
  VC_VERIFY = 'VC verify',
}

export type ActionSubType = DefaultActionSubType | string

export enum InitiatorType {
  USER = 'user',
  SYSTEM = 'system',
  EXTERNAL = 'external',
}

export enum SystemCorrelationIdType {
  DID = 'did',
  URL = 'url',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  PHONE = 'phone',
  USER = 'user',
}

export type EventData = {
  system: string
  subSystemType: string
}

export interface BasicEvent<SourceType, PayloadType extends EventData> {
  id: string
  correlationId?: string
  eventName: string
  initiator?: string
  initiatorType: InitiatorType
  system: System
  subsystem: SubSystem
  data: PayloadType
}

type EmitterInstance = {
  enabled: boolean
  emitter: EventEmitter
}

export class EventManager {
  private static readonly INSTANCE = new EventManager()
  private _emitters = new Map<string, EmitterInstance>()

  private constructor() {}

  public static instance(): EventManager {
    return EventManager.INSTANCE
  }

  register(name: string, emitter: EventEmitter, opts?: { disabled: boolean }): EventEmitter {
    this._emitters.set(name, { emitter, enabled: opts?.disabled !== true })
    return emitter
  }

  get(name: string, opts?: { onlyEnabled?: boolean }): EventEmitter {
    const { emitter, enabled } = this._emitters.get(name) ?? {}
    if (!emitter) {
      throw Error(`No emitter registered with name ${name}`)
    } else if (opts?.onlyEnabled && !enabled) {
      throw Error(`Emitter with name ${name} is not enabled`)
    }
    return emitter
  }

  getOrCreate(name: string, opts?: { onlyEnabled?: boolean }): EventEmitter {
    if (this.has(name)) {
      return this.get(name, opts)
    }
    return this.register(name, new BasicEventEmitter())
  }

  has(name: string): boolean {
    return this._emitters.has(name)
  }

  emitters(filter?: { eventName?: string | symbol; onlyEnabled?: boolean }): Array<EventEmitter> {
    const all = Array.from(new Set(this._emitters.values()))
    return this.emittersImpl(all, filter).map((e) => e.emitter)
  }

  hasEventName(eventName: string | symbol) {
    return this.eventNames().includes(eventName)
  }

  eventNames(): Array<string | symbol> {
    return Array.from(new Set(this.emitters().flatMap((emitter) => emitter.eventNames())))
  }

  emitBasic(event: BasicEvent<any, any>, ...args: any[]) {
    return this.emit(event.eventName, event, args)
  }

  emit(eventName: string | symbol, event: Omit<BasicEvent<any, any>, 'eventName'> | any, ...args: any[]): void {
    if ('id' in event && 'system' in event && !event.eventName) {
      event.eventName = eventName
    }
    Loggers.DEFAULT.options('sphereon:events', {
      methods: [LogMethod.CONSOLE],
      defaultLogLevel: LogLevel.INFO,
    })
      .get('sphereon:events')
      .log(`Emitting '${eventName.toString()}' event`, event)
    const emitters = this.emitters({ eventName })
    emitters.flatMap((emitter) => emitter.emit(eventName, event, args))
  }

  listenerCount(eventName: string | symbol) {
    const emitters = this.emitters({ eventName })
    return emitters.map((emitter) => emitter.listenerCount(eventName)).reduce((previous, current) => current + previous)
  }

  listeners(filter: { emitterName?: string; eventName: string; onlyEnabled?: boolean }): Array<Function> {
    const emitters = filter?.emitterName ? [this.get(filter.emitterName, filter)] : this.emitters(filter)
    return Array.from(
      new Set(
        this.emittersImpl(
          emitters.map((emitter) => {
            return { emitter, enabled: true }
          }),
          filter
        ).flatMap((emitter) => emitter.emitter.listeners(filter.eventName))
      )
    )
  }

  private emittersImpl(
    all: { emitter: EventEmitter; enabled: boolean }[],
    filter?: {
      eventName?: string | symbol
      onlyEnabled?: boolean
    }
  ): Array<EmitterInstance> {
    const { eventName } = filter ?? {}
    if (!eventName) {
      return all
    }
    const filtered = all.filter((emitter) => emitter.emitter.eventNames().includes(eventName) && (emitter.enabled || filter?.onlyEnabled !== true))
    return Array.from(new Set(filtered))
  }
}

export class BasicEventEmitter extends EventEmitter {
  addListener(eventName: string | symbol, listener: (event: BasicEvent<any, any>, ...args: any[]) => void): this {
    return super.addListener(eventName, listener)
  }

  once(eventName: string | symbol, listener: (event: BasicEvent<any, any>, ...args: any[]) => void): this {
    return super.once(eventName, listener)
  }

  emit(eventName: string, event: BasicEvent<any, any>, ...args: any[]): boolean {
    return super.emit(eventName, ...args)
  }
}
