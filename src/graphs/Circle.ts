import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { virtualCalc } from "../index.user";
import { MinBaseExpression } from "../types/types";
import { abssgn } from "../utils/utils";

type CircleVariables = {
  h: number
  k: number
  r: number
}
export class Circle extends Graph implements Conic {
  static graphType = "circle" as const;
  static defaultVariables = {h: 0, k: 0, r: 2}
  pointsLatex = ["\\left(h,k\\right)", `\\left(h+r,${abssgn('k')}\\right)`]

  variables: CircleVariables;
  constructor(variables: CircleVariables) {
    super()
    this.variables = variables
  }
  
  static createDefault() {
    return new Circle(this.defaultVariables)
  }

  getExpressionLatex() {
    return `\\left(x-${this.variables.h}\\right)^{2}+\\left(y-${this.variables.k}\\right)^{2}=${this.variables.r ** 2}${this.standardizedBoundsLatex()}`
  }

  show() {
    const expressions: MinBaseExpression[] = [{
      type: "expression",
      id: this.getGraphId(),
      latex: "\\left(x-h\\right)^{2}+\\left(y-k\\right)^{2}=r^{2}" +
             "\\left\\{\\min\\left(c_{x1a},c_{x2a}\\right)<x<\\max\\left(c_{x1a},c_{x2a}\\right)\\right\\}" +
             "\\left\\{\\min\\left(c_{y1a},c_{y2a}\\right)<y<\\max\\left(c_{y1a},c_{y2a}\\right)\\right\\}"}]
    virtualCalc.setExpressions(expressions)
  }
}