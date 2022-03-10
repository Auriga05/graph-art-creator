import { virtualCalc } from "../index.user"
import { HelperExpression, isValueAnalysis } from "../types/desmosTypes"

export class Variable<T> {
	key: string
	value: T
	helperExpression: HelperExpression
	callback: () => any
	constructor(key: number | string, value: T) {
		this.key = key.toString()
		this.value = value
		this.helperExpression = virtualCalc.Calc.HelperExpression({latex: this.key})
		this.callback = () => {
			const analysis = virtualCalc.Calc.expressionAnalysis[`variable_${this.key}`]
			if (isValueAnalysis(analysis)) {
				this.value = analysis.evaluation.value as any as T
			}
		}
		this.helperExpression.observe('numericValue', this.callback)
	}

	setCallback(callback: () => any) {
		this.helperExpression.observe('numericValue', callback)
		this.callback = callback
	}
}