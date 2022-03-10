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

function productRange(min: number, max: number) {
	let total = 1
	for (let i = min; i <= max; i++) {
		total *= i
	}
	return total
}

export function nCr(n: number, r: number) {
	if (n == r) {
		return 1
	}
	return productRange(r + 1, n) / productRange(1, n - r)
}

export function omit<T extends Record<string, any>>(obj: T, keys: (keyof T)[]) {
  const keysToRemove = new Set(keys); // flatten the props, and convert to a Set
  
  return Object.fromEntries( // convert the entries back to object
    Object.entries(obj) // convert the object to entries
      .filter(([k]) => !keysToRemove.has(k)) // remove entries with keys that exist in the Set
  );
}
