import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { MyCalc } from "../index.user";
import { LinkedVariable, getVariable, simplify, substitute, generateBounds, getDomains, setVariable, getValue } from "../lib/lib";
import { Bounds, InputBaseExpression, GeneralConicVariables, Value } from "../types/types";

export type EllipseVariables = {
  h: number,
  k: number,
  a: number,
  b: number,
}

export type EllipseData = {
  graphType: 3
  variables: EllipseVariables | {[Property in keyof EllipseVariables]: LinkedVariable}
  bounds: Bounds
}
export class Ellipse extends Graph implements Initializable, Conic {
  static hasCenter = true;
  static hasCrop = true;
  static graphType = 3;
  static isConic = true;
  static hasGeneralForm = true;
  static xExpression = ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}']
  static yExpression = ['k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}']
  static graphTypeName = "ellipse"
  static expressionFormat = [ // Ellipse (x or y)
    { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}+\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'h' },
    { latex: 'h_{1}=0', types: ['var'], name: 'k' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=1', types: ['var'], name: 'b' },
    ...Graph.defaultExpressionFormat,
    ...Ellipse.yExpression.map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...Ellipse.xExpression.map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: InputBaseExpression) {
    super(expression, 3);
  }

  static fromGeneral(variable: GeneralConicVariables) {
    let {A, C, D, E, F} = variable
    if (A < 0) {
      A = -A
      C = -C
      D = -D
      E = -E
      F = -F
    }
    const h = -D / (2 * A);
    const k = -E / (2 * C);
    const b = Math.sqrt((A * h ** 2 + C * k ** 2 - F) / C);
    const a = Math.sqrt((A * h ** 2 + C * k ** 2 - F) / A);
  
    return { h, k, a, b };
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const a = getVariable(`a_{${this.graphId}}`);
    const b = getVariable(`b_{${this.graphId}}`);

    const A = b ** 2;
    const C = a ** 2;
    const D = -2 * h * b ** 2;
    const E = -2 * k * a ** 2;
    const F = b ** 2 * h ** 2 + a ** 2 * k ** 2 - a ** 2 * b ** 2;
    return { A, B:0, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const h = MyCalc.linkedVariable(`h_{${graphId}}`);
    const k = MyCalc.linkedVariable(`k_{${graphId}}`);
    const a = MyCalc.linkedVariable(`a_{${graphId}}`);
    const b = MyCalc.linkedVariable(`b_{${graphId}}`);
    return { h, k, a, b };
  }

  getGraphVariables() {
    return this.getConicVariables()
  }

  convertToStandard() {
    let { latex } = this;
    const currId = this.graphId;
    const { xMin, yMin, xMax, yMax } = this.getBounds();
    const a = getVariable(`a_{${currId}}`);
    const b = getVariable(`b_{${currId}}`);
    const a2 = a ** 2;
    const b2 = b ** 2;
    latex = latex.replace(`a_{${currId}}^{2}`, simplify(a2, 4));
    latex = latex.replace(`b_{${currId}}^{2}`, simplify(b2, 4));
    latex = substitute(latex);
    latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
    latex = latex.replaceAll('--', '+');
    latex = latex.replaceAll('+-', '-');
    return latex;
  }

  getEndpoints() {
    const { graphId } = this;
    const domains = getDomains(graphId);
    let points: { x: Value, y: Value } [] = [];
    const variables = this.getConicVariables();
    const evaluations = this.evaluateBounds(variables, domains)
    const { h, k, a, b } = variables;

    points = [
      { x: MyCalc.linkedVariable(`${h.reference}-${a.reference}`, getValue(h) - getValue(a)), y: k },
      { x: h, y: MyCalc.linkedVariable(`${k.reference}-${b.reference}`, getValue(k) - getValue(b)) },
      { x: MyCalc.linkedVariable(`${h.reference}+${a.reference}`, getValue(h) + getValue(a)), y: k },
      { x: h, y: MyCalc.linkedVariable(`${k.reference}+${b.reference}`, getValue(k) + getValue(b)) },
    ];

    return {
      specialPoints: points,
      cropPoints: this.getBoundPoints(domains, evaluations),
    };
  }

  getRelevant(axis: string) {
    const { graphType, graphId } = this;
    const { xMin, yMin, xMax, yMax } = this.getRealBounds();
    const relevantIndices = [];
    const h = getVariable(`h_{${graphId}}`);
    const k = getVariable(`k_{${graphId}}`);
    if (axis === 'x') {
      if (h < getValue(xMax)) relevantIndices.push(1);
      if (getValue(xMin) < h) relevantIndices.push(0);
    }
    if (axis === 'y') {
      if (k < getValue(yMax)) relevantIndices.push(1);
      if (getValue(yMin) < k) relevantIndices.push(0);
    }
    return relevantIndices;
  }
  
  static transformVariables(variables: number[]) {
    let [h, a, k, b] = variables;
    h = -h;
    k = -k;
    a = Math.sqrt(Math.abs(a));
    b = Math.sqrt(Math.abs(b));
    return {h, a, k, b}
  }

  static setGraphVariables(variables: EllipseVariables | {[Property in keyof EllipseVariables]: LinkedVariable}, graphId: number) {
    const { h, k, a, b } = variables;
    setVariable(`h_{${graphId}}`, h);
    setVariable(`k_{${graphId}}`, k);
    setVariable(`a_{${graphId}}`, a);
    setVariable(`b_{${graphId}}`, b);
  }

  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) : void {
    setVariable(`a_{${id}}`, size * 0.3);
    setVariable(`b_{${id}}`, size * 0.2);
  }
}