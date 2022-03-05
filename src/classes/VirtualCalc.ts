import { Expression } from "../types/types";

export class VirtualCalc {
	expressions: Expression[]
	variables: {[key: string]: string};
	constructor() {
		this.expressions = []
		this.variables = {}
	}

	setExpressions(expressions: Expression[]) {
		const expressionsObject: {[key: string]: Expression} = Object.fromEntries(
			expressions.map((expression) => [expression.id, expression])
		)
		const expressionIds = new Set(expressions.map(expression => expression.id))
		const updates: {index: number, id: string}[] = []
		this.expressions.forEach((expression, index) => {
			if (expressionIds.has(expression.id)) {
				updates.push({
					index, // existing
					id: expression.id, // id
				})
			}
		})
		updates.forEach((update) => {
			this.expressions[update.index] = expressionsObject[update.id]
		})
		expressionIds.forEach((expressionId) => {
			this.expressions.push(expressionsObject[expressionId])
		})
		console.log(this.expressions)
	}

	setVariables(variables: {key: string, value: string}[]) {
		variables.forEach((variable) => {
			const {key, value} = variable
			this.variables[key] = value
		})
	}
}