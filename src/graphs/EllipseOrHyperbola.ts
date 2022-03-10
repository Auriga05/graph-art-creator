import { Conic } from "../classes/Conic";
import { CroppableGraph } from "../classes/CroppableGraph";
import { virtualCalc } from "../index.user";
import { InputBaseExpression } from "../types/types";
import { abssgn } from "../utils/utils";

type EllipseOrHyperbolaVariables = {
  h: number
  k: number
  a: number
  b: number
}
export class EllipseOrHyperbola extends CroppableGraph implements Conic {
  static graphType = "ellipse_or_hyperbola" as const;
  static defaultVariables = {h: 0, k: 0, a: 3, b: 2}

  _variables: EllipseOrHyperbolaVariables;
  constructor(variables: EllipseOrHyperbolaVariables) {
    super()
    this._variables = variables
  }
  
  static createDefault() {
    return new EllipseOrHyperbola(this.defaultVariables)
  }

  getExpressionLatex() {
    return (Math.sign(this.variables.b) == 1 ? `` : `-`) +
      `\\frac{\\left(x-${(this.variables.h).toPrecision(4)}\\right)^{2}}{${(this.variables.a ** 2).toPrecision(4)}}` +
      (Math.sign(this.variables.a) == 1 ? `+` : `-`) + 
      `\\frac{\\left(y-${(this.variables.k).toPrecision(4)}\\right)^{2}}{${(this.variables.b ** 2).toPrecision(4)}}=1` + 
      `${this.standardizedBoundsLatex()}`
  }

  addGraph() {
    this.showSymbolic()
  }

  override getSymbolicExpressions() {
		super.getSymbolicExpressions()
    const expressions: InputBaseExpression[] = [{
      type: "expression",
      id: this.getGraphId(),
      latex: "\\frac{\\left(x-h\\right)^{2}}{a^{2}}\\operatorname{sgn}\\left(b\\right)+\\frac{\\left(y-k\\right)^{2}}{b^{2}}\\operatorname{sgn}\\left(a\\right)=1" +
             "\\left\\{\\min\\left(c_{x1a},c_{x2a}\\right)<x<\\max\\left(c_{x1a},c_{x2a}\\right)\\right\\}" +
             "\\left\\{\\min\\left(c_{y1a},c_{y2a}\\right)<y<\\max\\left(c_{y1a},c_{y2a}\\right)\\right\\}"}]
    return expressions
  }

  getHelperExpressions(): InputBaseExpression[] {
    const helperExpressions = super.getHelperExpressions()
    const helperPoints = [
      {type: "expression" as const, latex: "\\left(h,k\\right)", id: "graphhelper_center"},
      {type: "expression" as const, latex: `\\left(h+a,${abssgn('k')}\\right)`, id: "graphhelper_horizontal"},
      {type: "expression" as const, latex: `\\left(${abssgn('h')},k+b\\right)`, id: "graphhelper_vertical"},
    ]

		console.log(helperExpressions, helperPoints)
    virtualCalc.helperExpressions = [...helperExpressions, ...helperPoints]
		return [...helperExpressions, ...helperPoints]
	}

  toObject() {
    return {
      ...super.toObject(),
      graphType: EllipseOrHyperbola.graphType,
    }
  }

  onShift() {
    const sign = Math.sign(virtualCalc.variables['b'].value) * Math.sign(virtualCalc.variables['a'].value)
    virtualCalc.setExpressions([
      { type: 'expression', id: 'variable_b', latex: sign == 1 ? `b=a` : `b=-a`}
    ], undefined, true)
  }

  onUnshift() {
    virtualCalc.setExpressions([
      { type: 'expression', id: 'variable_b', latex: `b=${virtualCalc.variables['b'].value}`}
    ], undefined, true)
  }
}