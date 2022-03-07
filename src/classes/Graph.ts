import { virtualCalc } from "../index.user"
import { MinBaseExpression } from "../types/types"
import { convertToVariableObjects } from "../utils/utils"

type VariablesType = {
  [key: string]: number,
  h: number,
  k: number,
}
export abstract class Graph {
  abstract getExpressionLatex(): string
  abstract show(): void
  abstract variables: VariablesType
  abstract pointsLatex: string[]
  static boundVariableNames = ['c_{x1}', 'c_{y1}', 'c_{x2}', 'c_{y2}']
  id: number
  focused: boolean
  shown: boolean
  cropVariables: {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  }
  constructor() {
    this.id = virtualCalc.nextId()
    this.cropVariables = {
      minX: -8,
      minY: -4,
      maxX: 8,
      maxY: 4,
    }
    this.focused = false
    this.shown = false
  }

  unstandardize() {
    virtualCalc.setExpressions(virtualCalc.showVariables([
      ...Object.keys(this.variables),
      ...Graph.boundVariableNames
    ]))
    virtualCalc.setExpressions(this.showPoints())
  }
  
	showPoints(): MinBaseExpression[] {
    const points = this.pointsLatex.map((latex, index) => {
      return {id: `graphpoint_${index}`, type: "expression" as const, latex}
		})
    virtualCalc.points = points
		return points
	}

  focus() {
    virtualCalc.setVariables([
      { key: 'c_{x1}', value: this.cropVariables.minX - this.variables.h },
      { key: 'c_{y1}', value: this.cropVariables.minY - this.variables.k },
      { key: 'c_{x2}', value: this.cropVariables.maxX - this.variables.h },
      { key: 'c_{y2}', value: this.cropVariables.maxY - this.variables.k },
    ])
    this.focused = true
    virtualCalc.setVariables(convertToVariableObjects(this.variables))
    this.unstandardize()
  }

  defocus() {
    this.focused = false
    this.standardize()
  }

  update () {
    if (this.focused) {
      if (!this.shown) {
        this.show()
      }
      this.variables = Object.fromEntries(Object.keys(this.variables).map(
          variableName => [variableName, virtualCalc.variables[variableName].value]
      )) as VariablesType
      virtualCalc.recalculateBoundVariables()
      this.cropVariables = virtualCalc.getMinMaxBoundVariables()
    }
  }

  getGraphId() {
    return `graph_${this.id}`
  }

  standardizedBoundsLatex() {
    const {minX, minY, maxX, maxY} = virtualCalc.getMinMaxBoundVariables()
    return `\\left\\{${minX}<x<${maxX}\\right\\}\\left\\{${minY}<y<${maxY}\\right\\}`
  }

  standardize() {
    virtualCalc.removeGraphPoints()
    virtualCalc.setExpressions([
      {
        type: "expression",
        id: `graph_${this.id}`,
        latex: this.getExpressionLatex()
      }
    ])
  }

  delete() {
    this.defocus()
    virtualCalc.removeGraphPoints()
  }
}
