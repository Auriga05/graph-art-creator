import { Variable } from "../classes/Variable";

export function convertToKeyValuePairs<T>(arg: {[key: string]: T}) {
	return Object.entries(arg).map((entry) => {
		const [key, value] = entry;
		return { key, value }
	})
}

export function convertToVariableObjects<T>(arg: {[key: string]: T}) {
	return Object.entries(arg).map((entry) => {
		const [key, value] = entry;
		return new Variable(key, value)
	})
}

export function abssgn(text: string) {
	return `\\operatorname{abs}\\left(${text}\\right)\\operatorname{sgn}\\left(${text}\\right)`
}