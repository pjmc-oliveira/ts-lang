import { evaluate, RuntimeError, Value } from './Eval'
import { Environment } from './Environment'
import { Binding, Expr } from './Expr'

export class DuplicateBindingError extends RuntimeError {}

class Interpreter {
  #bindings: Map<string, Expr> = new Map()
  #environment: Environment<Value>
  constructor(
    bindings: Binding[],
    environment: Environment<Value> = new Environment(),
  ) {
    for (const binding of bindings) {
      if (this.#bindings.has(binding.name))
        throw new DuplicateBindingError(
          `Multiple definitions for '${binding.name}'`,
        )
      this.#bindings.set(binding.name, binding.expr)
    }
    this.#environment = environment
  }
  run(main: string): Value {
    const entry = this.#bindings.get(main)
    if (entry == null)
      throw new RuntimeError(`No binding for ${main} defined.`)
    for (const [name, expr] of this.#bindings.entries()) {
      if (name === main) continue
      this.#environment.define(
        name,
        evaluate(expr, this.#environment),
      )
    }
    return evaluate(entry, this.#environment)
  }
}

export function interpret(
  program: Binding[],
  environment?: Environment<Value>,
): Value {
  const interpreter = new Interpreter(program, environment)
  return interpreter.run('main')
}
