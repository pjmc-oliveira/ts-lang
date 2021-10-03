export enum TokenType {
  // Operators
  LeftParen,
  RightParen,
  Equal,
  BackSlash,

  // Keywords
  Def,
  Let,
  In,
  If,
  Then,
  Else,

  // Numbers
  Var,
  Num,
  Bool,
}

export type Token =
  | { type: TokenType.LeftParen }
  | { type: TokenType.RightParen }
  | { type: TokenType.Equal }
  | { type: TokenType.BackSlash }
  | { type: TokenType.Def }
  | { type: TokenType.Let }
  | { type: TokenType.In }
  | { type: TokenType.If }
  | { type: TokenType.Then }
  | { type: TokenType.Else }
  | { type: TokenType.Var, name: string }
  | { type: TokenType.Num, value: number }
  | { type: TokenType.Bool, value: boolean }

export const Token = {
  // Operators
  LeftParen: { type: TokenType.LeftParen },
  RightParen: { type: TokenType.RightParen },
  Equal: { type: TokenType.Equal },
  BackSlash: { type: TokenType.BackSlash },

  // Keywords
  Def: { type: TokenType.Def },
  Let: { type: TokenType.Let },
  In: { type: TokenType.In },
  If: { type: TokenType.If },
  Then: { type: TokenType.Then },
  Else: { type: TokenType.Else },

  // Literals
  Var: (name: string) => ({ type: TokenType.Var, name } as const),
  Num: (value: number) => ({ type: TokenType.Num, value } as const),
  Bool: (value: boolean) => ({ type: TokenType.Bool, value } as const),
} as const

const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
const isDigit = (c: string) => c >= '0' && c <= '9'
const isAlphaNum = (c: string) => isAlpha(c) || isDigit(c)

const keywords: { [index: string]: Token } = {
  def: Token.Def,
  let: Token.Let,
  in: Token.In,
  if: Token.If,
  then: Token.Then,
  else: Token.Else,
} as const

export function tokenize(source: string): Token[] {
  let index = 0
  const tokens: Token[] = []
  while (index < source.length) {
    switch (source[index]) {
      case '(':
        tokens.push(Token.LeftParen)
        break

      case ')':
        tokens.push(Token.RightParen)
        break

      case '=':
        tokens.push(Token.Equal)
        break

      case '\\':
        tokens.push(Token.BackSlash)
        break

      case ' ':
      case '\t':
      case '\n':
        break
    
      default:
        // Keywords or Variables
        if (isAlpha(source[index])) {
          let letters = [source[index]]
          while (isAlphaNum(source[index + 1])) {
            index += 1
            letters.push(source[index])
          }
          let word = letters.join('')
          if (keywords.hasOwnProperty(word)) {
            tokens.push(keywords[word])
          } else {
            if (word === 'True')
              tokens.push(Token.Bool(true))
            else if (word === 'False')
              tokens.push(Token.Bool(false))
            else
              tokens.push(Token.Var(word))
          }

        // Number
        } else if (isDigit(source[index])) {
          let digits = [source[index]]
          while (isAlphaNum(source[index + 1])) {
            index += 1
            digits.push(source[index])
          }
          // fractional part
          if (source[index + 1] === '.' && isDigit(source[index + 2])) {
            digits.push(source[++index], source[++index])
              while (isAlphaNum(source[index + 1])) {
              index += 1
              digits.push(source[index])
            }
          }
          let number = parseFloat(digits.join(''))
          tokens.push(Token.Num(number))

        // Unexpected char
        } else {
          throw new Error(`[tokenize] Unexpected character '${source[index]}'`);
        }
    }
    index += 1
  }
  return tokens
}