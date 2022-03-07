import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { virtualCalc } from "../index.user";
import { MinBaseExpression } from "../types/types";
import { abssgn } from "../utils/utils";

type EllipseVariables = {
  h: number
  k: number
  a: number
  b: number
}
export class Ellipse extends Graph implements Conic {
  static graphType = "ellipse" as const;
  static defaultVariables = {h: 0, k: 0, a: 3, b: 2}
  pointsLatex = ["\\left(h,k\\right)", `\\left(h+a,${abssgn('k')}\\right)`, `\\left(${abssgn('h')},k+b\\right)`]

  variables: EllipseVariables;
  constructor(variables: EllipseVariables) {
    super()
    this.variables = variables
  }
  
  static createDefault() {
    return new Ellipse(this.defaultVariables)
  }

  getExpressionLatex() {
    return `\\frac{\\left(x-${this.variables.h}\\right)^{2}}{${this.variables.a ** 2}}+\\frac{\\left(y-${this.variables.k}\\right)^{2}}{${this.variables.b ** 2}}=1${this.standardizedBoundsLatex()}`
  }

  show() {
    const expressions: MinBaseExpression[] = [{
      type: "expression",
      id: this.getGraphId(),
      latex: "\\frac{\\left(x-h\\right)^{2}}{a^{2}}+\\frac{\\left(y-k\\right)^{2}}{b^{2}}=1" +
             "\\left\\{\\min\\left(c_{x1a},c_{x2a}\\right)<x<\\max\\left(c_{x1a},c_{x2a}\\right)\\right\\}" +
             "\\left\\{\\min\\left(c_{y1a},c_{y2a}\\right)<y<\\max\\left(c_{y1a},c_{y2a}\\right)\\right\\}"}]
    virtualCalc.setExpressions(expressions)
  }
}