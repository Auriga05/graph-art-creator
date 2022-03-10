import { nCr } from "../utils/utils"

function qCoefficients(n: number): number[] {
	if (n <= 0) {
		return [1]
	} else {
		const terms = []
		const lowerQCoefficients = qCoefficients(n - 1)
		for (let i = 0; i <= n; i++) {
			if (i == 0) {
				terms.push(lowerQCoefficients[i])
			} else if (i == n) {
				terms.push(-lowerQCoefficients[i - 1])
			} else {
				terms.push(lowerQCoefficients[i] - lowerQCoefficients[i - 1])
			}
		}
		return terms
	}
}

function binomialCoefficients(t: number, n: number) {
	return new Array(n - t).fill(0).concat(qCoefficients(t)).map(x => x * nCr(n, t))
}

export function arrayToPolynomial(values: number[]) {
	const shiftedValues = values.map(value => value - values[0])
	console.log(shiftedValues)
	const n = values.length
	const partialCoefficients = shiftedValues.map((value, index) => binomialCoefficients(index, n).map(x => x * value))
	const finalCoefficients: number[] = Array(values.length + 1).fill(0)
	partialCoefficients.forEach((partialCoefficient) => {
		partialCoefficient.forEach((coefficient, index) => {
			finalCoefficients[index] += coefficient
		})
	})
	finalCoefficients[0] += values[0]
	return finalCoefficients
}