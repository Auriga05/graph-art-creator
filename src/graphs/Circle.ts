import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { GraphTypeName } from "../types/types";

type CircleVariables = {
	h: number
	k: number
	r: number
}
export class Circle extends Graph implements Conic {
	graphType: GraphTypeName = "circle";
	variables: CircleVariables;
	constructor(variables: CircleVariables) {
		super()
		this.variables = variables
	}
	
	unstandardize() {
		
	}
}