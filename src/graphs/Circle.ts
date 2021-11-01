import { Graph, HasCrop } from "../Graph";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, getDomains, substitute, generateBounds, simplify, setVariable } from "../lib";

export interface CircleVariables {
  h: number,
  k: number,
  r: number,
}

export class Circle extends Graph {
  static hasCenter = true;
  static hasCrop = true;
  constructor(expression: Expression) {
    super(expression, 0);
  }

  getGeneralForm() {
    const h = getVariable(`h_{${this.graphId}}`);
    const k = getVariable(`k_{${this.graphId}}`);
    const r = getVariable(`r_{${this.graphId}}`);

    const A = 1;
    const C = 1;
    const D = -2 * h;
    const E = -2 * k;
    const F = k ** 2 + h ** 2 - r ** 2;
    return { A, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const h = MyCalc.linkedVariable(`h_{${graphId}}`);
    const k = MyCalc.linkedVariable(`k_{${graphId}}`);
    const r = MyCalc.linkedVariable(`r_{${graphId}}`);
    return { h, k, r };
  }

  convertToStandard() {
    let { latex } = this;
    const currId = this.graphId;
    const { xMin, yMin, xMax, yMax } = this.getBounds();
    const r2 = getVariable(`r_{${currId}}`) ** 2;
    latex = latex.replace(`r_{${currId}}^{2}`, simplify(r2, 4));
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
    const { h, k, r } = variables;

    points = [
      { x: MyCalc.linkedVariable(`${h.reference}-${r.reference}`), y: k },
      { x: h, y: MyCalc.linkedVariable(`${k.reference}-${r.reference}`) },
      { x: MyCalc.linkedVariable(`${h.reference}+${r.reference}`), y: k },
      { x: h, y: MyCalc.linkedVariable(`${k.reference}+${r.reference}`) },
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
      if (h < xMax.value) relevantIndices.push(1);
      if (xMin.value < h) relevantIndices.push(0);
    }
    if (axis === 'y') {
      if (k < yMax.value) relevantIndices.push(1);
      if (yMin.value < k) relevantIndices.push(0);
    }
    return relevantIndices;
  }

  static transformVariables(variables: number[]): CircleVariables {
    let [h, k, r] = variables;
    h = -h;
    k = -k;
    r = Math.sqrt(Math.abs(r));
    return {h, k, r}
  }

  static setGraphVariables(variables: CircleVariables, graphId: number) {
    const { h, k, r } = variables;
    setVariable(`h_{${graphId}}`, h);
    setVariable(`k_{${graphId}}`, k);
    setVariable(`a_{${graphId}}`, r);
    setVariable(`b_{${graphId}}`, '0');
    setVariable(`r_{${graphId}}`, r);
  }

  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) {
    setVariable(`a_{${id}}`, size * 0.3);
    setVariable(`b_{${id}}`, 0);
  }
}