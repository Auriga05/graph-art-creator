import { virtualCalc } from "../index.user"
import { InputBaseExpression, SaveExpressionType } from "../types/types"
import { abssgn, omit } from "../utils/utils"
import { Graph } from "./Graph"

type MovableVariablesType = {
  [key: string]: number,
  h: number,
  k: number,
	'c_{x1}': number,
	'c_{y1}': number,
	'c_{x2}': number,
	'c_{y2}': number,
}
export abstract class CroppableGraph extends Graph {
  static boundVariableNames = ['c_{x1}', 'c_{y1}', 'c_{x2}', 'c_{y2}']
  static defaultCropVariables = [
    { key: "c_{x1}", value: 8 },
    { key: "c_{y1}", value: 4 },
    { key: "c_{x2}", value: -8 },
    { key: "c_{y2}", value: -4 },
    { key: "c_{x1a}", value: 8 },
    { key: "c_{y1a}", value: 4 },
    { key: "c_{x2a}", value: -8 },
    { key: "c_{y2a}", value: -4 },
  ]
  focused: boolean
  shown: boolean
  cropVariables: {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  }
  _variables: {
		[key: string]: number,
		h: number,
		k: number,
	}
  constructor(id?: number) {
    super(id)
    this.cropVariables = {
      minX: -8,
      minY: -4,
      maxX: 8,
      maxY: 4,
    }
    this.focused = false
    this.shown = false
		this._variables = {
			h: 0,
			k: 0,
		}
  }

	get variables(): MovableVariablesType {
		return {...this._variables, ...this.convertedCropVariables}
	}

	set variables(value) {
		this.cropVariables = {
			minX: value["c_{x1}"] + this._variables.h,
			maxX: value["c_{x2}"] + this._variables.h,
			minY: value["c_{y1}"] + this._variables.k,
			maxY: value["c_{y2}"] + this._variables.k,
		}
		this._variables = {
			...this._variables,
			...omit(value, [	
				"c_{x1}",
				"c_{x2}",
				"c_{y1}",
				"c_{y2}",
			])
		}
	}

	get convertedCropVariables() {
		return {
			'c_{x1}': this.cropVariables.minX - this._variables.h,
			'c_{y1}': this.cropVariables.minY - this._variables.k,
			'c_{x2}': this.cropVariables.maxX - this._variables.h,
			'c_{y2}': this.cropVariables.maxY - this._variables.k,
		}
	}

  override focus() {
    virtualCalc.setVariables([
      { key: 'c_{x1}', value: this.cropVariables.minX - this.variables.h },
      { key: 'c_{y1}', value: this.cropVariables.minY - this.variables.k },
      { key: 'c_{x2}', value: this.cropVariables.maxX - this.variables.h },
      { key: 'c_{y2}', value: this.cropVariables.maxY - this.variables.k },
    ])
    this.focused = true
    super.focus()
  }

  override get allVariableNames() {
    return [
      ...Object.keys(this.variables),
      ...CroppableGraph.boundVariableNames
    ]
  }

  override update() {
    super.update()
    if (this.focused) {
      virtualCalc.recalculateBoundVariables()
      this.cropVariables = virtualCalc.getMinMaxBoundVariables()
    }
  }

  override getHelperExpressions() {
		console.log(this.variables)
		const helperExpressions = [
			...virtualCalc.getVariableExpressions(["c_{x1}", "c_{y1}", "c_{x2}", "c_{y2}"]),
			...CroppableGraph.showBounds(),
    ]
    let helperExpressionIndex = 0
    const transformedHelperExpressions = helperExpressions.map(helperExpression => {
      if (!helperExpression.id) {
        helperExpression.id = `graphhelper_${helperExpressionIndex}`
        helperExpressionIndex += 1
      }
      return helperExpression;
    })
    return transformedHelperExpressions
  }

  standardizedBoundsLatex() {
    const {minX, minY, maxX, maxY} = virtualCalc.getMinMaxBoundVariables()
    return `\\left\\{${minX}<x<${maxX}\\right\\}\\left\\{${minY}<y<${maxY}\\right\\}`
  }

  override toObject(): SaveExpressionType {
    return {
      id: this.id,
      cropVariables: this.cropVariables,
      focused: this.focused,
      shown: this.shown,
      variables: this.variables,
      graphType: "ellipse_or_hyperbola",
    }
  }

	static showBounds(): InputBaseExpression[] {
		const defaultExpressionSettings = {
			type: "expression" as const, hidden: false, color: "black"
		}
		return [
			{...defaultExpressionSettings, latex: "c_{x1a}=c_{x1} + h", id: "variable_c_{x1a}"},
			{...defaultExpressionSettings, latex: "c_{x2a}=c_{x2} + h", id: "variable_c_{x2a}"},
			{...defaultExpressionSettings, latex: "c_{y1a}=c_{y1} + k", id: "variable_c_{y1a}"},
			{...defaultExpressionSettings, latex: "c_{y2a}=c_{y2} + k", id: "variable_c_{y2a}"},
			{...defaultExpressionSettings, latex: `\\left(c_{x1} + ${abssgn('h')},c_{y1} + ${abssgn('k')}\\right)`, id: `point_1`},
			{...defaultExpressionSettings, latex: `\\left(c_{x1} + ${abssgn('h')},c_{y2} + ${abssgn('k')}\\right)`},
			{...defaultExpressionSettings, latex: `\\left(c_{x2} + ${abssgn('h')},c_{y1} + ${abssgn('k')}\\right)`},
			{...defaultExpressionSettings, latex: `\\left(c_{x2} + ${abssgn('h')},c_{y2} + ${abssgn('k')}\\right)`},
			{...defaultExpressionSettings, latex: "\\left(c_{x1a},c_{y1a}+\\left(c_{y2a}-c_{y1a}\\right)t\\right)"},
			{...defaultExpressionSettings, latex: "\\left(c_{x2a},c_{y1a}+\\left(c_{y2a}-c_{y1a}\\right)t\\right)"},
			{...defaultExpressionSettings, latex: "\\left(c_{x1a}+\\left(c_{x2a}-c_{x1a}\\right)t,c_{y1a}\\right)"},
			{...defaultExpressionSettings, latex: "\\left(c_{x1a}+\\left(c_{x2a}-c_{x1a}\\right)t,c_{y2a}\\right)"},
		]
	}
}

