import { virtualCalc } from "../index.user"

type SymbolicExpressionInput<T> = SymbolicExpression<T> | string | number

abstract class SymbolicExpression<T> {
	abstract toString(): string
	abstract getValue(): T
	abstract requiresParenthesis: boolean
}

export class SymbolicVariable extends SymbolicExpression<number> {
	name: string
	requiresParenthesis = false;
	constructor(name: string) {
		super()
		this.name = name
	}

	toString() {
		return this.name
	}

	getValue() {
		return virtualCalc.variables[this.name].value
	}
}

export class Constant extends SymbolicExpression<number> {
	value: number
	requiresParenthesis = true;
	constructor(value: number) {
		super()
		this.value = value
	}

	toString() {
		return this.value.toString()
	}

	getValue() {
		return this.value
	}
}

function TransformInputExpression<T>(expression: SymbolicExpressionInput<T>) {
	if (typeof expression === "number") {
		return new Constant(expression)
	} else if (typeof expression === "string") {
		return new SymbolicVariable(expression)
	}
	return expression
}

export class Add extends SymbolicExpression<number> {
	subexpressions: SymbolicExpression<number>[]
	requiresParenthesis = true;
	constructor(...subexpressions: SymbolicExpressionInput<number>[]) {
		super()
		this.subexpressions = subexpressions.map(subexpression => TransformInputExpression(subexpression))
	}

	toString() {
		return this.subexpressions.map(subexpression => subexpression.toString()).join("+")
	}

	getValue() {
		return this.subexpressions
			.map(subexpression => subexpression.getValue())
			.reduce((x, y) => x + y)
	}
}

export class Multiply extends SymbolicExpression<number> {
	subexpressions: SymbolicExpression<number>[]
	requiresParenthesis = false;
	constructor(...subexpressions: SymbolicExpressionInput<number>[]) {
		super()
		this.subexpressions = subexpressions.map(subexpression => TransformInputExpression(subexpression))
	}

	toString() {
		return this.subexpressions.map(subexpression => {
			if (subexpression.requiresParenthesis) {
				return `\\left(${subexpression.toString()}\\right)`
			} else {
				return subexpression.toString()
			}
		}).join("")
	}

	getValue() {
		return this.subexpressions
			.map(subexpression => subexpression.getValue())
			.reduce((x, y) => x * y)
	}
}

export class Subtract extends SymbolicExpression<number> {
	subexpressions: SymbolicExpression<number>[]
	requiresParenthesis = true;
	constructor(...subexpressions: SymbolicExpressionInput<number>[]) {
		super()
		this.subexpressions = subexpressions.map(subexpression => TransformInputExpression(subexpression))
	}

	toString() {
		return this.subexpressions.map(subexpression => subexpression.toString()).join("-")
	}

	getValue() {
		return this.subexpressions
			.map(subexpression => subexpression.getValue())
			.reduce((x, y) => x - y)
	}
}

export class Point extends SymbolicExpression<number[]> {
	subexpressions: SymbolicExpression<number>[]
	requiresParenthesis = false;
	constructor(...subexpressions: SymbolicExpressionInput<number>[]) {
		super()
		this.subexpressions = subexpressions.map(subexpression => TransformInputExpression(subexpression))
	}

	toString() {
		return `\\left(${this.subexpressions.map(subexpression => subexpression.toString()).join(",")}\\right)`
	}

	getValue() {
		return this.subexpressions.map(subexpression => subexpression.getValue())
	}
}

export class Operator extends SymbolicExpression<number> {
	operatorName: string
	subexpressions: SymbolicExpression<number>[]
	requiresParenthesis = false;
	valueFunction: (...subexpression: number[]) => number
	constructor(operatorName: string, valueFunction: (...subexpression: number[]) => number, ...subexpressions: SymbolicExpressionInput<number>[]) {
		super()
		this.operatorName = operatorName
		this.subexpressions = subexpressions.map((subexpression) => TransformInputExpression(subexpression))
		this.valueFunction = valueFunction
	}

	toString() {
		return `\\operatorname{${this.operatorName}}\\left(${this.subexpressions.map(subexpression => subexpression.toString()).join(",")}\\right)`
	}

	getValue() {
		return this.valueFunction(...this.subexpressions.map(subexpression => subexpression.getValue()))
	}
}

export class Equal extends SymbolicExpression<number> {
	lhs: SymbolicExpression<number>
	rhs: SymbolicExpression<number>
	requiresParenthesis = false;
	constructor(lhs: SymbolicExpressionInput<number>, rhs: SymbolicExpressionInput<number>) {
		super()
		this.lhs = TransformInputExpression(lhs)
		this.rhs = TransformInputExpression(rhs)
	}

	toString() {
		return `${this.lhs}=${this.rhs}`
	}

	getValue() {
		return this.rhs.getValue()
	}
}

export class SymbolicFunction extends SymbolicExpression<number> {
	requiresParenthesis = false;
	functionName: SymbolicExpression<number>;
	variables: SymbolicExpression<number>;
	constructor(functionName: string, variables: SymbolicExpressionInput<number>) {
		super()
		this.functionName = TransformInputExpression(functionName)
		this.variables = TransformInputExpression(variables)
	}

	toString() {
		return `${this.functionName}\\left(${this.variables}\\right)`
	}

	getValue() {
		return 0 // TODO return value based on variables
	}
}

export class ArrayIndex extends SymbolicExpression<number> {
	requiresParenthesis = false;
	arrayName: string;
	variables: SymbolicExpression<number> | Constant | SymbolicVariable;
	constructor(arrayName: string, variables: SymbolicExpressionInput<number>) {
		super()
		this.arrayName = arrayName
		this.variables = TransformInputExpression(variables)
	}

	toString() {
		return `${this.arrayName}\\left[${this.variables}\\right]`
	}

	getValue() {
		return 0 // TODO return value based on variables
	}
}

export class Exponent extends SymbolicExpression<number> {
	requiresParenthesis = false;
	base: SymbolicExpression<number> | Constant | SymbolicVariable;
	exponent: SymbolicExpression<number> | Constant | SymbolicVariable;
	constructor(base: SymbolicExpressionInput<number>, exponent: SymbolicExpressionInput<number>) {
		super()
		this.base = TransformInputExpression(base)
		this.exponent = TransformInputExpression(exponent)
	}

	toString() {
		if (this.base.requiresParenthesis) {
			return `\\left(${this.base}\\right)^{${this.exponent}}`
		} else {
			return `${this.base}^{${this.exponent}}`
		}
	}

	getValue() {
		return this.base.getValue() ** this.exponent.getValue()
	}
}

export class Sum extends SymbolicExpression<number> {
	requiresParenthesis = false;
	variable: string;
	start: number;
	end: number;
	subexpression: SymbolicExpression<number>;
	constructor(variable: string, start: number, end: number, subexpression: SymbolicExpressionInput<number>) {
		super()
		this.variable = variable
		this.start = start
		this.end = end
		this.subexpression = TransformInputExpression(subexpression)
	}

	toString() {
		return `\\sum_{${this.variable}=${this.start}}^{${this.end}}\\left(${this.subexpression}\\right)`
	}

	getValue() {
		let total = 0
		for (let i = this.start; i <= this.end; i++) {
			virtualCalc.setVariables([{ key: this.variable, value: i }])
			total += this.subexpression.getValue()
		}
		return total
	}
}