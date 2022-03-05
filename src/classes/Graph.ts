import { MyCalc } from "../index.user"
import { EvaluatexType, LinkedVariable, getIdParts, getGraphType, getDomains, minLinkedVariable, maxLinkedVariable, hasXDomain, hasYDomain } from "../lib/lib"
import { InputBaseExpression, LinkedCoordinate, Bounds, Evaluations, LatexExpression, GraphTypes } from "../types/types"

declare const evaluatex: EvaluatexType

export abstract class Graph implements InputBaseExpression {
  color: string

  hidden: boolean

  id: string

  latex: string

  type: "expression"

  graphId: number

  graphType: number

  label: string

  static defaultExpressionFormat: LatexExpression[] = [
    { latex: '\\left(x_{1cb},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)', types: ['segment', 'delete', 'hide', 'y'] },
    { latex: '\\left(x_{1ca},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)', types: ['segment', 'delete', 'hide', 'y'] },
    { latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1ca}\\right)', types: ['segment', 'delete', 'hide', 'x'] },
    { latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1cb}\\right)', types: ['segment', 'delete', 'hide', 'x'] },
    { latex: '\\left(x_{1cam}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cam}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)', types: ['point', 'delete', 'hide', 'xy'] },
    { latex: '\\left(x_{1cbm}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cbm}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)', types: ['point', 'delete', 'hide', 'xy'] },
    { latex: 'x_{1ca}=x_{1cam}+h_{1}', types: ['helper_var', 'delete'] },
    { latex: 'y_{1ca}=y_{1cam}+k_{1}', types: ['helper_var', 'delete'] },
    { latex: 'x_{1cb}=x_{1cbm}+h_{1}', types: ['helper_var', 'delete'] },
    { latex: 'y_{1cb}=y_{1cbm}+k_{1}', types: ['helper_var', 'delete'] },
    { latex: 'x_{1cam}=0', types: ['var', 'delete'] },
    { latex: 'y_{1cam}=0', types: ['var', 'delete'] },
    { latex: 'x_{1cbm}=0', types: ['var', 'delete'] },
    { latex: 'y_{1cbm}=0', types: ['var', 'delete'] },
  ];

  static yExpressionsEval = [
    ['k_{1}-\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
    ['k_{1}-\\sqrt{4c_{1}\\left(x-h_{1}\\right)}', 'k_{1}+\\sqrt{4c_{1}\\left(x-h_{1}\\right)}'],
    ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}'],
    ['k_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
    ['k_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}'],
    ['k_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}'],
    ['m_{1}\\cdot x+b_{1}'],
  ];
  
  static xExpressionsEval = [
    ['h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
    ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
    ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
    ['h_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
    ['h_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
    ['h_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}', 'h_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}'],
    ['\\frac{\\left(y-b_{1}\\right)}{m_{1}}'],
  ];

  abstract getRelevant(axis: string): number[]

  abstract getEndpoints(): {
    specialPoints: LinkedCoordinate[],
    cropPoints: LinkedCoordinate[]
  }

  abstract getGraphVariables(): {[key: string]: LinkedVariable}

  constructor(expression: InputBaseExpression, graphType?: number) {
    this.color = expression.color;
    this.hidden = expression.hidden;
    this.id = expression.id;
    this.latex = expression.latex;
    this.type = expression.type;
    const id = getIdParts(this.id)
    this.graphId = -1
    if (id.isEditable || id.isFinal) {
      this.graphId = id.graphId
    } else {
      throw Error("Tried to create Graph Object from a non-curve expression")
    }
    this.label = expression.label ? expression.label : ""
    if (graphType) {
      this.graphType = graphType;
    } else {
      this.graphType = getGraphType(expression);
    }
  }

  // return `${A}x^{2}+${C}y^{2}+${D}x+${E}y+${F}=0`;
  toExpression() {
    return {
      id: this.id,
      latex: this.latex,
      type: this.type,
      color: this.color,
      hidden: this.hidden,
    };
  }

  evaluateBounds(variables: any, bounds: {
    xMin: LinkedVariable,
    xMax: LinkedVariable,
    yMin: LinkedVariable,
    yMax: LinkedVariable,
  }) {
    const ya = this.evaluator('y', variables, { x: bounds.xMin });
    const yb = this.evaluator('y', variables, { x: bounds.xMax });
    const xa = this.evaluator('x', variables, { y: bounds.yMin });
    const xb = this.evaluator('x', variables, { y: bounds.yMax });
    return {xa, xb, ya, yb}
  }

  getBoundPoints(domains: Bounds, evaluations: Evaluations) {
    const xPoints = [
      { x: domains.xMin, y: evaluations.ya.min },
      { x: domains.xMin, y: evaluations.ya.max },
      { x: domains.xMax, y: evaluations.yb.min },
      { x: domains.xMax, y: evaluations.yb.max },
    ].filter((point) => Number.isFinite(point.x.value));

    const yPoints = [
      { x: evaluations.xa.min, y: domains.yMin },
      { x: evaluations.xa.max, y: domains.yMin },
      { x: evaluations.xb.min, y: domains.yMax },
      { x: evaluations.xb.max, y: domains.yMax },
    ].filter((point) => Number.isFinite(point.y.value));

    return [...xPoints, ...yPoints]
  }
  getBounds() {
    const { graphId } = this;
    let { xMin, yMin, xMax, yMax } = getDomains(graphId);
    const { specialPoints, cropPoints } = this.getEndpoints();
    const points = [...specialPoints, ...cropPoints];
    const innerPoints = points.filter((point) => (xMin.value <= point.x.value)
      && (point.x.value <= xMax.value)
      && (yMin.value <= point.y.value)
      && (point.y.value <= yMax.value));

    const x1 = minLinkedVariable(innerPoints.map((point) => point.x));
    const x2 = maxLinkedVariable(innerPoints.map((point) => point.x));
    const y1 = minLinkedVariable(innerPoints.map((point) => point.y));
    const y2 = maxLinkedVariable(innerPoints.map((point) => point.y));

    const x1s = minLinkedVariable(specialPoints.map((point) => point.x));
    const x2s = maxLinkedVariable(specialPoints.map((point) => point.x));
    const y1s = minLinkedVariable(specialPoints.map((point) => point.y));
    const y2s = maxLinkedVariable(specialPoints.map((point) => point.y));

    xMin = maxLinkedVariable([xMin, x1]);
    yMin = maxLinkedVariable([yMin, y1]);
    xMax = minLinkedVariable([xMax, x2]);
    yMax = minLinkedVariable([yMax, y2]); 
    const cropType = this.getCropType();

    const {
      xMin: xMinDomain,
      yMin: yMinDomain,
      xMax: xMaxDomain,
      yMax: yMaxDomain,
    } = getDomains(this.graphId);

    xMin = parseFloat(xMinDomain.value.toFixed(MyCalc.precision)) < parseFloat(xMin.value.toFixed(MyCalc.precision)) ? xMin : xMinDomain;
    xMax = parseFloat(xMaxDomain.value.toFixed(MyCalc.precision)) > parseFloat(xMax.value.toFixed(MyCalc.precision)) ? xMax : xMaxDomain;
    yMin = parseFloat(yMinDomain.value.toFixed(MyCalc.precision)) < parseFloat(yMin.value.toFixed(MyCalc.precision)) ? yMin : yMinDomain;
    yMax = parseFloat(yMaxDomain.value.toFixed(MyCalc.precision)) > parseFloat(yMax.value.toFixed(MyCalc.precision)) ? yMax : yMaxDomain;

    xMin = hasXDomain(cropType) ? xMin : MyCalc.linkedVariable(-Infinity);
    xMax = hasXDomain(cropType) ? xMax : MyCalc.linkedVariable(Infinity);
    yMin = hasYDomain(cropType) ? yMin : MyCalc.linkedVariable(-Infinity);
    yMax = hasYDomain(cropType) ? yMax : MyCalc.linkedVariable(Infinity);

    xMin.value -= 10 ** (-MyCalc.precision)
    xMax.value += 10 ** (-MyCalc.precision)
    yMin.value -= 10 ** (-MyCalc.precision)
    yMax.value += 10 ** (-MyCalc.precision)

    return { xMin, yMin, xMax, yMax };
  }

  getCropType() {
    return 3
      - (this.latex.includes('\\left\\{x') ? 2 : 0)
      - (this.latex.includes('\\left\\{y') ? 1 : 0);
  }

  convertToYRelevant() {
    const relevantIndices = this.getRelevant('y');
    const converted = this.convertToY();
    return relevantIndices.map((index) => converted[index]);
  }

  convertToXRelevant() {
    const relevantIndices = this.getRelevant('x');
    const converted = this.convertToX();
    return relevantIndices.map((index) => converted[index]);
  }

  evaluator(
    axis: string,
    _variables: {[key: string]: LinkedVariable},
    input: {[key: string]: LinkedVariable},
  ): { min: LinkedVariable, max: LinkedVariable }
  {
    const variables: {
      [key: string]: number
    } = {};
    const inputAxis = axis === 'x' ? 'y' : 'x';
    Object.entries(_variables)
      .forEach(([key, value]) => {
        variables[key] = value.value;
      });
    variables[inputAxis] = input[inputAxis].value;

    const values = [];
    const expressions = axis === 'x' ? Graph.xExpressionsEval[this.graphType] : Graph.yExpressionsEval[this.graphType];
    for (let i = 0; i < expressions.length; i++) {
      let expression = expressions[i].replaceAll('_{1}', '');
      expression = expression.replaceAll('}\\sqrt{', '}\\cdot\\sqrt{');
      const value = evaluatex(expression, variables)();
      if (value) {
        values.push(MyCalc.linkedVariable(
          `f_{${this.graphId}${axis}${String.fromCharCode(97 + i)}}(${input[inputAxis].reference})`, value,
        ));
      }
    }
    return { min: minLinkedVariable(values), max: maxLinkedVariable(values) };
  }

  getRealBounds() {
    const { graphId } = this;
    let { xMin, yMin, xMax, yMax } = getDomains(graphId);
    let [newXMin, newXMax, newYMin, newYMax] = [
      MyCalc.linkedVariable(-Infinity), MyCalc.linkedVariable(Infinity), MyCalc.linkedVariable(-Infinity), MyCalc.linkedVariable(Infinity),
    ];
    const { specialPoints, cropPoints } = this.getEndpoints();
    const points = [...specialPoints, ...cropPoints];
    const innerPoints = points.filter((point) => (xMin.value <= point.x.value)
      && (point.x.value <= xMax.value)
      && (yMin.value <= point.y.value)
      && (point.y.value <= yMax.value));

    const x1 = minLinkedVariable(innerPoints.map((point) => point.x));
    const x2 = maxLinkedVariable(innerPoints.map((point) => point.x));
    const y1 = minLinkedVariable(innerPoints.map((point) => point.y));
    const y2 = maxLinkedVariable(innerPoints.map((point) => point.y));

    if (y1 !== undefined && y2 !== undefined) {
      newYMin = maxLinkedVariable([y1, newYMin]);
      newYMax = minLinkedVariable([y2, newYMax]);
    }
    if (x1 !== undefined && x2 !== undefined) {
      newXMin = maxLinkedVariable([x1, newXMin]);
      newXMax = minLinkedVariable([x2, newXMax]);
    }

    xMin = maxLinkedVariable([xMin, newXMin]);
    yMin = maxLinkedVariable([yMin, newYMin]);
    xMax = minLinkedVariable([xMax, newXMax]);
    yMax = minLinkedVariable([yMax, newYMax]);
    return { xMin, yMin, xMax, yMax };
  }

  convertToY() {
    const { graphType } = this;
    const latexList: string[] = GraphTypes[graphType].yExpression;
    const newLatexList = [];
    for (let i = 0; i < latexList.length; i++) {
      const latex = latexList[i].replaceAll('_{1', `_{${this.graphId}`);
      newLatexList.push(latex);
    }
    return newLatexList;
  }

  convertToX() {
    const { graphType } = this;
    const latexList: string[] = GraphTypes[graphType].xExpression;
    const newLatexList = [];
    for (let i = 0; i < latexList.length; i++) {
      const latex = latexList[i].replaceAll('_{1', `_{${this.graphId}`);
      newLatexList.push(latex);
    }
    return newLatexList;
  }

  getClosestEndpoint(point: {x: number, y: number}) {
    const endpoints = this.getEndpoints().cropPoints

    const currEndPoint: {
      endpoint: {x: LinkedVariable, y: LinkedVariable} | null,
      currMinSqrMagnitude: number
    } = {
      endpoint: null,
      currMinSqrMagnitude: Infinity,
    };

    endpoints.forEach((endpoint) => {
      const sqrMagnitude = (endpoint.x.value - point.x) ** 2 + (endpoint.y.value - point.y) ** 2;
      if (sqrMagnitude < currEndPoint.currMinSqrMagnitude) {
        currEndPoint.endpoint = endpoint;
        currEndPoint.currMinSqrMagnitude = sqrMagnitude;
      }
    });

    if (currEndPoint.endpoint) {
      return currEndPoint.endpoint
    }
    throw Error('No endpoint found')
  }
}

export interface HasCrop {
  setCropLines: () => void
}