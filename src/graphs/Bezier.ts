import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { virtualCalc } from "../index.user";
import { Add, ArrayIndex, Equal, Exponent, Multiply, Operator, Point, Subtract, Sum, SymbolicFunction } from "../lib/symbolicLib";
import { Expression, InputExpression, InputBaseExpression } from "../types/types";
import { abssgn, nCr } from "../utils/utils";

type BezierVariables = {
	x_1: number
	x_2: number
	x_3: number
	x_4: number
	y_1: number
	y_2: number
	y_3: number
	y_4: number
}
export class Bezier extends Graph implements Conic {
  static graphType = "bezier" as const;
  static defaultVariables = {
		x_1: -2.57,
		x_2: -4.06,
		x_3: -6.31,
		x_4: -5.5,
		y_1: 2.93,
		y_2: 9.02,
		y_3: 1.6,
		y_4: 4.43,
	}

  _variables: BezierVariables;
  constructor(variables: BezierVariables) {
    super()
    this._variables = variables
  }
  
  static createDefault() {
    return new Bezier(this.defaultVariables)
  }

  getExpressionLatex() {
		const table = virtualCalc.getExpression('graphhelper_table')
		if (!table) throw new Error("Can't find bezier table")
		if (table.type == "table") {
			const col1 = table.columns[0].values.filter(x => x !== "").map(x => parseFloat(x))
			const col2 = table.columns[1].values.filter(x => x !== "").map(x => parseFloat(x))

			const toPolynomial = (coefficient: number, index: number, array: number[]) => {
				return new Multiply(
					new Operator("nCr", nCr, 3, index),
					new Exponent(
						new Subtract(1, 't'),
						3 - index
					),
					new Exponent('t', index),
					coefficient - array[0]
				)
			}
			const point = new Point(
				new Add(
					col1[0],
					...col1.map(toPolynomial)
				),
				new Add(
					col2[0],
					...col2.map(toPolynomial)
				)
			).toString()
			console.log(point)
			return point
		}
		throw new Error('graphhelper_table is not a table')
  }

  override focus() {
    this.showSymbolic()
  }

  override getSymbolicExpressions() {
		super.getSymbolicExpressions()
    const expressions: InputBaseExpression[] = [{
			id: `${this.getGraphId()}`,
			type: 'expression',
			latex: '\\left(B_{x}\\left(t\\right),B_{y}\\left(t\\right)\\right)'
		}]
		return expressions
  }

	getHelperExpressions(): InputExpression[] {
    const B1 = {
			id: `graphhelper_${0}`,
			type: "expression" as const,
			hidden: true,
			latex: new Equal(
				new SymbolicFunction('B_{x}', 't'),
				new Add(
					new ArrayIndex('b_{x}', 1),
					new Sum('i', 0, 3, 
						new Multiply(
							new Operator('nCr', nCr, 3, 'i'),
							new Exponent(
								new Subtract(1, 't'),
								new Subtract(3, 'i')
							),
							new Exponent('t', 'i'),
							new Subtract(
								new ArrayIndex('b_{x}', new Add('i', 1)),
								new ArrayIndex('b_{x}', '1'),
							)
						)
					)
				)
			).toString()
		}

		const B2 = {
			id: `graphhelper_${1}`,
			type: "expression" as const,
			hidden: true,
			latex: new Equal(
				new SymbolicFunction('B_{y}', 't'),
				new Add(
					new ArrayIndex('b_{y}', 1),
					new Sum('i', 1, 3, 
						new Multiply(
							new Operator('nCr', nCr, 3, 'i'),
							new Exponent(
								new Subtract(1, 't'),
								new Subtract(3, 'i')
							),
							new Exponent('t', 'i'),
							new Subtract(
								new ArrayIndex('b_{y}', new Add('i', 1)),
								new ArrayIndex('b_{y}', '1'),
							)
						)
					)
				)
			).toString()
		}

		const B3 = {
			id: `graphhelper_${2}`,
			type: "expression" as const,
			latex: new Point(
				new Add(
					new ArrayIndex('b_{x}', 3),
					new Multiply(
						new Subtract(new ArrayIndex('b_{x}', 4), new ArrayIndex('b_{x}', 3)),
						't'
					)
				),
				new Add(
					new ArrayIndex('b_{y}', 3),
					new Multiply(
						new Subtract(new ArrayIndex('b_{y}', 4), new ArrayIndex('b_{y}', 3)),
						't'
					)
				)
			).toString()
		}

		const B4 = {
			id: `graphhelper_${3}`,
			type: "expression" as const,
			latex: new Point(
				new Add(
					new ArrayIndex('b_{x}', 1),
					new Multiply(
						new Subtract(new ArrayIndex('b_{x}', 2), new ArrayIndex('b_{x}', 1)),
						't'
					)
				),
				new Add(
					new ArrayIndex('b_{y}', 1),
					new Multiply(
						new Subtract(new ArrayIndex('b_{y}', 2), new ArrayIndex('b_{y}', 1)),
						't'
					)
				)
			).toString()
		}

		const B5 = {
			id: `graphhelper_table`,
			type:"table" as const,
			columns:[
				{
					id:"column_b_{x}",
					latex:"b_{x}",
					color:"#c74440",
					hidden:true,
					pointStyle:"POINT" as const,
					points:true,
					lines:false,
					dragMode:"NONE" as const,
					values:[
						this.variables.x_1.toString(),
						this.variables.x_2.toString(),
						this.variables.x_3.toString(),
						this.variables.x_4.toString(),
					]
				},
				{
					id:"column_b_{y}",
					latex:"b_{y}",
					color:"#2d70b3",
					hidden:false,
					pointStyle:"POINT" as const,
					points:true,
					lines:false,
					dragMode:"XY" as const,
					values:[
						this.variables.y_1.toString(),
						this.variables.y_2.toString(),
						this.variables.y_3.toString(),
						this.variables.y_4.toString(),
					]
				}
			]
		}
		const helperExpressions = [B1, B2, B3, B4, B5]
		virtualCalc.helperExpressions = helperExpressions
		return helperExpressions
	}
	
  toObject() {
    return {
      ...super.toObject(),
      graphType: Bezier.graphType,
    }
  }

  onShift() {
		//
  }

  onUnshift() {
		//
  }

	addGraph() {

	}
	
	override update () {
		if (this.focused) {
			const table = virtualCalc.getExpression('graphhelper_table')
			if (table?.type !== "table") throw new Error("Table not found")
			const [x_1, x_2, x_3, x_4] = table.columns[0].values.map(x => parseFloat(x))
			const [y_1, y_2, y_3, y_4] = table.columns[1].values.map(x => parseFloat(x))
			this.variables = {x_1, x_2, x_3, x_4, y_1, y_2, y_3, y_4}
		}		
  }

  override showSymbolic() {
    virtualCalc.setExpressions(this.getSymbolicExpressions())
    virtualCalc.setExpressions(this.getHelperExpressions())
  }
	
  override standardize() {
    virtualCalc.removeGraphPoints()
    virtualCalc.setExpressions([
      {
        type: "expression",
        id: `graph_${this.id}`,
        latex: this.getExpressionLatex()
      }
    ])
  }
}