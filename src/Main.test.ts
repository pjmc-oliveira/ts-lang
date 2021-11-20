import { Environment } from './Environment'
import { Value, VFunction, VNative, VNum } from './Eval'
import { Context, InferError, Scheme, TArr, TNum } from './Infer'
import { run } from './Main'

describe('Main', () => {
  it('runs a simple program', () => {
    expect(
      run(`
      def main = 1
    `),
    ).toEqual(new VNum(1))
  })

  it('runs a program with multiple bindings', () => {
    // NOTE: this is order dependent
    expect(
      run(`
      def foo = 1
      def main = foo
    `),
    ).toEqual(new VNum(1))
  })

  it('runs a program with an environment', () => {
    const env: Environment<string, Value> = new Environment()
    env.define(
      'plus1',
      new VNative(value => {
        const num = value as VNum
        return new VNum(num.value + 1)
      }),
    )
    const program = 'def main = plus1 1'
    const ctx = new Context([
      ['plus1', new Scheme([], new TArr(TNum, TNum))],
    ])
    const result = run(program, env, ctx)
    expect(result).toEqual(new VNum(2))
  })

  it('runs a program with type inference', () => {
    const env: Environment<string, Value> = new Environment()
    env.define(
      'plus1',
      new VNative(value => {
        const num = value as VNum
        return new VNum(num.value + 1)
      }),
    )
    const ctx = new Context([
      ['plus1', new Scheme([], new TArr(TNum, TNum))],
    ])
    const program = 'def main = plus1 False'
    expect(() => run(program, env, ctx)).toThrowError(InferError)
  })
})
