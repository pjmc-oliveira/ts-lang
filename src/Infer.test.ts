import { EApp, EBool, EIf, ELam, ELet, ENum, EVar } from './Expr'
import {
  infer,
  TArr,
  TBool,
  Scheme,
  TNum,
  TVar,
  Type,
  Context,
  NonBoolCondition,
  MismatchBranch,
} from './Infer'

describe('Infer', () => {
  it('infers number constants', () => {
    // 1 : Num
    const expr = new ENum(1)
    const type = infer(expr)
    expect(type).toEqual(TNum.toScheme())
  })
  it('infers boolean constants', () => {
    // True : Bool
    const expr = new EBool(true)
    const type = infer(expr)
    expect(type).toEqual(TBool.toScheme())
  })
  it('infers let-expression constants', () => {
    // let x = 1 in x : Num
    const expr = new ELet('x', new ENum(1), new EVar('x'))
    const type = infer(expr)
    expect(type).toEqual(TNum.toScheme())
  })
  it('infers identity lambda', () => {
    // \x x : forall a . a -> a
    const expr = new ELam('x', new EVar('x'))
    const type = infer(expr)
    expect(type).toEqual(
      new Scheme([0], new TArr(new TVar(0), new TVar(0))),
    )
  })
  it('infers let-expression lambdas', () => {
    // let id = \x x in id : forall a . a -> a
    const expr = new ELet(
      'id',
      new ELam('x', new EVar('x')),
      new EVar('id'),
    )
    const type = infer(expr)
    expect(type).toEqual(
      new Scheme([0], new TArr(new TVar(0), new TVar(0))),
    )
  })
  it('infers const lambda', () => {
    // \x \y \x : forall a b . a -> b -> a
    const expr = new ELam('x', new ELam('y', new EVar('x')))
    const type = infer(expr)
    expect(type).toEqual(
      new Scheme(
        [0, 1],
        new TArr(new TVar(0), new TArr(new TVar(1), new TVar(0))),
      ),
    )
  })
  it('infers function application', () => {
    // (\x x) 1 : Num
    const expr = new EApp(new ELam('x', new EVar('x')), new ENum(1))
    const type = infer(expr)
    expect(type).toEqual(TNum.toScheme())
  })
  it('infers let-expression function application', () => {
    // let id = \x x in id True
    const expr = new ELet(
      'id',
      new ELam('x', new EVar('x')),
      new EApp(new EVar('id'), new EBool(true)),
    )
    const type = infer(expr)
    expect(type).toEqual(TBool.toScheme())
  })
  it('accepts global context', () => {
    // [x: Num] x : Num
    const global = new Context()
    global.set('x', new Scheme([], TNum))
    const expr = new EVar('x')
    const type = infer(expr, global)
    expect(type).toEqual(TNum.toScheme())
  })
  it('infers partial application', () => {
    // [f: Num -> Num -> Num] f 1 : Num -> Num
    const global = new Context()
    global.set(
      'f',
      new Scheme([], new TArr(TNum, new TArr(TNum, TNum))),
    )
    const expr = new EApp(new EVar('f'), new ENum(1))
    const type = infer(expr, global)
    expect(type).toEqual(new TArr(TNum, TNum).toScheme())
  })
  it('partial application instantiates type', () => {
    // [f: forall a . a -> a -> a] f 1 : Num -> Num
    const global = new Context()
    global.set(
      'f',
      new Scheme(
        [0],
        new TArr(new TVar(0), new TArr(new TVar(0), new TVar(0))),
      ),
    )
    const expr = new EApp(new EVar('f'), new ENum(1))
    const type = infer(expr, global)
    expect(type).toEqual(new TArr(TNum, TNum).toScheme())
  })
  it('infers if-expressions', () => {
    const expr = new EIf(new EBool(true), new ENum(1), new ENum(2))
    const type = infer(expr)
    expect(type).toEqual(TNum.toScheme())
  })
  it('if-expressions throws if non-bool condition', () => {
    const expr = new EIf(new ENum(0), new ENum(1), new ENum(2))
    expect(() => infer(expr)).toThrowError(NonBoolCondition)
  })
  it('if-expressions throws on mismatch branch types', () => {
    const expr = new EIf(
      new EBool(true),
      new ENum(1),
      new EBool(true),
    )
    expect(() => infer(expr)).toThrowError(MismatchBranch)
  })
})
