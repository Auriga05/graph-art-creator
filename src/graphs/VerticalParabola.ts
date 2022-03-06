import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { MyCalc } from "../index.user";
import { LinkedVariable, getVariable, substitute, generateBounds, getDomains, setVariable, getValue } from "../lib/lib";
import { Bounds, InputBaseExpression, GeneralConicVariables, Value } from "../types/types";

export type VerticalParabolaVariables = {
  h: number,
  k: number,
  c: number,
}

export type VerticalParabolaData = {
  graphType: 2
  variables: VerticalParabolaVariables | {[Property in keyof VerticalParabolaVariables]: LinkedVariable}
  bounds: Bounds
}
export class VerticalParabola extends Graph implements Initializable, Conic {
  static hasCenter = true;
  static hasCrop = true;
  static graphType = 2;
  static isConic = true;
  static hasGeneralForm = true;
  static xExpression = ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}']
  static yExpression = ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}']
  static graphTypeName = "vertical_parabola"
  static expressionFormat = [ // Vertical Parabola (y)
    { latex: '\\left(x-h_{1}\\right)^{2}=4c_{1}\\left(y-k_{1}\\right)', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+q_{1},k_{1}+d_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'q_{1}=1', types: ['var'], name: 'e' },
    { latex: 'd_{1}=1', types: ['var'], name: 'd' },
    { latex: 'c_{1}=\\frac{q_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
    ...Graph.defaultExpressionFormat,
    ...VerticalParabola.yExpression.map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...VerticalParabola.xExpression.map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: InputBaseExpression) {
    super(expression, 2);
  }

  static fromGeneral(variable: GeneralConicVariables) {
    const {A, C, D, E, F} = variable
    const h = -D / (2 * A);
    const c = -E / (4 * A);
    const k = (F - A * h ** 2) / (4 * c * A);
  
    return { h, k, c };
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const c = getVariable(`c_{${this.graphId}}`);

    const A = 1;
    const C = 0;
    const D = -2 * h;
    const E = -4 * c;
    const F = 4 * c * k + h ** 2;
    return { A, B:0, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const c = MyCalc.linkedVariable(`c_{${graphId}}`);
    const h = MyCalc.linkedVariable(`h_{${graphId}}`);
    const k = MyCalc.linkedVariable(`k_{${graphId}}`);
    return { h, k, c };
  }

  getGraphVariables() {
    return this.getConicVariables()
  }

  convertToStandard() {
    let { latex } = this;
    const currId = this.graphId;
    const { xMin, yMin, xMax, yMax } = this.getBounds();
    latex = latex.replace(`4c_{${currId}}`, (4 * getVariable(`c_{${currId}}`)).toFixed(MyCalc.precision));
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
    const { h, k, c } = variables;

    points = [
      { x: -Infinity, y: Infinity },
      { x: Infinity, y: Infinity },
      { x: h, y: k },
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
    if (axis === 'x') {
      if (h < getValue(xMax)) relevantIndices.push(1);
      if (getValue(xMin) < h) relevantIndices.push(0);
    }
    if (axis === 'y') {
      relevantIndices.push(0);
    }
    return relevantIndices;
  }

  static transformVariables(variables: number[]) {
    let [h, c, k] = variables;
    h = -h;
    k = -k;
    c /= 4;
    return {h, k, c}
  }

  static setGraphVariables(variables: VerticalParabolaVariables | {[Property in keyof VerticalParabolaVariables]: LinkedVariable}, graphId: number) {
    let { h, c, k } = variables;
    if (h instanceof LinkedVariable) h = getValue(h)
    if (c instanceof LinkedVariable) c = getValue(c)
    if (k instanceof LinkedVariable) k = getValue(k)
    const d = Math.sign(c) / 4;
    const e = Math.sqrt(Math.abs(c));
    setVariable(`h_{${graphId}}`, h);
    setVariable(`k_{${graphId}}`, k);
    setVariable(`d_{${graphId}}`, d);
    setVariable(`q_{${graphId}}`, e);
    setVariable(`c_{${graphId}}`, c);
  }

  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) : void {
    setVariable(`q_{${id}}`, size * 0.3);
    setVariable(`d_{${id}}`, size * 0.3);
  }
}