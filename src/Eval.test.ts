import { ENum, EBool, EIf, ELet, EVar, ELam, EApp } from './Expr'
import {
  VBool,
  VFunction,
  evaluate,
  LookupError,
  VNum,
  RuntimeError,
  VNative,
  Value,
} from './Eval'
import { Environment } from './Environment'

describe('Eval', () => {
  it('evaluates a Num', () => {
    // 1
    const value = evaluate(new ENum(1))
    expect(value).toEqual(new VNum(1))
  })

  it('evaluates a Bool', () => {
    // True
    const value = evaluate(new EBool(true))
    expect(value).toEqual(new VBool(true))
  })

  it('evaluates If true expressions', () => {
    // if True then 1 else 2
    const value = evaluate(
      new EIf(new EBool(true), new ENum(1), new ENum(2)),
    )
    expect(value).toEqual(new VNum(1))
  })

  it('evaluates If false expressions', () => {
    // if False then 1 else 2
    const value = evaluate(
      new EIf(new EBool(false), new ENum(1), new ENum(2)),
    )
    expect(value).toEqual(new VNum(2))
  })

  it('throws on If non-boolean condition', () => {
    // if 0 then 1 else 2
    expect(() =>
      evaluate(new EIf(new ENum(0), new ENum(1), new ENum(2))),
    ).toThrowError(RuntimeError)
  })

  it('evaluates Let expression', () => {
    // let x = 1 in x
    const value = evaluate(new ELet('x', new ENum(1), new EVar('x')))
    expect(value).toEqual(new VNum(1))
  })

  it('evaluates undefined Var expression', () => {
    // x
    expect(() => evaluate(new EVar('x'))).toThrowError(LookupError)
  })

  it('evaluates a Lambda expression', () => {
    // \x x
    const value = evaluate(new ELam('x', new EVar('x')))
    expect(value).toEqual(
      new VFunction('x', new EVar('x'), new Environment()),
    )
  })

  it('evaluates a Lambda application', () => {
    // (\x x) 1
    const value = evaluate(
      new EApp(new ELam('x', new EVar('x')), new ENum(1)),
    )
    expect(value).toEqual(new VNum(1))
  })

  it('throws non-Lambda application', () => {
    // 1 2
    expect(() =>
      evaluate(new EApp(new ENum(1), new ENum(1))),
    ).toThrowError(RuntimeError)
  })

  it('Lambda closes over enclosing scope', () => {
    // let x = 1 in (\y x) 2
    const value = evaluate(
      new ELet(
        'x',
        new ENum(1),
        new EApp(new ELam('y', new EVar('x')), new ENum(2)),
      ),
    )
    expect(value).toEqual(new VNum(1))
  })

  it('inner Let should not overwrite outer Let', () => {
    // let x = 1 in
    // let y = (let x = 2 in x) in
    // x
    const expr = new ELet(
      'x',
      new ENum(1),
      new ELet(
        'y',
        new ELet('x', new ENum(2), new EVar('x')),
        new EVar('x'),
      ),
    )
    expect(evaluate(expr)).toEqual(new VNum(1))
  })

  it('variable defined in Let body Lambda should not be in scope in Let value', () => {
    // let f = (\y x) in
    // let x = 1 in
    // f x
    const expr = new ELet(
      'f',
      new ELam('y', new EVar('x')),
      new ELet(
        'x',
        new ENum(1),
        new EApp(new EVar('f'), new EVar('x')),
      ),
    )
    expect(() => evaluate(expr)).toThrowError(LookupError)
  })

  it('inner Lambda does not override outer Let', () => {
    // let y = (\x 1) 2 in x
    const expr = new ELet(
      'y',
      new EApp(new ELam('x', new ENum(1)), new ENum(2)),
      new EVar('x'),
    )
    expect(() => evaluate(expr)).toThrowError(LookupError)
  })

  it('Lambdas should not be recursive', () => {
    // let f = (\x f) in f 1
    const expr = new ELet(
      'f',
      new ELam('x', new EVar('f')),
      new EApp(new EVar('f'), new ENum(1)),
    )
    expect(() => evaluate(expr)).toThrowError(LookupError)
  })

  it('accepts a non-local environment', () => {
    // x
    const global: Environment<Value> = new Environment()
    global.define('x', new VNum(1))
    const expr = new EVar('x')
    expect(evaluate(expr, global)).toEqual(new VNum(1))
  })

  it('supports native functions', () => {
    // f 1
    const global: Environment<Value> = new Environment()
    global.define('f', new VNative(value => new VNum(1)))
    const expr = new EApp(new EVar('f'), new ENum(2))
    expect(evaluate(expr, global)).toEqual(new VNum(1))
  })
})
