import { Environment } from './Environment'
import {
  ExprVisitor,
  Expr,
  EVar,
  ENum,
  EBool,
  EIf,
  ELet,
  EApp,
  ELam,
} from './Expr'

export class RuntimeError extends Error {}
export class LookupError extends RuntimeError {}

class Evaluator implements ExprVisitor<Value> {
  #environment: Environment<string, Value>
  constructor(
    environment: Environment<string, Value> = new Environment(),
  ) {
    this.#environment = environment
  }
  run(expr: Expr): Value {
    return expr.accept(this)
  }
  var(expr: EVar): Value {
    return this.#environment.lookup(expr.name)
  }
  num(expr: ENum): Value {
    return new VNum(expr.value)
  }
  bool(expr: EBool): Value {
    return new VBool(expr.value)
  }
  if(expr: EIf): Value {
    const condition = this.run(expr.condition)
    if (condition instanceof VBool) {
      return condition.value
        ? this.run(expr.consequence)
        : this.run(expr.alternative)
    }
    throw new RuntimeError(`RuntimeError: ${expr} is not a Bool.`)
  }
  let(expr: ELet): Value {
    const local = new Environment(this.#environment)
    local.define(expr.name, this.run(expr.definition))
    const interpreter = new Evaluator(local)
    return interpreter.run(expr.body)
  }
  lambda(expr: ELam): Value {
    const capture = new Environment(this.#environment)
    return new VFunction(expr.param, expr.body, capture)
  }
  apply(expr: EApp): Value {
    const closure = this.run(expr.func)
    return closure.apply(this.run(expr.argument))
  }
}

export abstract class Value {
  apply(argument: Value): Value {
    throw new RuntimeError(
      `RuntimeError: ${this.constructor.name} is not a function.`,
    )
  }
}

export class VNum extends Value {
  value: number
  constructor(value: number) {
    super()
    this.value = value
  }
}

export class VBool extends Value {
  value: boolean
  constructor(value: boolean) {
    super()
    this.value = value
  }
}

export class VFunction extends Value {
  closure: Environment<string, Value>
  parameter: string
  body: Expr
  constructor(
    parameter: string,
    body: Expr,
    environment: Environment<string, Value>,
  ) {
    super()
    this.closure = environment
    this.parameter = parameter
    this.body = body
  }
  apply(argument: Value): Value {
    this.closure.define(this.parameter, argument)
    const interpreter = new Evaluator(this.closure)
    return interpreter.run(this.body)
  }
}

export class VNative extends Value {
  #func: (_: Value) => Value
  constructor(func: (_: Value) => Value) {
    super()
    this.#func = func
  }
  apply(argument: Value): Value {
    return this.#func(argument)
  }
}

export function evaluate(
  expr: Expr,
  environment?: Environment<string, Value>,
): Value {
  const interpreter = new Evaluator(environment)
  return interpreter.run(expr)
}
