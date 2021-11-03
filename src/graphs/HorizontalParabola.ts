import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { defaultExpressionFormat, xExpressions, yExpressions } from "../constants";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, substitute, generateBounds, getDomains, simplify, setVariable } from "../lib";

export class HorizontalParabola extends Graph implements Initializable, Conic {
  static hasCenter = true;
  static hasCrop = true;
  isConic = true;
  static expressionFormat = [ // Horizontal Parabola (x)
    { latex: '\\left(y-k_{1}\\right)^{2}=4c_{1}\\left(x-h_{1}\\right)', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+d_{1},k_{1}+q_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'q_{1}=1', types: ['var'], name: 'e' },
    { latex: 'd_{1}=1', types: ['var'], name: 'd' },
    { latex: 'c_{1}=\\frac{q_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
    ...defaultExpressionFormat,
    ...yExpressions[1].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[1].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: Expression) {
    super(expression, 1);
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const c = getVariable(`c_{${this.graphId}}`);

    const A = 0;
    const C = 1;
    const D = -4 * c;
    const E = -2 * k;
    const F = 4 * c * h + k ** 2;
    return { A, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const c = MyCalc.linkedVariable(`c_{${graphId}}`);
    const h = MyCalc.linkedVariable(`h_{${graphId}}`);
    const k = MyCalc.linkedVariable(`k_{${graphId}}`);
    return { h, k, c };
  }

  convertToStandard() {
    let { latex } = this;
    const currId = this.graphId;
    const { xMin, yMin, xMax, yMax } = this.getBounds();
    latex = latex.replace(`4c_{${currId}}`, simplify(4 * getVariable(`c_{${currId}}`), 4));
    latex = substitute(latex);
    latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
    latex = latex.replaceAll('--', '+');
    latex = latex.replaceAll('+-', '-');
    return latex;
  }

  getEndpoints() {
    const { graphId } = this;
    const domains = getDomains(graphId);
    let points: { x: LinkedVariable, y: LinkedVariable } [] = [];
    const variables = this.getConicVariables();
    const evaluations = this.evaluateBounds(variables, domains)
    const { h, k, c } = variables;

    points = [
      { x: MyCalc.linkedVariable(null, Infinity), y: MyCalc.linkedVariable(null, -Infinity) },
      { x: MyCalc.linkedVariable(null, Infinity), y: MyCalc.linkedVariable(null, Infinity) },
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
    const k = getVariable(`k_{${graphId}}`);
    if (axis === 'x') {
      relevantIndices.push(0);
    }
    if (axis === 'y') {
      if (k < yMax.value) relevantIndices.push(1);
      if (yMin.value < k) relevantIndices.push(0);
    }
    return relevantIndices;
  }
  
  static transformVariables(variables: number[]) {
    let [k, c, h] = variables;
    h = -h;
    k = -k;
    c /= 4;
    return {h, k, c}
  }

  static setGraphVariables(variables: ReturnType<typeof HorizontalParabola.transformVariables>, graphId: number) {
    const { k, c, h } = variables;
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