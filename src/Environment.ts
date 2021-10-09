import { Value, LookupError } from './Eval'

export class Environment<T> {
  #parent: Environment<T> | undefined
  #current: Map<string, T> = new Map()
  constructor(parent?: Environment<T>) {
    this.#parent = parent
  }
  lookup(name: string): T {
    let value = this.#current.get(name)
    if (value != null) {
      return value
    } else if (this.#parent != null) {
      return this.#parent.lookup(name)
    }
    throw new LookupError(
      `LookupError: variable ${name} is not defined.`,
    )
  }
  define(name: string, value: T) {
    this.#current.set(name, value)
  }
}
