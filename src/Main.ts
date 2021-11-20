import { Environment } from './Environment'
import { Value } from './Eval'
import { Context, infer } from './Infer'
import { interpret } from './Interpreter'
import { tokenize } from './Lexer'
import { parse } from './Parser'

export function run(
  source: string,
  environment: Environment<string, Value> = new Environment(),
  context: Context = new Context(),
): Value {
  const tokens = tokenize(source)
  const program = parse(tokens)
  // TODO: Infer program as a whole
  for (const [name, expr] of program.bindings.entries()) {
    const scheme = infer(expr, context)
    context.set(name, scheme)
  }
  const value = interpret(program, environment)
  return value
}
