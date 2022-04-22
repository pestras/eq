# Eq

Evaluates Math equations with variables

## install

```
$ npm i @pestras/eq
```

## Get Started

```ts
import { eq } from '@pestras/eq';

const eq = new Eq("2x^2(3 + cos(y))"); // auto parse to "2 * x ^ 3 * (3 + cos(y))"
const result = eq.evaluate({ x: 3, y: 30 });

console.log(result);  // 56.776526097976515 
```

## Multi Equations

We can define multi equations and reference each other.

```ts
// Adding name to the second param.
// names must not preceeded by number
new Eq("2x^2(3 + cos(y))", "myEq"); // auto parse to "2 * x ^ 3 * (3 + cos(y))"

const eq = new Eq("log(x) / (myEq + 6)");
const result = eq.evaluate({ x 3, y: 30 });

console.log(result);  // 0.017500367684466715
```

We can fetch saved equation any where as follows:

```ts
const myEq = Eq.Get('myEq');
```

## Errors

**Eq** may produce four types of errors:

- **EqError**: General error.
- **EqRefError**: When unknown variable or math function found.
- **EqDivisionByZeroError**: Thrown when division by zero was found.
- **EqUnknownOperatorError**: Unknown operator found.

```ts
try {
  new Eq("x + y").evaluate({ x: 1 });
} catch (e) {
  console.log(e.name) // EqRefError
  console.log(e.message) // 'y' is undefined
}
```

## Supported Operators

- Add: +
- Subtract: -
- Multiply: *
- Division: /
- Remainder: %
- Power: ^
- Nth Root: *colon* : as ``` "27 : 3" ``` will produce **3**

## Supported Math Functions

Almost all javascript Math lib methods.

- exp
- expm1
- log
- log10
- log2
- ln
- sin
- sinh
- asin
- asinh
- cos
- cosh
- acos
- acosh
- tan
- tanh
- atan
- atan2
- atanh
- trunc
- floor
- ceil
- round
- sqrt
- cbrt
- abs
- sign

## Supported Math Constants

All javascript Math lib constants.

- PI
- E
- LN10
- LN2
- LOG10E
- LOG2E
- SQRT1_2
- SQRT12

Thank you