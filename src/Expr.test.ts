import { Binding, ENum, Program } from './Expr'

describe('Program', () => {
  it('should be created with no bindings', () => {
    const program = new Program()
    expect(program.bindings).toEqual(new Map())
  })

  it('should be created with 1 binding', () => {
    const program = new Program([new Binding('main', new ENum(1))])
    const expected = new Map()
    expected.set('main', new ENum(1))
    expect(program.bindings).toEqual(expected)
  })

  it('should be created with multiple bindings', () => {
    const program = new Program([
      new Binding('foo', new ENum(1)),
      new Binding('bar', new ENum(2)),
    ])
    const expected = new Map()
    expected.set('foo', new ENum(1))
    expected.set('bar', new ENum(2))
    expect(program.bindings).toEqual(expected)
  })
})
