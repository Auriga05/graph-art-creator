export class Variable<T> {
	key: string
	value: T
	constructor(key: number | string, value: T) {
		this.key = key.toString()
		this.value = value
	}
}