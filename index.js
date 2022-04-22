"use strict";
// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eq = exports.EqUnknownOperatorError = exports.EqDivisionByZeroError = exports.EqRefError = exports.EqError = void 0;
class EqError extends Error {
}
exports.EqError = EqError;
class EqRefError extends Error {
}
exports.EqRefError = EqRefError;
class EqDivisionByZeroError extends Error {
}
exports.EqDivisionByZeroError = EqDivisionByZeroError;
class EqUnknownOperatorError extends Error {
}
exports.EqUnknownOperatorError = EqUnknownOperatorError;
const mathConstants = ['PI', 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'SQRT1_2', 'SQRT12'];
const fns = [
    'exp', 'expm1', 'log', 'log10', 'log2', 'ln', 'sin', 'sinh', 'asin', 'asinh', 'cos',
    'cosh', 'acos', 'acosh', 'tan', 'tanh', 'atan', 'atan2', 'atanh', 'trunc', 'floor',
    'ceil', 'round', 'sqrt', 'cbrt', 'abs', 'sign'
];
class Eq {
    constructor(eq, name) {
        this._eq = "";
        this.parts = [];
        this.refs = {};
        this.vars = {};
        this.init(eq);
        if (!!name)
            Eq.eqs.set(name, this);
    }
    static Get(name) {
        return Eq.eqs.get(name);
    }
    get eq() { return this._eq; }
    set eq(value) {
        this.init(value);
    }
    init(eq) {
        this.validate(eq);
        this._eq = this.clean(eq);
        this.breakEq();
    }
    validate(eq) {
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
    clean(eq) {
        eq = eq.replace(/\s/g, '');
        while (/([\-+])([\-+])/.test(eq))
            eq = eq.replace(/([\-+])([\-+])/g, (_, $1, $2) => $1 === $2 ? '+' : '-');
        return eq.replace(/([^_])([+\-*\/^%:])/g, (_, $1, $2) => `${$1} ${$2} `)
            .replace(/\s{2,}/g, " ")
            .replace(/(\d+)\s?(\$|\(|[a-zA-Z])/g, (_, $1, $2) => `${$1} * ${$2}`);
    }
    breakEq() {
        var _a;
        let match;
        let eq = `(${this._eq})`;
        this.parts = [];
        while (match = (_a = /\([^(]+?\)/.exec(eq)) === null || _a === void 0 ? void 0 : _a[0]) {
            this.parts.push(match.slice(1, -1));
            eq = eq.replace(match, `$${this.parts.length - 1}`);
        }
    }
    getValue(str) {
        if (!isNaN(+str))
            return +str;
        if (mathConstants.includes(str))
            return Math[str];
        if (this.vars[str] !== undefined)
            return this.vars[str];
        if (this.refs[str])
            return this.refs[str];
        if (Eq.eqs.has(str))
            return Eq.eqs.get(str).evaluate(this.vars);
        const [fname, arg] = str.split('$');
        if (fns.includes(fname))
            return Math[fname](this.getValue('$' + arg));
        throw new EqRefError(`'${fname}' is undefined`);
    }
    basicMath(op, left, right) {
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
    evalPart(part, i) {
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
            }
            else {
                part = part.replace(`${tri[0]} ${tri[1]} ${tri[2]}`, () => "" + this.basicMath(tri[1], tri[0], tri[2]));
            }
            parts = part.split(' ');
            index = parts.findIndex(char => char === '+' || char === '-');
        }
        return +part;
    }
    evaluate(vars = {}) {
        this.vars = vars;
        for (const [i, part] of this.parts.entries())
            this.refs[`$${i}`] = this.evalPart(part, i);
        return this.refs[`$${this.parts.length - 1}`];
    }
}
exports.Eq = Eq;
Eq.eqs = new Map();
