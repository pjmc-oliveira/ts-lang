export class Binding {
  name: string
  expr: Expr
  constructor(name: string, expr: Expr) {
    this.name = name
    this.expr = expr
  }
}

export interface Expr {
  accept<A>(visitor: ExprVisitor<A>): A
}

export interface ExprVisitor<A> {
  var(_: EVar): A
  num(_: ENum): A
  bool(_: EBool): A
  if(_: EIf): A
  let(_: ELet): A
  lambda(_: ELam): A
  apply(_: EApp): A
}

export class EVar implements Expr {
  name: string
  constructor(name: string) {
    this.name = name
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.var(this)
  }
}

export class ENum implements Expr {
  value: number
  constructor(value: number) {
    this.value = value
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.num(this)
  }
}

export class EBool implements Expr {
  value: boolean
  constructor(value: boolean) {
    this.value = value
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.bool(this)
  }
}

export class EIf implements Expr {
  condition: Expr
  consequence: Expr
  alternative: Expr
  constructor(condition: Expr, consequence: Expr, alternative: Expr) {
    this.condition = condition
    this.consequence = consequence
    this.alternative = alternative
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.if(this)
  }
}

export class ELet implements Expr {
  name: string
  value: Expr
  body: Expr
  constructor(name: string, value: Expr, body: Expr) {
    this.name = name
    this.value = value
    this.body = body
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.let(this)
  }
}

export class ELam implements Expr {
  param: string
  body: Expr
  constructor(param: string, body: Expr) {
    this.param = param
    this.body = body
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.lambda(this)
  }
}

export class EApp implements Expr {
  func: Expr
  argument: Expr
  constructor(func: Expr, argument: Expr) {
    this.func = func
    this.argument = argument
  }
  accept<A>(visitor: ExprVisitor<A>): A {
    return visitor.apply(this)
  }
}
