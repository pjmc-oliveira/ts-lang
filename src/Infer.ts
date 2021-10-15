import {
  EApp,
  EBool,
  EIf,
  ELam,
  ELet,
  ENum,
  EVar,
  Expr,
  ExprVisitor,
} from './Expr'

/**
 * Infers the type scheme of an expression
 * @param expr The expression
 * @param context The typing context
 * @returns The type scheme
 */
export function infer(expr: Expr, context?: Context): Scheme {
  TVar.count = 0 // FIXME: Find a better solution
  const [type, subst] = Inferrer.run(expr, context)
  return type.applyS(subst).toScheme().compact()
}

/**
 * The type inference engine
 */
class Inferrer implements ExprVisitor<[Type, Subst]> {
  #ctx: Context
  constructor(ctx: Context) {
    this.#ctx = ctx
  }
  static run(
    expr: Expr,
    ctx: Context = new Context(),
  ): [Type, Subst] {
    const inferrer = new Inferrer(ctx)
    return expr.accept(inferrer)
  }
  var(expr: EVar): [Type, Subst] {
    const scheme = this.#ctx.get(expr.name)
    if (scheme == null)
      throw new UnboundVar(`unbound variable '${expr.name}'`)
    // TODO: Why get subst?
    const [type, subst] = scheme.instantiate()
    return [type, Subst.empty()]
  }
  num(expr: ENum): [Type, Subst] {
    return [TNum, Subst.empty()]
  }
  bool(expr: EBool): [Type, Subst] {
    return [TBool, Subst.empty()]
  }
  if(expr: EIf): [Type, Subst] {
    // FIXME: Should do something with the new substitutions...
    const [tCond, subst1] = Inferrer.run(expr.condition, this.#ctx)
    if (tCond !== TBool)
      throw new NonBoolCondition(`If condition cannot be: ${tCond}`)
    const [tCon, subst2] = Inferrer.run(expr.consequence, this.#ctx)
    const [tAlt, subst3] = Inferrer.run(expr.alternative, this.#ctx)
    if (tCon !== tAlt)
      throw new MismatchBranch('If branches must match types')
    return [tCon, Subst.empty()]
  }
  let(expr: ELet): [Type, Subst] {
    const [tDef, subst1] = Inferrer.run(expr.definition, this.#ctx)
    const ctx1 = this.#ctx.remove(expr.name)
    const scheme = ctx1.applyS(subst1).generalize(tDef)
    const ctx2 = ctx1.insert(expr.name, scheme)
    const [tBody, subst2] = Inferrer.run(
      expr.body,
      ctx2.applyS(subst1),
    )
    return [tBody, subst1.compose(subst2)]
  }
  lambda(expr: ELam): [Type, Subst] {
    const tVar = TVar.fresh()
    const ctx = this.#ctx.remove(expr.param)
    const ctx2 = ctx.union(
      new Context([[expr.param, new Scheme([], tVar)]]),
    )
    const [tBody, subst] = Inferrer.run(expr.body, ctx2)
    const tArr = new TArr(tVar.applyS(subst), tBody)
    return [tArr, subst]
  }
  apply(expr: EApp): [Type, Subst] {
    const tResult = TVar.fresh()
    const [tFunc, subst1] = Inferrer.run(expr.func, this.#ctx)
    const [tArg, subst2] = Inferrer.run(
      expr.argument,
      this.#ctx.applyS(subst1),
    )
    const subst3 = tFunc.applyS(subst2).unify(new TArr(tArg, tResult))
    return [
      tResult.applyS(subst3),
      subst3.compose(subst2).compose(subst1),
    ]
  }
}

// Utility function to find the set difference of 2 sets
// returns the first set minus elements of the second set
function setDiff<A>(first: Set<A>, second: Set<A>): Set<A> {
  return new Set([...first].filter(x => !second.has(x)))
}

export class InferError extends Error {}
export class CannotUnify extends InferError {}
export class InfiniteType extends InferError {}
export class UnboundVar extends InferError {}
export class MismatchBranch extends InferError {}
export class NonBoolCondition extends InferError {}
const doesNotUnify = (first: Type, second: Type) => {
  throw new CannotUnify(`UnificationError: ${first} vs. ${second}`)
}

/**
 * Represents a substitution from bound variables to types
 */
class Subst extends Map<TVarId, Type> {
  static empty(): Subst {
    return new Subst()
  }
  compose(that: Subst): Subst {
    // TODO: Double check this logic
    const s1 = new Subst()
    for (const [index, type] of that.entries()) {
      s1.set(index, type.applyS(this))
    }
    for (const [index, type] of this.entries()) {
      if (!s1.has(index)) s1.set(index, type)
    }
    return s1
  }
}

/**
 * Stores the type context, mapping variable names to type schemes
 */
export class Context
  extends Map<string, Scheme>
  implements Types<Context>
{
  get freeVars(): Set<TVarId> {
    // TODO: Make less hacky
    const vars: Set<TVarId> = new Set()
    for (const type of this.values()) {
      for (const freeVar of type.freeVars) {
        vars.add(freeVar)
      }
    }
    return vars
  }
  applyS(subst: Subst): Context {
    const ctx = new Context()
    for (const [index, type] of this.entries()) {
      ctx.set(index, type.applyS(subst))
    }
    return ctx
  }
  remove(name: string): Context {
    const ctx = new Context(this.entries())
    ctx.delete(name)
    return ctx
  }
  generalize(type: Type): Scheme {
    const vars = setDiff(type.freeVars, this.freeVars)
    return new Scheme([...vars], type)
  }
  union(that: Context): Context {
    const ctx = new Context(this.entries())
    for (const [name, scheme] of that.entries()) {
      if (!ctx.has(name)) ctx.set(name, scheme)
    }
    return ctx
  }
  insert(name: string, scheme: Scheme): Context {
    const ctx = new Context(this.entries())
    ctx.set(name, scheme)
    return ctx
  }
}

// Types
interface Types<T> {
  freeVars: Set<TVarId>
  applyS(subst: Subst): T
}

type TypeAlg<A> = {
  var(type: TVar, index: TVarId): A
  con(type: TCon, name: string): A
  arr(type: TArr, from: Type, to: Type): A
}

export abstract class Type implements Types<Type> {
  abstract readonly freeVars: Set<TVarId>
  abstract applyS(subst: Subst): Type
  abstract caseOf<A>(algebra: TypeAlg<A>): A
  bind(index: TVarId): Subst {
    if (this.freeVars.has(index))
      throw new InfiniteType(`${index} occurs in ${this.toString()}`)
    return new Subst([[index, this]])
  }
  unify(type: Type): Subst {
    return type.caseOf({
      var: (that: TVar, index: TVarId) => this.bind(that.index),
      arr: (that: TArr, from: Type, to: Type) =>
        doesNotUnify(this, that),
      con: (that: TCon, name: string) => doesNotUnify(this, that),
    })
  }
  toScheme(): Scheme {
    return new Scheme([...this.freeVars], this)
  }
}

type TVarId = number

export class TVar extends Type {
  static count = 0
  static fresh(): TVar {
    return new TVar(TVar.count++)
  }
  constructor(public index: TVarId) {
    super()
  }
  get freeVars() {
    return new Set([this.index])
  }
  applyS(subst: Subst): Type {
    const type = subst.get(this.index)
    return type != null ? type : this
  }
  caseOf<A>(algebra: TypeAlg<A>): A {
    return algebra.var(this, this.index)
  }
  bind(index: TVarId): Subst {
    if (this.index === index) return Subst.empty()
    return super.bind(index)
  }
  unify(that: Type): Subst {
    return that.bind(this.index)
  }
}
export class TCon extends Type {
  constructor(public name: string) {
    super()
  }
  get freeVars() {
    return new Set([])
  }
  applyS(subst: Subst) {
    return this
  }
  caseOf<A>(algebra: TypeAlg<A>): A {
    return algebra.con(this, this.name)
  }
  unify(type: Type): Subst {
    return type.caseOf({
      con: (that: TCon, name: string) =>
        this.name === that.name
          ? Subst.empty()
          : doesNotUnify(this, that),
      var: (that: TVar, index: TVarId) => super.unify(that),
      arr: (that: TArr, from: Type, to: Type) => super.unify(that),
    })
  }
}
export class TArr extends Type {
  constructor(public from: Type, public to: Type) {
    super()
  }
  get freeVars() {
    return new Set([...this.from.freeVars, ...this.to.freeVars])
  }
  applyS(subst: Subst) {
    return new TArr(this.from.applyS(subst), this.to.applyS(subst))
  }
  unify(type: Type): Subst {
    return type.caseOf({
      arr: (that: TArr, from: Type, to: Type) => {
        const s1 = this.from.unify(that.from)
        const s2 = this.to.applyS(s1).unify(that.to.applyS(s1))
        return s1.compose(s2)
      },
      var: (that: TVar, index: TVarId) => super.unify(that),
      con: (that: TCon, name: string) => super.unify(that),
    })
  }
  caseOf<A>(algebra: TypeAlg<A>): A {
    return algebra.arr(this, this.from, this.to)
  }
}

export class Scheme implements Types<Scheme> {
  constructor(public vars: TVarId[], public type: Type) {}
  get freeVars() {
    return setDiff(this.type.freeVars, new Set(this.vars))
  }
  applyS(subst: Subst): Scheme {
    const subst2: Subst = new Subst()
    // don't apply substitutions bound by forall
    for (const [index, type] of subst.entries()) {
      if (!this.vars.includes(index)) subst2.set(index, type)
    }
    return new Scheme(this.vars, this.type.applyS(subst2))
  }
  instantiate(): [Type, Subst] {
    const entries = this.vars.map(tId => [tId, TVar.fresh()] as const)
    const subst = new Subst(entries)
    const type = this.type.applyS(subst)
    return [type, subst]
  }
  compact(): Scheme {
    const olds = [...this.vars].sort()
    const news = []
    let idx = 0
    let type = this.type
    for (const fv of olds) {
      if (fv > idx) {
        news.push(idx)
        const subst = new Subst([[fv, new TVar(idx)]])
        type = type.applyS(subst)
      } else {
        news.push(fv)
      }
      idx++
    }
    return new Scheme(news, type)
  }
}

export const TNum = new TCon('Num')
export const TBool = new TCon('Bool')
