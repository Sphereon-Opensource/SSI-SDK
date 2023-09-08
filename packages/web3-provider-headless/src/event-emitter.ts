export class EventEmitter {
  private readonly listeners: Record<string, Array<(...args: any[]) => void>> = Object.create(null)

  emit(eventName: string, ...args: any[]): boolean {
    this.listeners[eventName]?.forEach((listener) => {
      listener(...args)
    })
    return true
  }

  on(eventName: string, listener: (...args: any[]) => void): this {
    this.listeners[eventName] ??= []
    this.listeners[eventName]?.push(listener)
    return this
  }

  off(eventName: string, listener: (...args: any[]) => void): this {
    const listeners = this.listeners[eventName] ?? []

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const [i, listener_] of listeners.entries()) {
      if (listener === listener_) {
        listeners.splice(i, 1)
        break
      }
    }

    return this
  }

  once(eventName: string, listener: (...args: any[]) => void): this {
    const cb = (...args: any[]): void => {
      this.off(eventName, cb)
      listener(...args)
    }

    return this.on(eventName, cb)
  }
}
