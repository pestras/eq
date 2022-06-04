// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class EqError extends Error { }
export class EqRefError extends Error { }
export class EqDivisionByZeroError extends Error { }
export class EqUnknownOperatorError extends Error { }

const mathConstants = ['PI', 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'SQRT1_2', 'SQRT12']
const fns: string[] = [
  'exp', 'expm1', 'log', 'log10', 'log2', 'ln', 'sin', 'sinh', 'asin', 'asinh', 'cos',
  'cosh', 'acos', 'acosh', 'tan', 'tanh', 'atan', 'atan2', 'atanh', 'trunc', 'floor',
  'ceil', 'round', 'sqrt', 'cbrt', 'abs', 'sign'
];

export class Eq {
  private static eqs = new Map<string, Eq>();

  private _eq = "";
  private parts: string[] = [];
  private refs: Record<`$${string}`, number> = {};
  private vars: Record<string, number> = {};

  static constanst: Record<`$${Uppercase<string>}`, number>;

  constructor(eq: string, name?: string) {
    this.init(eq);

    if (name)
        Eq.eqs.set(name, this);
  }

  static Get(name: string) {
    return Eq.eqs.get(name);
  } 

  get eq() { return this._eq }

  set eq(value: string) {
    this.init(value);
  }

  private init(eq: string) {
    this.validate(eq)
    this._eq = this.clean(eq);
    this.breakEq();
  }

  validate(eq: string) {
    let open = 0;
    let close = 0;

    for (let i = 0; i < eq.length; i++) {
      if (eq[i] === '(')
        open++;

      if (eq[i] === ')') {
        close++;

        if (close > open)
          throw new EqError(`extra close bracket found at column: ${i}`);
      }
    }
  }

  clean(eq: string) {
    eq = eq.replace(/\s/g, '');

    while (/([\-+])([\-+])/.test(eq))
      eq = eq.replace(/([\-+])([\-+])/g, (_, $1, $2) => $1 === $2 ? '+' : '-');

    return eq.replace(/([^_])([+\-*\/^%:])/g, (_, $1, $2) => `${$1} ${$2} `)
      .replace(/\s{2,}/g, " ")
      .replace(/(\d+)\s?(\$|\(|[a-zA-Z])/g, (_, $1, $2) => `${$1} * ${$2}`);
  }

  private breakEq() {
    let match: string | null
    let eq = `(${this._eq})`;

    this.parts = [];

    // deno-lint-ignore no-cond-assign
    while (match = /\([^(]+?\)/.exec(eq)?.[0] as string) {
      this.parts.push(match.slice(1, -1));
      eq = eq.replace(match, `$${this.parts.length - 1}`);
    }
  }

  private getValue(str: string): number {
    if (!isNaN(+str))
      return +str;

    if (mathConstants.includes(str))
      return Math[str as 'E'];

    if (this.vars[str] !== undefined)
      return this.vars[str];

    if (this.refs[str as '$1'])
      return this.refs[str as '$a'];

    if (Eq.eqs.has(str))
        return (Eq.eqs.get(str) as Eq).evaluate(this.vars);

    const [fname, arg] = str.split('$');

    if (fns.includes(fname))
      return Math[fname as 'abs'](this.getValue('$' + arg));

    throw new EqRefError(`'${fname}' is undefined`);
  }

  private basicMath(op: string, left: string, right: string) {
    if (op === '+')
      return this.getValue(left) + this.getValue(right);

    if (op === '-')
      return this.getValue(left) - this.getValue(right);

    if (op === '*')
      return this.getValue(left) * this.getValue(right);

    if (op === '/') {
      if (this.getValue(right) === 0)
        throw new EqDivisionByZeroError();

      return this.getValue(left) / this.getValue(right);
    }

    if (op === '%') {
      if (this.getValue(right) === 0)
        throw new EqDivisionByZeroError();

      return this.getValue(left) % this.getValue(right);
    }

    if (op === '^')
      return Math.pow(this.getValue(left), this.getValue(right));

    if (op === ':') {
      if (this.getValue(right) === 0)
        return 1;

      return Math.pow(this.getValue(left), 1 / this.getValue(right));
    }

    throw new EqUnknownOperatorError(`unknwon operator: ${op}`);
  }


  private evalPart(part: string) {
    part = part
      .replace(/\s?([$a-zA-Z][^\s]*)\s?/g, (_, $) => ` ${this.getValue($.trim())} `)
      .trim();

    let parts = part.split(' ');
    let index = parts.findIndex(char => char === '^' || char === ':');

    while (index > -1) {
      const tri = [parts[index - 1], parts[index], parts[index + 1]];

      part = part.replace(`${tri[0]} ${tri[1]} ${tri[2]}`, () => "" + this.basicMath(tri[1], tri[0], tri[2]));
      parts = part.split(' ');
      index = parts.findIndex(char => char === '^' || char === ':');
    }

    index = parts.findIndex(char => char === '*' || char === '/' || char === '%');
    while (index > -1) {
      const tri = [parts[index - 1], parts[index], parts[index + 1]];

      part = part.replace(`${tri[0]} ${tri[1]} ${tri[2]}`, () => "" + this.basicMath(tri[1], tri[0], tri[2]));
      parts = part.split(' ');
      index = parts.findIndex(char => char === '*' || char === '/' || char === '%');
    }

    index = parts.findIndex(char => char === '+' || char === '-');
    while (index > -1) {
      const tri = [parts[index - 1], parts[index], parts[index + 1]];

      if (tri[0] === undefined) {
        tri[0] = tri[1] === '-' ? "-1" : "1";
        tri[1] = '*';
        part = part.replace(`${parts[index]} ${tri[2]}`, () => "" + this.basicMath(tri[1], tri[0], tri[2]));
      } else {
        part = part.replace(`${tri[0]} ${tri[1]} ${tri[2]}`, () => "" + this.basicMath(tri[1], tri[0], tri[2]));
      }

      parts = part.split(' ');
      index = parts.findIndex(char => char === '+' || char === '-');
    }

    return +part;
  }

  evaluate(vars: Record<string, number> = {}) {
    this.vars = vars;

    for (const [i, part] of this.parts.entries())
      this.refs[`$${i}`] = this.evalPart(part);


    return this.refs[`$${this.parts.length - 1}`];
  }
}