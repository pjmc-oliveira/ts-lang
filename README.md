# Unnamed Language

This is a very simple unnamed programming language. It is based off of simply typed lambda calculus. It is interpreted and uses Hindley-Milner type inference

This was created as a learning exercise, to implement a programming language in TypeScript.

## Setting up

`git clone` the project and run `npm install`.

## Usage

There is no command-line interface currently. To run a program you must import `run` from `Main.ts` and call it with the source code. There is also not predefined standard library, but you can optionally provide the `run` function with an environment of values (including mapping to native functions) and a typing context.

## Example program

```
def local =
  let f = \x x
  in f 1

def choice = \b
  if b then
    1
  else
    2

def main = True
```

Note: Programs are type checked and interpreted top-to-bottom

## Grammar

```
program := binding*

binding := 'def' ID '=' expression

# NOTE: function application is left-associative
# e.g. f x y == (f x) y
expression :=
  | 'if' expression 'then' expression 'else' expression
  | 'let' ID '=' expression 'in' expression
  | '\' ID expression
  | atom+ [ '\' ID expression ]

atom :=
  | ID
  | Number
  | Boolean
  | '(' expression ')'

ID      := [a-zA-Z][a-zA-Z0-9]*
Number  := [0-9]+ ( '.' [0-9]+ )?
Boolean := 'True' | 'False'
```

Note: Source code comments are not currently supported
