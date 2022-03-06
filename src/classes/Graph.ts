import { MyCalc } from "../index.user"
import { EvaluatexType, LinkedVariable, getIdParts, getGraphType, getDomains, minValue as minValue, maxValue as maxValue, hasXDomain, hasYDomain, getValue, setValue, getReference } from "../lib/lib"
import { InputBaseExpression, LinkedCoordinate, Bounds, Evaluations, LatexExpression, GraphTypes, Value, BoundsValues } from "../types/types"

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
    ].filter((point) => Number.isFinite(getValue(point.x)));

    const yPoints = [
      { x: evaluations.xa.min, y: domains.yMin },
      { x: evaluations.xa.max, y: domains.yMin },
      { x: evaluations.xb.min, y: domains.yMax },
      { x: evaluations.xb.max, y: domains.yMax },
    ].filter((point) => Number.isFinite(getValue(point.y)));

    return [...xPoints, ...yPoints]
  }
  getBounds() {
    const { graphId } = this;
    let { xMin, yMin, xMax, yMax }: BoundsValues = getDomains(graphId);
    const { specialPoints, cropPoints } = this.getEndpoints();
    const points = [...specialPoints, ...cropPoints];
    const innerPoints = points.filter((point) => (getValue(xMin) <= getValue(point.x))
      && (getValue(point.x) <= getValue(xMax))
      && (getValue(yMin) <= getValue(point.y))
      && (getValue(point.y) <= getValue(yMax)));

    const x1 = minValue(innerPoints.map((point) => point.x));
    const x2 = maxValue(innerPoints.map((point) => point.x));
    const y1 = minValue(innerPoints.map((point) => point.y));
    const y2 = maxValue(innerPoints.map((point) => point.y));

    const x1s = minValue(specialPoints.map((point) => point.x));
    const x2s = maxValue(specialPoints.map((point) => point.x));
    const y1s = minValue(specialPoints.map((point) => point.y));
    const y2s = maxValue(specialPoints.map((point) => point.y));

    xMin = maxValue([xMin, x1]);
    yMin = maxValue([yMin, y1]);
    xMax = minValue([xMax, x2]);
    yMax = minValue([yMax, y2]); 
    const cropType = this.getCropType();

    const {
      xMin: xMinDomain,
      yMin: yMinDomain,
      xMax: xMaxDomain,
      yMax: yMaxDomain,
    } = getDomains(this.graphId);

    xMin = parseFloat(getValue(xMinDomain).toFixed(MyCalc.precision)) < parseFloat(getValue(xMin).toFixed(MyCalc.precision)) ? xMin : xMinDomain;
    xMax = parseFloat(getValue(xMaxDomain).toFixed(MyCalc.precision)) > parseFloat(getValue(xMax).toFixed(MyCalc.precision)) ? xMax : xMaxDomain;
    yMin = parseFloat(getValue(yMinDomain).toFixed(MyCalc.precision)) < parseFloat(getValue(yMin).toFixed(MyCalc.precision)) ? yMin : yMinDomain;
    yMax = parseFloat(getValue(yMaxDomain).toFixed(MyCalc.precision)) > parseFloat(getValue(yMax).toFixed(MyCalc.precision)) ? yMax : yMaxDomain;

    xMin = hasXDomain(cropType) ? xMin : -Infinity;
    xMax = hasXDomain(cropType) ? xMax : Infinity;
    yMin = hasYDomain(cropType) ? yMin : -Infinity;
    yMax = hasYDomain(cropType) ? yMax : Infinity;

    xMin = setValue(xMin, getValue(xMin) - 10 ** (-MyCalc.precision))
    xMax = setValue(xMax, getValue(xMax) + 10 ** (-MyCalc.precision))
    yMin = setValue(yMin, getValue(yMin) - 10 ** (-MyCalc.precision))
    yMax = setValue(yMax, getValue(yMax) + 10 ** (-MyCalc.precision))

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
    _variables: {[key: string]: Value},
    input: {[key: string]: Value},
  ): { min: Value, max: Value }
  {
    const variables: {
      [key: string]: number
    } = {};
    const inputAxis = axis === 'x' ? 'y' : 'x';
    Object.entries(_variables)
      .forEach(([key, value]) => {
        variables[key] = getValue(value);
      });
    variables[inputAxis] = getValue(input[inputAxis]);

    const values = [];
    const expressions = axis === 'x' ? Graph.xExpressionsEval[this.graphType] : Graph.yExpressionsEval[this.graphType];
    for (let i = 0; i < expressions.length; i++) {
      let expression = expressions[i].replaceAll('_{1}', '');
      expression = expression.replaceAll('}\\sqrt{', '}\\cdot\\sqrt{');
      const value = evaluatex(expression, variables)();
      if (value) {
        values.push(MyCalc.linkedVariable(
          `f_{${this.graphId}${axis}${String.fromCharCode(97 + i)}}(${getReference(input[inputAxis])})`, value,
        ));
      }
    }
    return { min: minValue(values), max: maxValue(values) };
  }

  getRealBounds(): BoundsValues {
    const { graphId } = this;
    let { xMin, yMin, xMax, yMax }: BoundsValues = getDomains(graphId);
    let [newXMin, newXMax, newYMin, newYMax]: Value[] = [
      -Infinity, Infinity, -Infinity, Infinity,
    ];
    const { specialPoints, cropPoints } = this.getEndpoints();
    const points = [...specialPoints, ...cropPoints];
    const innerPoints = points.filter((point) => (getValue(xMin) <= getValue(point.x))
      && (getValue(point.x) <= getValue(xMax))
      && (getValue(yMin) <= getValue(point.y))
      && (getValue(point.y) <= getValue(yMax)));

    const x1 = minValue(innerPoints.map((point) => point.x));
    const x2 = maxValue(innerPoints.map((point) => point.x));
    const y1 = minValue(innerPoints.map((point) => point.y));
    const y2 = maxValue(innerPoints.map((point) => point.y));

    if (y1 !== undefined && y2 !== undefined) {
      newYMin = maxValue([y1, newYMin]);
      newYMax = minValue([y2, newYMax]);
    }
    if (x1 !== undefined && x2 !== undefined) {
      newXMin = maxValue([x1, newXMin]);
      newXMax = minValue([x2, newXMax]);
    }

    xMin = maxValue([xMin, newXMin]);
    yMin = maxValue([yMin, newYMin]);
    xMax = minValue([xMax, newXMax]);
    yMax = minValue([yMax, newYMax]);
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
      endpoint: {x: Value, y: Value} | null,
      currMinSqrMagnitude: number
    } = {
      endpoint: null,
      currMinSqrMagnitude: Infinity,
    };

    endpoints.forEach((endpoint) => {
      const sqrMagnitude = (getValue(endpoint.x) - point.x) ** 2 + (getValue(endpoint.y) - point.y) ** 2;
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