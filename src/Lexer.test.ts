import { tokenize, Token } from './Lexer'

describe('Lexer', () => {
  it('tokenizes single tokens', () => {
    let result = tokenize('()=\\')
    expect(result).toEqual([
      Token.LeftParen,
      Token.RightParen,
      Token.Equal,
      Token.BackSlash,
    ])
  })

  it('ignores whitespace', () => {
    let result = tokenize(' (\t)\n= ')
    expect(result).toEqual([
      Token.LeftParen,
      Token.RightParen,
      Token.Equal,
    ])
  })

  it('tokenizes keywords', () => {
    let result = tokenize('def let in if then else')
    expect(result).toEqual([
      Token.Def,
      Token.Let,
      Token.In,
      Token.If,
      Token.Then,
      Token.Else,
    ])
  })

  it('tokenizes variables', () => {
    let result = tokenize('deflet aVar')
    expect(result).toEqual([Token.Var('deflet'), Token.Var('aVar')])
  })

  it('tokenizes integers', () => {
    let result = tokenize('123 456')
    expect(result).toEqual([Token.Num(123), Token.Num(456)])
  })

  it('tokenizes floats', () => {
    let result = tokenize('123.45 456.5')
    expect(result).toEqual([Token.Num(123.45), Token.Num(456.5)])
  })

  it('tokenizes booleans', () => {
    let result = tokenize('True False')
    expect(result).toEqual([Token.Bool(true), Token.Bool(false)])
  })
})
