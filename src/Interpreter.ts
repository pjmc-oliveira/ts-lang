import { evaluate, RuntimeError, Value } from './Eval'
import { Environment } from './Environment'
import { Expr, Program } from './Expr'

export class DuplicateBindingError extends RuntimeError {}

class Interpreter {
  #bindings: Map<string, Expr> = new Map()
  #environment: Environment<string, Value>
  constructor(
    program: Program,
    environment: Environment<string, Value> = new Environment(),
  ) {
    this.#bindings = program.bindings
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
  program: Program,
  environment?: Environment<string, Value>,
): Value {
  const interpreter = new Interpreter(program, environment)
  return interpreter.run('main')
}
