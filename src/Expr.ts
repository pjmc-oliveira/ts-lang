export interface Expr {}

export class Binding {
  name: string
  expr: Expr
  constructor(name : string, expr: Expr) {
    this.name = name
    this.expr = expr
  }
}

export class Var implements Expr {
  name: string
  constructor(name: string) {
    this.name = name
  }
}

export class Num implements Expr {
  value: number
  constructor(value: number) {
    this.value = value
  }
}

export class Bool implements Expr {
  value: boolean
  constructor(value: boolean) {
    this.value = value
  }
}

export class If implements Expr {
  condition: Expr
  consequence: Expr
  alternative: Expr
  constructor(condition: Expr, consequence: Expr, alternative: Expr) {
    this.condition = condition
    this.consequence = consequence
    this.alternative = alternative
  }
}

export class Let implements Expr {
  name: string
  value: Expr
  body: Expr
  constructor(name: string, value: Expr, body: Expr) {
    this.name = name
    this.value = value
    this.body = body
  }
}

export class Lambda implements Expr {
  param: string
  body: Expr
  constructor(param: string, body: Expr) {
    this.param = param
    this.body = body
  }
}

export class Apply implements Expr {
  func: Expr
  argument: Expr
  constructor(func: Expr, argument: Expr) {
    this.func = func
    this.argument = argument
  }
}