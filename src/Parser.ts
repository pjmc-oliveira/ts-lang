import { Token, TokenType } from './Lexer'
import {
  EApp,
  Binding,
  EBool,
  EIf,
  ELam,
  ELet,
  EVar,
  ENum,
  Expr,
} from './Expr'

/**
 * Parsers tokens into an array of bindings
 * @param tokens The tokens
 * @returns The bindings
 */
export function parse(tokens: Token[]): Binding[] {
  const result = many(binding).parse({ tokens, index: 0 })
  if (!result.ok) throw new ParserError(result.error)
  return result.value
}

/**
 * Parsing errors
 */
class ParserError extends Error {}

/**
 * Parsing state
 */
type State = {
  tokens: Token[]
  index: number
}

/**
 * Parsing result
 */
type Result<A, E> =
  | ({ ok: true; value: A } & State)
  | { ok: false; error: E }

/**
 * A Parser parsers a sequence of tokens into either a value or an error
 */
class Parser<A, E = string> {
  #runParser: (_: State) => Result<A, E>
  constructor(runParser: (_: State) => Result<A, E>) {
    this.#runParser = runParser
  }
  parse(state: State): Result<A, E> {
    return this.#runParser(state)
  }
  static of<A, E>(value: A): Parser<A, E> {
    return new Parser(state => ({ ...state, ok: true, value }))
  }
  static fail<A, E>(error: E): Parser<A, E> {
    return new Parser(state => ({ ok: false, error }))
  }
  static lazy<A, E>(lazyParser: () => Parser<A, E>): Parser<A, E> {
    return new Parser(state => lazyParser().parse(state))
  }
  map<B>(func: (_: A) => B): Parser<B, E> {
    return new Parser(state => {
      const result = this.parse(state)
      if (!result.ok) return result
      const value = func(result.value)
      return { ...result, value }
    })
  }
  then<B>(func: (_: A) => Parser<B, E>): Parser<B, E> {
    return new Parser(state => {
      const result = this.parse(state)
      if (!result.ok) return result
      const parser = func(result.value)
      return parser.parse(result)
    })
  }
  or(that: Parser<A, E>): Parser<A, E> {
    return new Parser(state => {
      const result = this.parse(state)
      if (result.ok) return result
      return that.parse(state)
    })
  }
}

//
// Terminals and non-terminals
//

const token: Parser<Token> = new Parser(state => {
  if (state.index >= state.tokens.length)
    return err('Expected a token but got EOF')
  const value = state.tokens[state.index]
  const index = state.index + 1
  return { ...state, ok: true, index, value }
})

const identifier: Parser<string> = match(TokenType.Var).map(
  tk => (tk as any).name,
)

const expression: Parser<Expr> = Parser.lazy(() =>
  choice(
    [ifExpression, letExpression, lambda, application],
    'Expected expression',
  ),
)

const ifExpression: Parser<Expr> = sequence([
  match(TokenType.If),
  expression,
  expect(TokenType.Then, "Expected 'then' after expression"),
  expression,
  expect(TokenType.Else, "Expected 'else' after expression"),
  expression,
]).map(
  ([_if, cond, _then, con, _else, alt]) => new EIf(cond, con, alt),
)

const letExpression: Parser<Expr> = sequence([
  match(TokenType.Let),
  identifier,
  expect(TokenType.Equal, "Expected '=' after identifier"),
  expression,
  expect(TokenType.In, "Expected 'in' after expression"),
  expression,
]).map(
  ([_let, name, _eq, def, _in, body]) => new ELet(name, def, body),
)

const lambda: Parser<Expr> = sequence([
  match(TokenType.BackSlash),
  identifier,
  expression,
]).map(([_slash, param, body]) => new ELam(param, body))

const variable: Parser<Expr> = identifier.map(name => new EVar(name))
const number: Parser<Expr> = match(TokenType.Num).map(
  tk => new ENum((tk as any).value),
)
const boolean: Parser<Expr> = match(TokenType.Bool).map(
  tk => new EBool((tk as any).value),
)
const group: Parser<Expr> = sequence([
  match(TokenType.LeftParen),
  expression,
  expect(TokenType.RightParen, "Expected ')'"),
]).map(([_l, expr, _r]) => expr)

const atom: Parser<Expr> = choice(
  [variable, number, boolean, group],
  'Expected atom',
)

const application: Parser<Expr> = sequence([
  some(atom),
  optional(lambda),
]).map(([atoms, lam]) => {
  let expr = atoms[0]
  for (const atom of atoms.slice(1)) {
    expr = new EApp(expr, atom)
  }
  if (lam != null) {
    expr = new EApp(expr, lam)
  }
  return expr
})

const binding: Parser<Binding> = sequence([
  match(TokenType.Def),
  identifier,
  expect(TokenType.Equal, "Expected '=' after identifier"),
  expression,
]).map(([_def, name, _eq, body]) => new Binding(name, body))

//
// Helpers and combinators
//

function err<A, E>(error: E): Result<A, E> {
  return { ok: false as const, error }
}

function sequence(parsers: []): Parser<[]>
function sequence<A>(parsers: [Parser<A>]): Parser<[A]>
function sequence<A, B>(
  parsers: [Parser<A>, Parser<B>],
): Parser<[A, B]>
function sequence<A, B, C>(
  parsers: [Parser<A>, Parser<B>, Parser<C>],
): Parser<[A, B, C]>
function sequence<A, B, C, D>(
  parsers: [Parser<A>, Parser<B>, Parser<C>, Parser<D>],
): Parser<[A, B, C, D]>
function sequence<A, B, C, D, E>(
  parsers: [Parser<A>, Parser<B>, Parser<C>, Parser<D>, Parser<E>],
): Parser<[A, B, C, D, E]>
function sequence<A, B, C, D, E, F>(
  parsers: [
    Parser<A>,
    Parser<B>,
    Parser<C>,
    Parser<D>,
    Parser<E>,
    Parser<F>,
  ],
): Parser<[A, B, C, D, E, F]>
function sequence(parsers: Parser<unknown>[]): Parser<unknown[]> {
  return new Parser(state => {
    const value = []
    for (const parser of parsers) {
      const result = parser.parse(state)
      if (!result.ok) return result
      value.push(result.value)
      state = result
    }
    return { ...state, ok: true, value }
  })
}

function choice<A, E>(
  parsers: Parser<A, E>[],
  error: E,
): Parser<A, E> {
  if (parsers.length === 0)
    throw new Error('Cannot choose between 0 parsers.')
  return new Parser(state => {
    for (const parser of parsers) {
      const result = parser.parse(state)
      if (result.ok) return result
    }
    return { ok: false, error }
  })
}

function some<A>(parser: Parser<A>): Parser<A[]> {
  return new Parser(state => {
    let result = parser.parse(state)
    if (!result.ok) return result
    let value = []
    while (result.ok) {
      state = result
      value.push(result.value)
      result = parser.parse(state)
    }
    return { ...state, ok: true, value }
  })
}

function many<A>(parser: Parser<A>): Parser<A[]> {
  return some(parser).or(Parser.of([]))
}

function match(type: TokenType): Parser<Token> {
  return token.then(tk => {
    if (tk.type === type) return Parser.of(tk)
    return Parser.fail(
      `Expected token type ${type} but got ${tk.type}`,
    )
  })
}

function expect(type: TokenType, message: string): Parser<Token> {
  return token.then(tk => {
    if (tk.type === type) return Parser.of(tk)
    return Parser.fail(message)
  })
}

function optional<A>(parser: Parser<A>): Parser<A | null> {
  return new Parser(state => {
    const result = parser.parse(state)
    if (result.ok) return result
    return { ...state, ok: true, value: null }
  })
}
