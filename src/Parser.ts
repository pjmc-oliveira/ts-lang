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

class ParserError extends Error {}

class Tokens {
  #tokens: Token[]
  index: number = 0
  constructor(tokens: Token[]) {
    this.#tokens = tokens
  }

  get current() {
    return this.#tokens[this.index]
  }

  advance(): Token {
    const token = this.current
    this.index += 1
    return token
  }
}

/**
 * Describes a program Parser
 */
class BindingParser {
  #tokens: Tokens
  constructor(tokens: Tokens) {
    this.#tokens = tokens
  }

  run(): Binding[] {
    const bindings: Binding[] = []
    while (this.#tokens.current) {
      switch (this.#tokens.current.type) {
        case Token.Def.type:
          this.#tokens.advance()
          bindings.push(this.#binding())
          break

        default:
          throw new ParserError(
            `[BindingParser.run] Unexpected token: ${JSON.stringify(
              this.#tokens.current,
            )}`,
          )
      }
    }
    return bindings
  }

  #binding(): Binding {
    const name = this.#identifier()
    this.#expect(TokenType.Equal)
    const body = this.#expression()
    return new Binding(name, body)
  }

  #expression(): Expr {
    const expressionP = new ExprParser(this.#tokens)
    return expressionP.run()
  }

  #identifier(): string {
    if (this.#tokens.current.type === TokenType.Var) {
      const name = this.#tokens.current.name
      this.#tokens.advance()
      return name
    } else {
      throw new ParserError(
        `[BindingParser.identifier] Expected identifier but got: ${JSON.stringify(
          this.#tokens.current,
        )}`,
      )
    }
  }

  // Utils
  #expect(type: TokenType) {
    if (this.#tokens.current.type === type) {
      this.#tokens.advance()
    } else {
      throw new ParserError(
        `[BindingParser.expect] Expected ${type} but got: ${
          this.#tokens.current
        }`,
      )
    }
  }
}

class ExprParser {
  #tokens: Tokens
  constructor(tokens: Tokens) {
    this.#tokens = tokens
  }

  run(): Expr {
    return this.#expression()
  }

  #expression(): Expr {
    switch (this.#tokens.current.type) {
      case TokenType.If:
        this.#tokens.advance()
        const condition = this.#expression()
        this.#expect(TokenType.Then)
        const consequence = this.#expression()
        this.#expect(TokenType.Else)
        const alternative = this.#expression()
        return new EIf(condition, consequence, alternative)

      case TokenType.Let:
        this.#tokens.advance()
        const name = this.#identifier()
        this.#expect(TokenType.Equal)
        const value = this.#expression()
        this.#expect(TokenType.In)
        const letBody = this.#expression()
        return new ELet(name, value, letBody)

      case TokenType.BackSlash:
        return this.#lambda()

      default:
        return this.#application()
    }
  }

  #lambda(): Expr {
    this.#expect(TokenType.BackSlash)
    const param = this.#identifier()
    const lamBody = this.#expression()
    return new ELam(param, lamBody)
  }

  #application(): Expr {
    // FIXME: There must be a better way than always throwing exceptions for this...
    let expr = this.#atom()
    while (this.#tokens.current != null) {
      const index = this.#tokens.index
      try {
        expr = new EApp(expr, this.#atom())
      } catch (error) {
        if (error instanceof ParserError) {
          this.#tokens.index = index
          break
        }
        throw error
      }
    }
    if (
      this.#tokens.current != null &&
      this.#tokens.current.type === TokenType.BackSlash
    ) {
      expr = new EApp(expr, this.#lambda())
    }
    return expr
  }

  #atom(): Expr {
    let expr
    switch (this.#tokens.current.type) {
      case TokenType.Var:
        expr = new EVar(this.#tokens.current.name)
        this.#tokens.advance()
        return expr

      case TokenType.Num:
        expr = new ENum(this.#tokens.current.value)
        this.#tokens.advance()
        return expr

      case TokenType.Bool:
        expr = new EBool(this.#tokens.current.value)
        this.#tokens.advance()
        return expr

      case TokenType.LeftParen:
        this.#tokens.advance()
        expr = this.#expression()
        this.#expect(TokenType.RightParen)
        return expr

      default:
        throw new ParserError(
          `[ExprParser.atom] Expected atom but got: ${JSON.stringify(
            this.#tokens.current,
          )}`,
        )
    }
  }

  #identifier(): string {
    if (this.#tokens.current.type === TokenType.Var) {
      const name = this.#tokens.current.name
      this.#tokens.advance()
      return name
    } else {
      throw new ParserError(
        `[ExprParser.identifier] Expected identifier but got: ${JSON.stringify(
          this.#tokens.current,
        )}`,
      )
    }
  }

  // Utils
  #expect(type: TokenType) {
    if (this.#tokens.current.type === type) {
      this.#tokens.advance()
    } else {
      throw new ParserError(
        `[ExprParser.expect] Expected ${type} but got: ${
          this.#tokens.current
        }`,
      )
    }
  }
}

export function parse(tokens: Token[]): Binding[] {
  const parser = new BindingParser(new Tokens(tokens))
  return parser.run()
}
