import { Graph } from "../Graph";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, substitute, getDomains, minMax, setVariable } from "../lib";

export class LineSegment extends Graph {
  static hasCenter = false;
  static hasCrop = false;
  constructor(expression: Expression) {
    super(expression, 6);
  }

  getGeneralForm() {
    const m = getVariable(`m_{${this.graphId}}`);
    const b = getVariable(`b_{${this.graphId}}`);
    const A = 0;
    const C = 0;
    const D = m;
    const E = 0;
    const F = b;
    return { A, C, D, E, F };
  }

  getConicVariables() {
    const { graphId } = this;
    const x1 = MyCalc.linkedVariable(`x_{${graphId}ca}`);
    const x2 = MyCalc.linkedVariable(`x_{${graphId}cb}`);
    const y1 = MyCalc.linkedVariable(`y_{${graphId}ca}`);
    const y2 = MyCalc.linkedVariable(`y_{${graphId}cb}`);
    return { x1, x2, y1, y2 };
  }

  convertToStandard() {
    let { latex } = this;
    latex = substitute(latex);
    return latex;
  }

  getEndpoints() {
    const { graphId } = this;
    const domains = getDomains(graphId);
    const points: { x: LinkedVariable, y: LinkedVariable } [] = [];
    const variables = this.getConicVariables();
    const { x1, x2, y1, y2 } = variables;
    const xa = minMax([x1, x2]);
    const xb = minMax([x1, x2]);
    const ya = minMax([y1, y2]);
    const yb = minMax([y1, y2]);

    return {
      specialPoints: points,
      cropPoints: this.getBoundPoints(domains, {xa, xb, ya, yb}),
    };
  }

  getRelevant(axis: string) {
    const { graphType, graphId } = this;
    const { xMin, yMin, xMax, yMax } = this.getRealBounds();
    const relevantIndices = [];
    relevantIndices.push(0);
    return relevantIndices;
  }

  
  static transformVariables(variables: number[]) {
    const [m, b, x1, x2] = variables;
    return {m, b, x1, x2}
  }

  static setGraphVariables(variables: ReturnType<typeof LineSegment.transformVariables>, graphId: number) {
    const { m, b, x1, x2 } = variables;
    const y1 = m * x1 + b;
    const y2 = m * x2 + b;
    setVariable(`x_{${graphId}a}`, x1.toString());
    setVariable(`y_{${graphId}a}`, y1.toString());
    setVariable(`x_{${graphId}b}`, x2.toString());
    setVariable(`y_{${graphId}b}`, y2.toString());
  }
  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) : void {
    setVariable(`x_{${id}a}`, expressionPos.x - size * 0.2);
    setVariable(`y_{${id}a}`, expressionPos.y - size * 0.2);
    setVariable(`x_{${id}b}`, expressionPos.x + size * 0.2);
    setVariable(`y_{${id}b}`, expressionPos.y + size * 0.2);
  }
}
