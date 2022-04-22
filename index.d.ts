export declare class EqError extends Error {
}
export declare class EqRefError extends Error {
}
export declare class EqDivisionByZeroError extends Error {
}
export declare class EqUnknownOperatorError extends Error {
}
export declare class Eq {
    private static eqs;
    private _eq;
    private parts;
    private refs;
    private vars;
    static constanst: Record<`$${Uppercase<string>}`, number>;
    constructor(eq: string, name?: string);
    static Get(name: string): Eq | undefined;
    get eq(): string;
    set eq(value: string);
    private init;
    validate(eq: string): void;
    clean(eq: string): string;
    private breakEq;
    private getValue;
    private basicMath;
    private evalPart;
    evaluate(vars?: Record<string, number>): number;
}
