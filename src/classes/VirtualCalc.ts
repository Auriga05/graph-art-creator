import { Add } from "../lib/symbolicLib";
import { CalcType, ControllerType } from "../types/desmosTypes";
import { Expression, GraphTypeName, GraphTypes, InputExpression, InputBaseExpression, SaveExpressionType, SaveType } from "../types/types";
import { abssgn } from "../utils/utils";
import { CroppableGraph } from "./CroppableGraph";
import { Graph } from "./Graph";
import { Variable } from "./Variable";

export class VirtualCalcClass {
	graphs: {[key: string]: Graph}
	lastId: number;
	variables: {[key: string]: Variable<number>} // variables_{variable_latex}
	Calc: CalcType;
	Controller: ControllerType;
	helperExpressions: InputExpression[];
	expressionsToSet: {
		expressions: InputExpression[],
		callback?: () => any,
	}[];
	expressionsToRemove: {
		expressions: InputExpression[],
		callback?: () => any,
	}[];
	isShowingBounds: boolean;
	focus: Graph | null;
	constructor(_Calc: CalcType) {
		this.graphs = {}
		this.variables = {}
		this.lastId = -1
    this.Calc = _Calc;
    this.Controller = _Calc.controller;
		this.focus = null;
		this.helperExpressions = []
		this.isShowingBounds = false;
		this.expressionsToSet = []
		this.expressionsToRemove = []
	}

	save() {
		const value: SaveType = {
			graphs: Object.values(this.graphs).map(graph => graph.toObject()),
			variables: Object.values(this.variables).map(variable => { 
				return { key: variable.key, value: variable.value }
			}),
			lastId: this.lastId,
			points: this.helperExpressions,
		}
		const valueToJSON = JSON.stringify(value)
		this.setExpressions([
			{
				type: "expression",
				id: "graph_data",
				latex: "0",
				label: valueToJSON,
			}
		], () => { return }, true)
		console.log(valueToJSON)
	}

	load() {
		const expression = this.getExpression("graph_data")
		if (!expression) return
		if (expression.type === "expression") {
			const value: SaveType = JSON.parse(expression.label)
			this.lastId = value.lastId
			this.helperExpressions = value.points
			this.variables = Object.fromEntries(value.variables
				.map(variable => new Variable<number>(variable.key, variable.value))
				.map(variable => [variable.key, variable]))
			this.graphs = Object.fromEntries(
				value.graphs.map(graph => this.fromGraph(graph))
					.map(graph => [graph.id, graph])
			)
		}
	}
	
	fromGraph(expression: SaveExpressionType) {
		const newGraph: Graph = new GraphTypes[expression.graphType](expression.variables as any)
		this.graphs[newGraph.id] = newGraph
		return newGraph
	}

	nextId() {
		this.lastId += 1
		return this.lastId
	}

	setVariables(variables: {key: string, value: number}[]) {
		variables.forEach((variable) => {
			const {key, value} = variable
			if (key in this.variables) {
				this.variables[key].value = value
			} else {
				this.variables[key] = new Variable(key, value)
			}
		})
	}
	
	// pushVariables(variableList?: string[]) {
	// 	const newVariables: Variable<number>[] = []
	// 	const analysis = this.Calc.expressionAnalysis
	// 	const variableNames = variableList ?? Object.keys(this.variables)
	// 	variableNames.forEach((variable) => {
	// 		const variableAnalysis = analysis[`variable_${variable}`]
	// 		if (!variableAnalysis) throw new Error(`Analysis of ${variable} not found`)
	// 		if (!variableAnalysis.evaluation) return
	// 		if (variableAnalysis.evaluation.type === "Number") {
	// 			newVariables.push(new Variable(variable, variableAnalysis.evaluation.value))
	// 		}
	// 	})
	// 	this.setVariables(newVariables)
	// }

	addGraph(graphType: GraphTypeName, variables?: any) {
		let newGraph;
		if (variables) {
			newGraph = new GraphTypes[graphType](variables)
		} else {
			newGraph = new Proxy(
				GraphTypes[graphType].createDefault(),
				{
					get: (target, prop, receiver) => {
						// console.log(`Getting ${prop.toString()} from graph ${target.id}`)
						return Reflect.get(target, prop, receiver)
					},
					set: (target, prop, value, receiver) => {
						// console.log(`Setting ${prop.toString()} to ${value.toString()} from graph ${target.id}`)
						return Reflect.set(target, prop, value, receiver)
					},
					apply: (target, thisArg, argArray) => {
						// console.log(`Applying ${thisArg.toString()} from graph ${target.id}`)
						return (Reflect as any).apply(target, thisArg, argArray)
					}
				}
			)
		}
		this.graphs[newGraph.id] = newGraph
		this.setFocus(newGraph)
	}

	hideBounds(): InputBaseExpression[] {
		this.isShowingBounds = false
		// return this.showBounds().map(x => {
		// 	x.hidden = true
		// 	return x
		// })
		return []
	}

	setFocus(newGraph: Graph | null) {
		if (newGraph instanceof CroppableGraph) {	
			const isShowingBounds = this.getExpression('point_1') as InputBaseExpression | undefined
			if (isShowingBounds) {
				if (newGraph && isShowingBounds.hidden) {
					this.setExpressions(newGraph.getHelperExpressions())
				}
			}
		}
		if (this.focus != newGraph) {
			this.focus?.defocus()
			if (newGraph) {
				this.focus = newGraph
				newGraph.focus()
				newGraph.update()
			} else {
				this.setExpressions(this.hideBounds())
			}
		}
		this.confirmChangeExpressions()
	}

	setExpressions(expressions: InputExpression[], callback?: () => any, immediate?: boolean) {
		if (immediate) {
			this.Calc.setExpressions(expressions)
			if (callback) callback()
			console.log("SET EXPRESSIONS", expressions)
			console.trace()
		} else {
			console.log("ADD EXPRESSIONS", expressions)
			console.trace()
			if (callback) {
				this.expressionsToSet.push({
					callback,
					expressions,
				})
			} else {
				this.expressionsToSet.push({
					expressions
				})
			}
		}
	}

	confirmChangeExpressions() {
		const expressionsToSet = this.expressionsToSet.map(value => value.expressions).flat()
		const expressionsToSetId = new Set(expressionsToSet.map(expression => expression.id))
		
		const expressionsToRemove = this.expressionsToRemove
			.map(value => value.expressions)
			.flat()
			.filter(expression => !expressionsToSetId.has(expression.id))

		this.expressionsToRemove.forEach(value => {
			if (value.callback) {
				value.callback()
			}
		})

		this.expressionsToSet.forEach(value => {
			if (value.callback) {
				value.callback()
			}
		})

		if (expressionsToRemove.length > 0) {
			this.Calc.removeExpressions(expressionsToRemove)
			console.log("REMOVED EXPRESSIONS", expressionsToRemove)
		}
		if (expressionsToSet.length > 0) {
			this.Calc.setExpressions(expressionsToSet)
			console.log("SET EXPRESSIONS", expressionsToSet)
		}
		if ((expressionsToRemove.length > 0) || (expressionsToSet.length > 0)) {
			console.trace()
		}
		console.log("=======================================================")

		this.expressionsToSet = []
		this.expressionsToRemove = []
	}

	getVariableExpressions(variableList: string[]): InputBaseExpression[] {
		const variables = variableList.map(variableName => {
			return {
				type: "expression" as const,
				latex: `${variableName}=${this.variables[variableName].value}`,
				id: `variable_${variableName}`,
				hidden: true,
			}
		})
		return variables
	}

	onChange() {
		Object.values(this.graphs).forEach(graph => {
			graph.update()
		})
		if (this.selectedExpressionId) {
			if (this.selectedExpressionId.startsWith('graph_')) {
				const newFocusId = this.selectedExpressionId.replace('graph_', '')
				this.setFocus(this.graphs[newFocusId])
			}
		}
		this.confirmChangeExpressions()
	}

	getMinMaxBoundVariables() {
		const minX = Math.min(
			this.variables['c_{x1a}'].value,
			this.variables['c_{x2a}'].value,
		)
		
		const maxX = Math.max(
			this.variables['c_{x1a}'].value,
			this.variables['c_{x2a}'].value,
		)
		
		const minY = Math.min(
			this.variables['c_{y1a}'].value,
			this.variables['c_{y2a}'].value,
		)
		
		const maxY = Math.max(
			this.variables['c_{y1a}'].value,
			this.variables['c_{y2a}'].value,
		)
		
		return {minX, minY, maxX, maxY}
	}
	
	recalculateBoundVariables() {
		this.setVariables([
			{ key: 'c_{x1a}', value: new Add('c_{x1}', 'h').getValue() },
			{ key: 'c_{x2a}', value: new Add('c_{x2}', 'h').getValue() },
			{ key: 'c_{y1a}', value: new Add('c_{y1}', 'k').getValue() },
			{ key: 'c_{y2a}', value: new Add('c_{y2}', 'k').getValue() },
		])
	}

	removeGraphPoints() {
		this.removeExpressions(this.helperExpressions)
	}

	removeGraph() {
		this.focus = null;
		this.setExpressions(this.hideBounds())
		if (this.Calc.selectedExpressionId?.startsWith("graph_")) {
			const graphId = this.Calc.selectedExpressionId.replace("graph_", "")
			const graph = this.graphs[graphId]
			graph.remove()
			delete this.graphs[graphId]
		}
	}

	getItemCount() {
    return this.Controller.getItemCount()
  }

  set selectedExpressionId(id: string | undefined) {
    this.Controller.dispatch({type: "set-selected-id", id: id})
  }
	
	get selectedExpressionId() {
		return this.Calc.selectedExpressionId
	}

  getExpression(_id: string) {
		const expression = this.Controller.getItemModel(_id);
		if (expression) {
			return expression
		}
	}
	
	removeExpressions(expressions: InputExpression[], callback?: () => any, immediate?: boolean) {
		if (immediate) {
			this.Calc.removeExpressions(expressions)
			if (callback) callback()
			console.log("REMOVED EXPRESSIONS", expressions)
			console.trace()
		} else {
			console.log("EXPRESSIONS TO REMOVE", expressions)
			console.trace()
			if (callback) {
				this.expressionsToRemove.push({
					callback,
					expressions,
				})
			} else {
				this.expressionsToRemove.push({
					expressions
				})
			}
		}
	}

	onShift() {
		Object.values(this.graphs).forEach(graph => graph.onShift())
	}

	onUnshift() {
		Object.values(this.graphs).forEach(graph => graph.onUnshift())
	}
}