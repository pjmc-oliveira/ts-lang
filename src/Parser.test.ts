import { Token } from './Lexer'
import { parse } from './Parser'
import {
  EApp,
  Binding,
  EBool,
  EIf,
  ELam,
  ELet,
  EVar,
  ENum,
} from './Expr'

describe('Parser', () => {
  it('parses an empty list', () => {
    expect(parse([])).toEqual([])
  })

  it('parses two bindings', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Var('x'),

      Token.Def,
      Token.Var('y'),
      Token.Equal,
      Token.Var('y'),
    ]
    const bindings = parse(tokens)
    expect(bindings).toEqual([
      new Binding('x', new EVar('x')),
      new Binding('y', new EVar('y')),
    ])
  })

  it('parses a variable expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Var('x'),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(new EVar('x'))
  })

  it('parses a number expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Num(123),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(new ENum(123))
  })

  it('parses a true boolean expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Bool(true),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(new EBool(true))
  })

  it('parses a false boolean expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Bool(false),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(new EBool(false))
  })

  it('parses an if expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.If,
      Token.Bool(true),
      Token.Then,
      Token.Num(123),
      Token.Else,
      Token.Var('x'),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(
      new EIf(new EBool(true), new ENum(123), new EVar('x')),
    )
  })

  it('parses a let expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Let,
      Token.Var('x'),
      Token.Equal,
      Token.Bool(true),
      Token.In,
      Token.Num(123),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(
      new ELet('x', new EBool(true), new ENum(123)),
    )
  })

  it('parses a lambda expression', () => {
    const tokens = [
      Token.Def,
      Token.Var('f'),
      Token.Equal,
      Token.BackSlash,
      Token.Var('x'),
      Token.Num(123),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(new ELam('x', new ENum(123)))
  })

  it('parses function application', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Var('f'),
      Token.Var('x'),
      Token.Var('y'),
      Token.Var('z'),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(
      new EApp(
        new EApp(
          new EApp(new EVar('f'), new EVar('x')),
          new EVar('y'),
        ),
        new EVar('z'),
      ),
    )
  })

  it('parses dangling lambdas', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Var('f'),
      Token.BackSlash,
      Token.Var('x'),
      Token.Var('x'),
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(
      new EApp(new EVar('f'), new ELam('x', new EVar('x'))),
    )
  })

  it('parses nested function application', () => {
    const tokens = [
      Token.Def,
      Token.Var('x'),
      Token.Equal,
      Token.Var('f'),
      Token.LeftParen,
      Token.Var('g'),
      Token.Var('x'),
      Token.RightParen,
    ]
    const bindings = parse(tokens)
    const expr = bindings[0].expr
    expect(expr).toEqual(
      new EApp(new EVar('f'), new EApp(new EVar('g'), new EVar('x'))),
    )
  })
})
