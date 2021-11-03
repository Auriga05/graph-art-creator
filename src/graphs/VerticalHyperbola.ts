import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { defaultExpressionFormat, xExpressions, yExpressions } from "../constants";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, substitute, getDomains, setVariable } from "../lib";

export class VerticalHyperbola extends Graph implements Initializable, Conic {
  static hasCenter = true;
  static hasCrop = true;
  isConic = true;
  static expressionFormat = [ // Vertical Hyperbola (y)
    { latex: '\\frac{\\left(y-k_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(x-h_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1},k_{1}+a_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+b_{1},k_{1}+\\sqrt{2}a_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=1', types: ['var'], name: 'b' },
    ...defaultExpressionFormat,
    ...yExpressions[5].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[5].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: Expression) {
    super(expression, 5);
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const a = getVariable(`a_{${this.graphId}}`);
    const b = getVariable(`b_{${this.graphId}}`);

    const A = -(b ** 2);
    const C = a ** 2;
    const D = 2 * h * b ** 2;
    const E = -2 * k * a ** 2;
    const F = a ** 2 * k ** 2 - b ** 2 * h ** 2 - a ** 2 * b ** 2;
    return { A, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const h = MyCalc.linkedVariable(`h_{${graphId}}`);
    const k = MyCalc.linkedVariable(`k_{${graphId}}`);
    const a = MyCalc.linkedVariable(`a_{${graphId}}`);
    const b = MyCalc.linkedVariable(`b_{${graphId}}`);
    return { h, k, a, b };
  }

  convertToStandard() {
    let { latex } = this;
    const currId = this.graphId;
    const a = getVariable(`a_{${currId}}`);
    const b = getVariable(`b_{${currId}}`);
    const a2 = a ** 2;
    const b2 = b ** 2;

    latex = latex.replace(`a_{${currId}}^{2}`, a2.toFixed(4));
    latex = latex.replace(`b_{${currId}}^{2}`, b2.toFixed(4));
    latex = substitute(latex);
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
    const { h, k, a, b } = variables;

    points = [
      { x: h, y: MyCalc.linkedVariable(`${k.reference}-${b.reference}`)},
      { x: h, y: MyCalc.linkedVariable(`${k.reference}+${b.reference}`)},
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
    const a = getVariable(`a_{${graphId}}`);
    // const b = getVariable(`b_{${graphId}}`);
    if (axis === 'x') {
      if (yMax.value < h) relevantIndices.push(0);
      if (yMin.value > h) relevantIndices.push(1);
    }
    if (axis === 'y') {
      if (yMax.value < k + a) relevantIndices.push(0);
      if (yMin.value > k - a) relevantIndices.push(1);
    }  
    return relevantIndices;
  }
  
  static transformVariables(variables: number[]) {
    let [k, a, h, b] = variables;
    h = -h;
    k = -k;
    a = Math.sqrt(Math.abs(a));
    b = Math.sqrt(Math.abs(b));
    return {h, k, a, b}
  }

  static setGraphVariables(variables: ReturnType<typeof VerticalHyperbola.transformVariables>, graphId: number) {
    const { h, k, a, b } = variables;
    setVariable(`h_{${graphId}}`, h);
    setVariable(`k_{${graphId}}`, k);
    setVariable(`a_{${graphId}}`, a);
    setVariable(`b_{${graphId}}`, b);
  }

  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) : void {
    setVariable(`a_{${id}}`, size * 0.2);
    setVariable(`b_{${id}}`, size * 0.2);
  }
}