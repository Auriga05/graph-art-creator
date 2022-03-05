import { Graph } from "../classes/Graph";
import { MyCalc } from "../index.user";
import { getCriticalPoints } from "../lib/bezierLib";
import { LinkedVariable, getDomains, getVariable, setVariable } from "../lib/lib";
import { Coordinate } from "../lib/mathLib";
import { Bounds, NumberBounds, InputBaseExpression } from "../types/types";

export type BezierVariables = {
  xa: number
  ya: number
  xb: number
  yb: number
  xc: number
  yc: number
  xd: number
  yd: number 
}

export type BezierData = {
  graphType: 7
  variables: BezierVariables | {[Property in keyof BezierVariables]: LinkedVariable}
  bounds: Bounds | NumberBounds
}
export class Bezier extends Graph implements Initializable {
  static hasCenter = false;
  static hasCrop = false;
  static isConic = false;
  static hasGeneralForm = false;
  static graphType = 7;
  static xExpression: string[] = []
  static yExpression: string[] = []
  static graphTypeName = "bezier"
  static expressionFormat = [
    {latex: `(B_{1x}(t),B_{1y}(t))`, types: ['graph']},
    {latex: `B_{1x}(t)=(1-t)^{3}p_{1xa}+3t(1-t)^{2}p_{1xb}+3t^{2}(1-t)p_{1xc}+t^{3}p_{1xd}`, types: ['function', 'hidden']},
    {latex: `B_{1y}(t)=(1-t)^{3}p_{1ya}+3t(1-t)^{2}p_{1yb}+3t^{2}(1-t)p_{1yc}+t^{3}p_{1yd}`, types: ['function', 'hidden']},
    {latex: `p_{1xa}=0`, types: ['var']},
    {latex: `p_{1xb}=0`, types: ['var']},
    {latex: `p_{1xc}=0`, types: ['var']},
    {latex: `p_{1xd}=0`, types: ['var']},
    {latex: `p_{1ya}=0`, types: ['var']},
    {latex: `p_{1yb}=0`, types: ['var']},
    {latex: `p_{1yc}=0`, types: ['var']},
    {latex: `p_{1yd}=0`, types: ['var']},
    {latex: `(p_{1xa},p_{1ya})`, types: ['point']},
    {latex: `(p_{1xb},p_{1yb})`, types: ['point']},
    {latex: `(p_{1xc},p_{1yc})`, types: ['point']},
    {latex: `(p_{1xd},p_{1yd})`, types: ['point']},
    {latex: `(p_{1xa}+t(p_{1xb}-p_{1xa}),p_{1ya}+t(p_{1yb}-p_{1ya}))`, types: ['handle']},
    {latex: `(p_{1xd}+t(p_{1xc}-p_{1xd}),p_{1yd}+t(p_{1yc}-p_{1yd}))`, types: ['handle']},
    ...Bezier.yExpression.map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...Bezier.xExpression.map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ]
  constructor(expression: InputBaseExpression) {
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
    return ''
  }

  static fromGeneral(variable: any) {
    throw Error("Tried to convert General Conic to Bezier")
  }

  getGraphVariables() {
    const { graphId } = this;
    const xa = MyCalc.linkedVariable(`p_{${graphId}xa}`);
    const xb = MyCalc.linkedVariable(`p_{${graphId}xb}`);
    const xc = MyCalc.linkedVariable(`p_{${graphId}xc}`);
    const xd = MyCalc.linkedVariable(`p_{${graphId}xd}`);
    const ya = MyCalc.linkedVariable(`p_{${graphId}ya}`);
    const yb = MyCalc.linkedVariable(`p_{${graphId}yb}`);
    const yc = MyCalc.linkedVariable(`p_{${graphId}yc}`);
    const yd = MyCalc.linkedVariable(`p_{${graphId}yd}`);
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

  static transformVariables(variables: number[]): BezierVariables {
    const [xa, ya, xb, yb, xc, yc, xd, yd] = variables;
    return { xa, ya, xb, yb, xc, yc, xd, yd }
  }

  static setGraphVariables(variables: BezierVariables | {[Property in keyof BezierVariables]: LinkedVariable}, graphId: number) {
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

  static setDefault(id: number, expressionPos: Coordinate, size: number) : void {
    setVariable(`p_{${id}xa}`, expressionPos.x + size * 0.3);
    setVariable(`p_{${id}ya}`, expressionPos.y + size * 0.3);
    setVariable(`p_{${id}xb}`, expressionPos.x + size * 0.3);
    setVariable(`p_{${id}yb}`, expressionPos.y + size * 0.3);
    setVariable(`p_{${id}xc}`, expressionPos.x + size * 0.3);
    setVariable(`p_{${id}yc}`, expressionPos.y + size * 0.3);
    setVariable(`p_{${id}xd}`, expressionPos.x + size * 0.3);
    setVariable(`p_{${id}yd}`, expressionPos.y + size * 0.3);
  }

  getControlPoints() {
    const { xa, ya, xb, yb, xc, yc, xd, yd } = this.getGraphVariables()
    return {
      p1: {
        x: xa.value,
        y: ya.value,
      },
      p2: {
        x: xb.value,
        y: yb.value,
      },
      p3: {
        x: xc.value,
        y: yc.value,        
      },
      p4: {
        x: xd.value,
        y: yd.value,
      }
    }
  }
}