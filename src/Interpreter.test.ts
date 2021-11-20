import { RuntimeError, Value, VBool, VNative, VNum } from './Eval'
import { Environment } from './Environment'
import { interpret } from './Interpreter'
import { tokenize } from './Lexer'
import { parse } from './Parser'

describe('Interpreter', () => {
  it('interprets a binding', () => {
    const program = parse(
      tokenize(`
      def main = if True then 1 else 2
    `),
    )
    expect(interpret(program)).toEqual(new VNum(1))
  })

  it('interprets the main binding', () => {
    const program = parse(
      tokenize(`
      def foo = 1
      def main = (\\x 2) 1
    `),
    )
    expect(interpret(program)).toEqual(new VNum(2))
  })

  it('requires a main binding', () => {
    const program = parse(
      tokenize(`
      def foo = 1
      def bar = 2
    `),
    )
    expect(() => interpret(program)).toThrowError(RuntimeError)
  })

  it('expressions can reference other bindings', () => {
    const program = parse(
      tokenize(`
      def x = 1
      def main = x
    `),
    )
    expect(interpret(program)).toEqual(new VNum(1))
  })

  it('accepts built-ins', () => {
    const builtIns: Environment<string, Value> = new Environment()
    builtIns.define('x', new VNum(1))
    const program = parse(
      tokenize(`
      def main = x
    `),
    )
    expect(interpret(program, builtIns)).toEqual(new VNum(1))
  })

  it('top-level bindings can be recursive', () => {
    const builtIns: Environment<string, Value> = new Environment()
    builtIns.define(
      'eq0',
      new VNative(value => new VBool((value as VNum).value === 0)),
    )
    builtIns.define(
      'decr',
      new VNative(value => new VNum((value as VNum).value - 1)),
    )
    const program = parse(
      tokenize(`
      def count = \\n
        if eq0 n then
          0
        else
          count (decr n)
      def main = count 10
    `),
    )
    expect(interpret(program, builtIns)).toEqual(new VNum(0))
  })

  it('top-level bindings can be mutually recursive', () => {
    const builtIns: Environment<string, Value> = new Environment()
    builtIns.define(
      'le0',
      new VNative(value => new VBool((value as VNum).value <= 0)),
    )
    builtIns.define(
      'decr',
      new VNative(value => new VNum((value as VNum).value - 1)),
    )
    const program = parse(
      tokenize(`
      def count1 = \\n
        if le0 n then
          0
        else
          count2 (decr n)

      def count2 = \\n
        if le0 n then
          0
        else
          count1 (decr n)

      def main = count1 10
    `),
    )
    expect(interpret(program, builtIns)).toEqual(new VNum(0))
  })

  it('can shadow globals variables', () => {
    const builtIns: Environment<string, Value> = new Environment()
    builtIns.define('x', new VNum(1))
    const program = parse(
      tokenize(`
      def x = 2
      def main = x
    `),
    )
    expect(interpret(program, builtIns)).toEqual(new VNum(2))
  })

  // it('top-level bindings are evaluated lazily', () => {
  //   const builtIns = new Environment()
  //   const boom = jest.fn(_ => new VNum(1))
  //   builtIns.define('boom', new VNative(boom))
  //   const program = parse(
  //     tokenize(`
  //     def x = boom 0
  //     def main = 2
  //   `),
  //   )
  //   expect(interpret(program, builtIns)).toEqual(new VNum(2))
  //   expect(boom).toHaveBeenCalledTimes(0)
  // })
})
