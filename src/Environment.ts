import { Value, LookupError } from './Eval'

export class Environment<K, V> {
  #parent: Environment<K, V> | undefined
  #current: Map<K, V> = new Map()
  constructor(parent?: Environment<K, V>) {
    this.#parent = parent
  }
  local(): Environment<K, V> {
    const local = new Environment(this)
    return local
  }
  lookup(name: K): V {
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
  define(name: K, value: V) {
    this.#current.set(name, value)
  }
}
