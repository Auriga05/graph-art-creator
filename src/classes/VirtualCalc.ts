import { CalcType, ControllerType } from "../types/desmosTypes";
import { Expression, GraphTypes } from "../types/types";
import { Graph } from "./Graph";

export class VirtualCalcClass {
	expressions: {[key: string]: Expression}
	variables: {[key: string]: string}
	lastId: number;
	Calc: CalcType;
	Controller: ControllerType;
	constructor(_Calc: CalcType) {
		this.expressions = {}
		this.variables = {}
		this.lastId = -1
    this.Calc = _Calc;
    this.Controller = _Calc.controller;
	}

	nextId() {
		this.lastId += 1
		return this.lastId
	}

	setVariables(variables: {key: string, value: string}[]) {
		variables.forEach((variable) => {
			const {key, value} = variable
			this.variables[key] = value
		})
	}
	
	addGraph(graphType: "circle", variables: any) {
		const newGraph = GraphTypes[graphType].addGraph(variables)
		this.setFocus(newGraph)
	}

	setFocus(newGraph: Graph) {
		newGraph.unstandardize()
	}
}