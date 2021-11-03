import { Conic } from "../classes/Conic";
import { Graph } from "../classes/Graph";
import { xExpressions, yExpressions } from "../constants";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, substitute, getDomains, minMax, setVariable } from "../lib";

export class LineSegment extends Graph implements Initializable, Conic {
  static hasCenter = false;
  static hasCrop = false;
  isConic = true;
  static expressionFormat = [ // Line Segment (x or y)
    { latex: 'y=m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}', types: ['graph'] },
    { latex: '\\left(x_{1a},y_{1a}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(x_{1b},y_{1b}\\right)', types: ['point', 'hide'] },
    { latex: 'x_{1ca}=\\min\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
    { latex: 'x_{1cb}=\\max\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
    { latex: 'm_{1}=\\frac{\\left(y_{1b}-y_{1a}\\right)}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
    { latex: 'b_{1}=y_{1a}-\\frac{\\left(y_{1b}-y_{1a}\\right)x_{1a}}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
    { latex: 'y_{1a}=0', types: ['var'], name: 'ya' },
    { latex: 'y_{1b}=1', types: ['var'], name: 'yb' },
    { latex: 'x_{1a}=0', types: ['var'], name: 'xa' },
    { latex: 'x_{1b}=1', types: ['var'], name: 'xb' },
    ...yExpressions[6].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[6].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    { latex: 'y_{1ca}=m_{1}x_{1ca}+b_{1}', types: ['helper_var'] },
    { latex: 'y_{1cb}=m_{1}x_{1cb}+b_{1}', types: ['helper_var'] },
  ]
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
