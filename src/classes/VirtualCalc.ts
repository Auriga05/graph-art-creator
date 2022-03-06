import { Expression } from "../types/types";

export class VirtualCalc {
	expressions: {[key: string]: Expression}
	variables: {[key: string]: string}
	constructor() {
		this.expressions = {}
		this.variables = {}
	}

	setExpressions(expressions: Expression[]) {
		const expressionsObject: {[key: string]: Expression} = Object.fromEntries(
			expressions.map((expression) => [expression.id, expression])
		)
		const expressionIds = new Set(expressions.map(expression => expression.id))
		const updates: {index: number, id: string}[] = []
		Object.entries(this.expressions).forEach((expression, index) => {
			if (expressionIds.has(expression[0])) {
				updates.push({
					index, // existing
					id: expression[0], // id
				})
			}
		})
		updates.forEach((update) => {
			this.expressions[update.index] = expressionsObject[update.id]
		})
		expressionIds.forEach((expressionId) => {
			this.expressions[expressionId] = expressionsObject[expressionId]
		})
		console.log(this.expressions)
	}

	removeExpressions(expressions: Partial<Expression>[]) {
		const expressionIds = new Set(expressions.map(expression => expression.id))
		this.expressions = Object.fromEntries(Object.entries(this.expressions).filter(entry => !expressionIds.has(entry[0])))
	}

	setVariables(variables: {key: string, value: string}[]) {
		variables.forEach((variable) => {
			const {key, value} = variable
			this.variables[key] = value
		})
	}
}