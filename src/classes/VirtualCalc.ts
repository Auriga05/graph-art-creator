import { CalcType, ControllerType } from "../types/desmosTypes";
import { Expression, GraphTypeName, GraphTypes, KeyValuePair, MinBaseExpression, PartialInputBaseExpression } from "../types/types";
import { abssgn } from "../utils/utils";
import { Graph } from "./Graph";
import { Variable } from "./Variable";

export class VirtualCalcClass {
	graphs: {[key: string]: Graph}
	lastId: number;
	variables: {[key: string]: Variable<number>} // variables_{variable_latex}
	Calc: CalcType;
	Controller: ControllerType;
	points: Expression[];

	focus: Graph | null;
	constructor(_Calc: CalcType) {
		this.graphs = {}
		this.variables = {}
		this.lastId = -1
    this.Calc = _Calc;
    this.Controller = _Calc.controller;
		this.focus = null;
		this.points = []
	}

	init() {
		this.setVariables([
			{ key: "c_{x1}", value: 8 },
			{ key: "c_{y1}", value: 4 },
			{ key: "c_{x2}", value: -8 },
			{ key: "c_{y2}", value: -4 },
		]),
		this.setExpressions([
			...this.showVariables(["c_{x1}", "c_{y1}", "c_{x2}", "c_{y2}"]),
			...this.showBounds()
		])
	}

	nextId() {
		this.lastId += 1
		if (this.lastId === 0) {
			this.init()
		}
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
	
	updateVariables() {
		const newVariables: Variable<number>[] = []
		const analysis = this.Calc.expressionAnalysis
		Object.keys(this.variables).forEach((variable) => {
			const variableAnalysis = analysis[`variable_${variable}`]
			if (!variableAnalysis) throw new Error(`Analysis of ${variable} not found`)
			if (!variableAnalysis.evaluation) return
			if (variableAnalysis.evaluation.type === "Number") {
				newVariables.push(new Variable(variable, variableAnalysis.evaluation.value))
			}
		})
		console.log(newVariables)
		this.setVariables(newVariables)
	}
	
	addGraph(graphType: GraphTypeName, variables?: any) {
		const newGraph = variables ? new GraphTypes[graphType](variables) : GraphTypes[graphType].createDefault()
		this.graphs[newGraph.id] = newGraph
		this.setFocus(newGraph)
	}
	
	showBounds(): PartialInputBaseExpression[] {
		return [
			{type: "expression", hidden: false, color: "black", latex: "c_{x1a}=c_{x1} + h", id: "variable_c_{x1a}"},
			{type: "expression", hidden: false, color: "black", latex: "c_{x2a}=c_{x2} + h", id: "variable_c_{x2a}"},
			{type: "expression", hidden: false, color: "black", latex: "c_{y1a}=c_{y1} + k", id: "variable_c_{y1a}"},
			{type: "expression", hidden: false, color: "black", latex: "c_{y2a}=c_{y2} + k", id: "variable_c_{y2a}"},
			{type: "expression", hidden: false, color: "black", latex: `\\left(c_{x1} + ${abssgn('h')},c_{y1} + ${abssgn('k')}\\right)`, id: "point_1"},
			{type: "expression", hidden: false, color: "black", latex: `\\left(c_{x1} + ${abssgn('h')},c_{y2} + ${abssgn('k')}\\right)`, id: "point_2"},
			{type: "expression", hidden: false, color: "black", latex: `\\left(c_{x2} + ${abssgn('h')},c_{y1} + ${abssgn('k')}\\right)`, id: "point_3"},
			{type: "expression", hidden: false, color: "black", latex: `\\left(c_{x2} + ${abssgn('h')},c_{y2} + ${abssgn('k')}\\right)`, id: "point_4"},
			{type: "expression", hidden: false, color: "black", latex: "\\left(c_{x1a},c_{y1a}+\\left(c_{y2a}-c_{y1a}\\right)t\\right)", id: "line_1"},
			{type: "expression", hidden: false, color: "black", latex: "\\left(c_{x2a},c_{y1a}+\\left(c_{y2a}-c_{y1a}\\right)t\\right)", id: "line_2"},
			{type: "expression", hidden: false, color: "black", latex: "\\left(c_{x1a}+\\left(c_{x2a}-c_{x1a}\\right)t,c_{y1a}\\right)", id: "line_3"},
			{type: "expression", hidden: false, color: "black", latex: "\\left(c_{x1a}+\\left(c_{x2a}-c_{x1a}\\right)t,c_{y2a}\\right)", id: "line_4"},
		]
	}

	hideBounds(): PartialInputBaseExpression[] {
		return this.showBounds().map(x => {
			x.hidden = true
			return x
		})
	}

	setFocus(newGraph: Graph | null) {
		this.focus?.defocus()
		if (newGraph) {
			this.setExpressions(this.showBounds())
			this.focus = newGraph
			newGraph.focus()
			newGraph.update()
		} else {
			this.setExpressions(this.hideBounds())
		}
	}

	setExpressions(expressions: Expression[]) {
		this.Calc.setExpressions(expressions)
	}

	showVariables(variableList: string[]): MinBaseExpression[] {
		const variables = variableList.map(variableName => {
			console.log(variableName, this.variables)
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
		if (this.focus && this.Calc.selectedExpressionId) {
			if (this.Calc.selectedExpressionId.startsWith('graph_')) {
				if (this.focus.getGraphId() !== this.Calc.selectedExpressionId) {
					const newFocusId = this.Calc.selectedExpressionId.replace('graph_', '')
					this.setFocus(this.graphs[newFocusId])
				}
			}
		}
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
			{ key: 'c_{x1a}', value: this.variables['c_{x1}'].value + this.variables['h'].value },
			{ key: 'c_{x2a}', value: this.variables['c_{x2}'].value + this.variables['h'].value },
			{ key: 'c_{y1a}', value: this.variables['c_{y1}'].value + this.variables['k'].value },
			{ key: 'c_{y2a}', value: this.variables['c_{y2}'].value + this.variables['k'].value },
		])
	}

	removeGraphPoints() {
		this.Calc.removeExpressions(this.points)
	}

	removeGraph() {
		if (this.Calc.selectedExpressionId?.startsWith("graph_")) {
			const graphId = this.Calc.selectedExpressionId.replace("graph_", "")
			const graph = this.graphs[graphId]
			graph.delete()
			delete this.graphs[graphId]
		}
	}
}