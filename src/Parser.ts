import { Token, TokenType } from './Lexer'
import {
  Application,
  Binding,
  Bool,
  If,
  Lambda,
  Let,
  Var,
  Num,
  Expr,
} from './Expr'

class ParserError extends Error {}

/**
 * Describes a program Parser
 */
class Parser {
  #tokens: Token[]
  #index: number = 0
  get #current() {
    return this.#tokens[this.#index]
  }
  constructor(tokens: Token[]) {
    this.#tokens = tokens
  }

  run(): Binding[] {
    const bindings: Binding[] = []
    while (this.#current) {
      switch (this.#current.type) {
        case Token.Def.type:
          this.#advance()
          bindings.push(this.#binding())
          break

        default:
          throw new ParserError(
            `[Parser.run] Unexpected token: ${JSON.stringify(
              this.#current,
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
    switch (this.#current.type) {
      case TokenType.If:
        this.#advance()
        const condition = this.#expression()
        this.#expect(TokenType.Then)
        const consequence = this.#expression()
        this.#expect(TokenType.Else)
        const alternative = this.#expression()
        return new If(condition, consequence, alternative)

      case TokenType.Let:
        this.#advance()
        const name = this.#identifier()
        this.#expect(TokenType.Equal)
        const value = this.#expression()
        this.#expect(TokenType.In)
        const letBody = this.#expression()
        return new Let(name, value, letBody)

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
    return new Lambda(param, lamBody)
  }

  #application(): Expr {
    // FIXME: There must be a better way than always throwing exceptions for this...
    let expr = this.#atom()
    while (this.#current != null) {
      const index = this.#index
      try {
        expr = new Application(expr, this.#atom())
      } catch (error) {
        if (error instanceof ParserError) {
          this.#index = index
          break
        }
        throw error
      }
    }
    if (
      this.#current != null &&
      this.#current.type === TokenType.BackSlash
    ) {
      expr = new Application(expr, this.#lambda())
    }
    return expr
  }

  #atom(): Expr {
    let expr
    switch (this.#current.type) {
      case TokenType.Var:
        expr = new Var(this.#current.name)
        this.#advance()
        return expr

      case TokenType.Num:
        expr = new Num(this.#current.value)
        this.#advance()
        return expr

      case TokenType.Bool:
        expr = new Bool(this.#current.value)
        this.#advance()
        return expr

      case TokenType.LeftParen:
        this.#advance()
        expr = this.#expression()
        this.#expect(TokenType.RightParen)
        return expr

      default:
        throw new ParserError(
          `[Parser.atom] Expected atom but got: ${JSON.stringify(
            this.#current,
          )}`,
        )
    }
  }

  #identifier(): string {
    if (this.#current.type === TokenType.Var) {
      const name = this.#current.name
      this.#advance()
      return name
    } else {
      throw new ParserError(
        `[Parser.identifier] Expected identifier but got: ${JSON.stringify(
          this.#current,
        )}`,
      )
    }
  }

  // Utils
  #expect(type: TokenType) {
    if (this.#current.type === type) {
      this.#advance()
    } else {
      throw new ParserError(
        `[Parser.expect] Expected ${type} but got: ${this.#current}`,
      )
    }
  }

  #advance(): Token {
    const token = this.#current
    this.#index += 1
    return token
  }
}

export function parse(tokens: Token[]): Binding[] {
  const parser = new Parser(tokens)
  return parser.run()
}
