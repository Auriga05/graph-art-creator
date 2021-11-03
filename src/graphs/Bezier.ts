import { Graph } from "../classes/Graph";
import { MyCalc } from "../index.user";
import { Expression, getVariable, LinkedVariable, substitute, getDomains, generateBounds, setVariable } from "../lib";
import { Coordinate, getCriticalPoints, subdivideCubic } from "../bezierLib"
import { yExpressions, xExpressions } from "../constants";

export class Bezier extends Graph implements Initializable {
  static hasCenter = false;
  static hasCrop = false;
  static isConic = false;
  static expressionFormat = [
    {latex: `(B_{1x}(t),B_{1y}(t))`, types: ['graph']},
    {latex: `B_{1x}(t)=(1-t)^{3}p_{1xa}+3t(1-t)^{2}p_{1xb}+3t^{2}(1-t)p_{1xc}+t^{3}p_{1xd}`, types: ['function']},
    {latex: `B_{1y}(t)=(1-t)^{3}p_{1ya}+3t(1-t)^{2}p_{1yb}+3t^{2}(1-t)p_{1yc}+t^{3}p_{1yd}`, types: ['function']},
    {latex: `p_{1xa}=0`, types: ['var']},
    {latex: `p_{1xb}=0`, types: ['var']},
    {latex: `p_{1xc}=0`, types: ['var']},
    {latex: `p_{1xd}=0`, types: ['var']},
    {latex: `p_{1ya}=0`, types: ['var']},
    {latex: `p_{1yb}=0`, types: ['var']},
    {latex: `p_{1yc}=0`, types: ['var']},
    {latex: `p_{1yd}=0`, types: ['var']},
    ...yExpressions[7].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[7].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: Expression) {
    super(expression, 7);
  }

  convertToStandard() {
    const { xa, ya, xb, yb, xc, yc, xd, yd } = this.getGraphVariables();
    const criticalPoints = getCriticalPoints(
      {x: xa.value, y: ya.value},
      {x: xb.value, y: yb.value},
      {x: xc.value, y: yc.value},
      {x: xd.value, y: yd.value},
    )
    console.log(criticalPoints)
    return ''
  }

  getGraphVariables() {
    const { graphId } = this;
    const xa = MyCalc.linkedVariable(`p_{${graphId}}xa`);
    const xb = MyCalc.linkedVariable(`p_{${graphId}}xb`);
    const xc = MyCalc.linkedVariable(`p_{${graphId}}xc`);
    const xd = MyCalc.linkedVariable(`p_{${graphId}}xd`);
    const ya = MyCalc.linkedVariable(`p_{${graphId}}ya`);
    const yb = MyCalc.linkedVariable(`p_{${graphId}}yb`);
    const yc = MyCalc.linkedVariable(`p_{${graphId}}yc`);
    const yd = MyCalc.linkedVariable(`p_{${graphId}}yd`);
    return { xa, ya, xb, yb, xc, yc, xd, yd };
  }

  getEndpoints() {
    const { graphId } = this;
    const domains = getDomains(graphId);
    let points: { x: LinkedVariable, y: LinkedVariable } [] = [];
    const variables = this.getGraphVariables();
    const { xa, ya, xb, yb, xc, yc, xd, yd } = variables;

    points = [
      { x: xa, y: ya },
      { x: xb, y: yb },
      { x: xc, y: yc },
      { x: xd, y: yd },
    ];

    return {
      specialPoints: points,
      cropPoints: [],
    };
  }

  getRelevant(axis: string) {
    const { graphType, graphId } = this;
    const { xMin, yMin, xMax, yMax } = this.getRealBounds();
    const relevantIndices = [];
    const h = getVariable(`h_{${graphId}}`);
    if (axis === 'x') {
      if (h < xMax.value) relevantIndices.push(1);
      if (xMin.value < h) relevantIndices.push(0);
    }
    if (axis === 'y') {
      relevantIndices.push(0);
    }
    return relevantIndices;
  }

  static transformVariables(variables: number[]) {
    let [xa, ya, xb, yb, xc, yc, xd, yd] = variables;
    return { xa, ya, xb, yb, xc, yc, xd, yd }
  }

  static setGraphVariables(variables: ReturnType<typeof Bezier.transformVariables>, graphId: number) {
    console.log(variables, graphId)
    const { xa, ya, xb, yb, xc, yc, xd, yd } = variables;
    setVariable(`p_{${graphId}xb}`, xb);
    setVariable(`p_{${graphId}xa}`, xa);
    setVariable(`p_{${graphId}xc}`, xc);
    setVariable(`p_{${graphId}xd}`, xd);
    setVariable(`p_{${graphId}ya}`, ya);
    setVariable(`p_{${graphId}yb}`, yb);
    setVariable(`p_{${graphId}yc}`, yc);
    setVariable(`p_{${graphId}yd}`, yd);
  }

  static setDefault(id: number, expressionPos: {x: number, y: number}, size: number) : void {
    setVariable(`p_{${id}xa}`, size * 0.3);
    setVariable(`p_{${id}ya}`, size * 0.3);
    setVariable(`p_{${id}xb}`, size * 0.3);
    setVariable(`p_{${id}yb}`, size * 0.3);
    setVariable(`p_{${id}xc}`, size * 0.3);
    setVariable(`p_{${id}yc}`, size * 0.3);
    setVariable(`p_{${id}xd}`, size * 0.3);
    setVariable(`p_{${id}yd}`, size * 0.3);
  }
}