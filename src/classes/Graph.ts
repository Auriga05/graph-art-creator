import { virtualCalc } from "../index.user"
import { InputBaseExpression, InputExpression, SaveExpressionType } from "../types/types"
import { convertToVariableObjects } from "../utils/utils"

type BaseVariablesType = {
  [key: string]: number,
}
export abstract class Graph {
  abstract getExpressionLatex(): string
  abstract onShift(): void
  abstract onUnshift(): void
  abstract addGraph(): void
  id: number
  focused: boolean
  shown: boolean
  _variables: BaseVariablesType
  constructor(id?: number) {
    this.id = id ?? virtualCalc.nextId()
    this.focused = false
    this.shown = false
    this._variables = {}
  }

  set variables(value: BaseVariablesType) {
    this._variables = value
  }

  get variables() {
    return this._variables
  }
  
  getSymbolicExpressions(): InputExpression[] {
    this.shown = true
    return []
  }

  get allVariableNames() {
    return [
      ...Object.keys(this.variables)
    ]
  }
  
  getVariableExpressions(variableList: string[]): InputBaseExpression[] {
    console.log(this.variables)
		const variables = variableList.map(variableName => {
			return {
				type: "expression" as const,
				latex: `${variableName}=${this.variables[variableName]}`,
				id: `variable_${variableName}`,
				hidden: true,
			}
		})
		return variables
	}
  
  showSymbolic() {
    virtualCalc.setExpressions(this.getSymbolicExpressions())
    virtualCalc.setExpressions(this.getVariableExpressions(this.allVariableNames))
    virtualCalc.setExpressions(this.getHelperExpressions())
  }

	abstract getHelperExpressions(): InputExpression[]

  focus() {
    virtualCalc.setVariables(convertToVariableObjects(this.variables))
    this.showSymbolic()
  }

  defocus() {
    this.focused = false
    this.standardize()
  }

  update () {
    if (this.focused) {
      this.variables = Object.fromEntries(Object.keys(this.variables).map(
        variableName => [variableName, virtualCalc.variables[variableName].value]
        )) as BaseVariablesType
        if (!this.shown) {
          virtualCalc.setExpressions(this.getSymbolicExpressions())
        }
    }
  }

  getGraphId() {
    return `graph_${this.id}`
  }

  standardize() {
    virtualCalc.setExpressions(virtualCalc.getVariableExpressions(this.allVariableNames))
    virtualCalc.removeGraphPoints()
    virtualCalc.setExpressions([
      {
        type: "expression",
        id: `graph_${this.id}`,
        latex: this.getExpressionLatex()
      }
    ])
  }

  remove() {
    this.focused = false
    virtualCalc.removeGraphPoints()
    const expression = virtualCalc.getExpression(this.getGraphId())
    if (expression) {
      virtualCalc.removeExpressions([expression])
    } else {
      throw new Error(`Failed removing expression of graph ${this.getGraphId()}`)
    }
  }

  toObject(): SaveExpressionType {
    return {
      id: this.id,
      focused: this.focused,
      shown: this.shown,
      variables: this.variables,
      graphType: "ellipse_or_hyperbola",
    }
  }
}