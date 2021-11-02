import { Graph } from "../Graph";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, getDomains, substitute, simplify, setVariable } from "../lib";

export class HorizontalHyperbola extends Graph {
  static hasCenter = true;
  static hasCrop = true;
  constructor(expression: Expression) {
    super(expression, 4);
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const a = getVariable(`a_{${this.graphId}}`);
    const b = getVariable(`b_{${this.graphId}}`);

    const A = b ** 2;
    const C = -(a ** 2);
    const D = -2 * h * b ** 2;
    const E = 2 * k * a ** 2;
    const F = b ** 2 * h ** 2 - a ** 2 * k ** 2 - a ** 2 * b ** 2;
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
    latex = latex.replace(`a_{${currId}}^{2}`, simplify(a2, 4));
    latex = latex.replace(`b_{${currId}}^{2}`, simplify(b2, 4));
    latex = substitute(latex);
    latex = latex.replaceAll('--', '+');
    latex = latex.replaceAll('+-', '-');
    return latex;
  }

  getEndpoints() {const { graphId } = this;
  const domains = getDomains(graphId);
  let points: { x: LinkedVariable, y: LinkedVariable } [] = [];
  const variables = this.getConicVariables();
  const evaluations = this.evaluateBounds(variables, domains)
    const { h, k, a, b } = variables;

    points = [
      { x: MyCalc.linkedVariable(`${h.reference}-${a.reference}`), y: k },
      { x: MyCalc.linkedVariable(`${h.reference}+${a.reference}`), y: k },
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
      if (xMax.value < h + a) relevantIndices.push(0);
      if (xMin.value > h - a) relevantIndices.push(1);
    }
    if (axis === 'y') {
      if (yMax.value < k) relevantIndices.push(0);
      if (yMin.value > k) relevantIndices.push(1);
    }
    return relevantIndices;
  }


  static transformVariables(variables: number[]) {
    let [h, a, k, b] = variables;
    h = -h;
    k = -k;
    a = Math.sqrt(Math.abs(a));
    b = Math.sqrt(Math.abs(b));
    return {h, k, a, b}
  }

  static setGraphVariables(variables: ReturnType<typeof HorizontalHyperbola.transformVariables>, graphId: number) {
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