// ==UserScript==
// @name         Precal thing
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  precal thing
// @author       You (not Watanabe)
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// @updateURL    https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @downloadURL  https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @require      https://raw.githubusercontent.com/EastDesire/jscolor/master/jscolor.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==


declare var Calc: CalcType;
declare var evaluatex: EvaluatexType;
declare var unsafeWindow: {
  Conic: any
  onload: () => void
  document: any
  toggleArtist: () => void
  changeColor: () => void
};

interface SelectionObject {
  id: string
  pos: {
    x: number
    y: number
  }
}

interface LinkedVariableInterface {
  reference: string | null
  value: number
}

interface Expression {
  [key: string]: any
  fillOpacity ? : string
  color: string
  hidden: boolean
  id: string
  latex: string
  type: string
}

interface ExpressionAnalysis {
  evaluation ? : {
    type: string
    value: number
  }
}

const defaultExpressionFormat = [{
    latex: '\\left(x_{1cb},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)',
    types: ['segment', 'delete', 'hide', 'y'],
  },
  {
    latex: '\\left(x_{1ca},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)',
    types: ['segment', 'delete', 'hide', 'y'],
  },
  {
    latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1ca}\\right)',
    types: ['segment', 'delete', 'hide', 'x'],
  },
  {
    latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1cb}\\right)',
    types: ['segment', 'delete', 'hide', 'x'],
  },
  {
    latex: '\\left(x_{1cam}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cam}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)',
    types: ['point', 'delete', 'hide', 'xy'],
  },
  {
    latex: '\\left(x_{1cbm}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cbm}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)',
    types: ['point', 'delete', 'hide', 'xy'],
  },
  {
    latex: 'x_{1ca}=x_{1cam}+h_{1}',
    types: ['helper_var', 'delete'],
  },
  {
    latex: 'y_{1ca}=y_{1cam}+k_{1}',
    types: ['helper_var', 'delete'],
  },
  {
    latex: 'x_{1cb}=x_{1cbm}+h_{1}',
    types: ['helper_var', 'delete'],
  },
  {
    latex: 'y_{1cb}=y_{1cbm}+k_{1}',
    types: ['helper_var', 'delete'],
  },
  {
    latex: 'x_{1cam}=0',
    types: ['var', 'delete'],
  },
  {
    latex: 'y_{1cam}=0',
    types: ['var', 'delete'],
  },
  {
    latex: 'x_{1cbm}=0',
    types: ['var', 'delete'],
  },
  {
    latex: 'y_{1cbm}=0',
    types: ['var', 'delete'],
  },
];

const compatibility = [
  ['x', 'y'],
  ['x'],
  ['y'],
  ['x', 'y'],
  ['x'],
  ['y'],
  ['x', 'y'],
];

const yExpressions = [
  ['k_{1}-\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\sqrt{4c_{1}\\left(x-h_{1}\\right)}', 'k_{1}+\\sqrt{4c_{1}\\left(x-h_{1}\\right)}'],
  ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}'],
  ['k_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}'],
  ['m_{1}x+b_{1}'],
];

const xExpressions = [
  ['h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
  ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}', 'h_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}'],
  ['\\frac{\\left(y-b_{1}\\right)}{m_{1}}'],
];

const expressionFormat = [
  [ // Circle (x or y)
    {
      latex: '\\left(x-h_{1}\\right)^{2}+\\left(y-k_{1}\\right)^{2}=r_{1}^{2}',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+a_{1},k_{1}+b_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'r_{1}=\\sqrt{a_{1}^{2}+b_{1}^{2}}',
      types: ['helper_var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'k_{1}=0',
      types: ['var'],
    },
    {
      latex: 'a_{1}=1',
      types: ['var'],
    },
    {
      latex: 'b_{1}=0',
      types: ['var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[0].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[0].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ],
  [ // Horizontal Parabola (x)
    {
      latex: '\\left(y-k_{1}\\right)^{2}=4c_{1}\\left(x-h_{1}\\right)',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+d_{1},k_{1}+e_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'k_{1}=0',
      types: ['helper_var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'e_{1}=1',
      types: ['var'],
    },
    {
      latex: 'd_{1}=1',
      types: ['var'],
    },
    {
      latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}',
      types: ['var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[1].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[1].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ],
  [ // Vertical Parabola (y)
    {
      latex: '\\left(x-h_{1}\\right)^{2}=4c_{1}\\left(y-k_{1}\\right)',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+e_{1},k_{1}+d_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'k_{1}=0',
      types: ['var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'e_{1}=1',
      types: ['var'],
    },
    {
      latex: 'd_{1}=1',
      types: ['var'],
    },
    {
      latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}',
      types: ['helper_var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[2].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[2].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ],
  [ // Ellipse (x or y)
    {
      latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}+\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+a_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1},k_{1}+b_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'k_{1}=0',
      types: ['var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'a_{1}=1',
      types: ['var'],
    },
    {
      latex: 'b_{1}=1',
      types: ['var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[3].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[3].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ],
  [ // Horizontal Hyperbola (x)
    {
      latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+a_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+\\sqrt{2}a_{1},k_{1}+b_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'k_{1}=0',
      types: ['var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'a_{1}=1',
      types: ['var'],
    },
    {
      latex: 'b_{1}=1',
      types: ['var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[4].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[4].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ],
  [ // Vertical Hyperbola (y)
    {
      latex: '\\frac{\\left(y-k_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(x-h_{1}\\right)^{2}}{b_{1}^{2}}=1',
      types: ['conic'],
    },
    {
      latex: '\\left(h_{1},k_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1},k_{1}+a_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(h_{1}+b_{1},k_{1}+\\sqrt{2}a_{1}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'k_{1}=0',
      types: ['var'],
    },
    {
      latex: 'h_{1}=0',
      types: ['var'],
    },
    {
      latex: 'a_{1}=1',
      types: ['var'],
    },
    {
      latex: 'b_{1}=1',
      types: ['var'],
    },
    ...defaultExpressionFormat,
    ...yExpressions[5].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[5].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
  ], // min to ca, max to cb
  [ // Line Segment (x or y)
    {
      latex: 'y=m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}',
      types: ['conic'],
    },
    {
      latex: '\\left(x_{1a},y_{1a}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: '\\left(x_{1b},y_{1b}\\right)',
      types: ['point', 'hide'],
    },
    {
      latex: 'x_{1ca}=\\min\\left(x_{1a},x_{1b}\\right)',
      types: ['helper_var'],
    },
    {
      latex: 'x_{1cb}=\\max\\left(x_{1a},x_{1b}\\right)',
      types: ['helper_var'],
    },
    {
      latex: 'm_{1}=\\frac{\\left(y_{1b}-y_{1a}\\right)}{\\left(x_{1b}-x_{1a}\\right)}',
      types: ['helper_var'],
    },
    {
      latex: 'b_{1}=y_{1a}-\\frac{\\left(y_{1b}-y_{1a}\\right)x_{1a}}{\\left(x_{1b}-x_{1a}\\right)}',
      types: ['helper_var'],
    },
    {
      latex: 'y_{1a}=0',
      types: ['var'],
    },
    {
      latex: 'y_{1b}=1',
      types: ['var'],
    },
    {
      latex: 'x_{1a}=0',
      types: ['var'],
    },
    {
      latex: 'x_{1b}=1',
      types: ['var'],
    },
    ...yExpressions[6].map((yExpression, c) => ({
      latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`,
      types: ['y_expression'],
    })),
    ...xExpressions[6].map((xExpression, c) => ({
      latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`,
      types: ['x_expression'],
    })),
    {
      latex: 'y_{1ca}=m_{1}x_{1ca}+b_{1}',
      types: ['helper_var'],
    },
    {
      latex: 'y_{1cb}=m_{1}x_{1cb}+b_{1}',
      types: ['helper_var'],
    }
  ],
];

const baseExpressionFormat: string[] = [];
for (let i = 0; i < expressionFormat.length; i++) {
  const expression = expressionFormat[i];
  baseExpressionFormat.push(expression[0].latex);
}

interface CalcType {
  getExpressions: () => Expression[]
  expressionAnalysis: {
    [key: string]: ExpressionAnalysis
  }
  selectedExpressionId: string
  removeExpressions: (expressions: Expression[]) => void
  setExpressions: (expressions: Expression[]) => void
  setExpression: (expression: Expression) => void
  graphpaperBounds: {
      mathCoordinates: {
        left: number
        right: number
        top: number
        bottom: number
      }
    },
    setState: (state: any) => void
  getState: () => {
    expressions: {
      list: {
        [key: string]: string
      } []
    }
  }
}

type EvaluatexType = (equation: string, variables ? : {
    [key: string]: number
  }) =>
  () => number | undefined


(() => {
  const selection: SelectionObject[] = [];
  let currentlyPressed: number[] = [];
  let idSet = false;
  let shadeIdSet = false;
  let expressionPos = {
    x: 0,
    y: 0,
  };
  let globalVariablesObject: {
    [key: string]: string
  } = {};
  let id = 1;
  let shadeId = 1;

  function getShadeId() {
    return Math.max(...Calc
      .getExpressions()
      .filter((x) => x.id.includes('shade_'))
      .filter((x) => !x.id.includes('folder'))
      .map((x) => parseInt(x.id.split('_')[1], 10)), 0);
  }

  function getVariable(name: string) {
    return parseFloat(globalVariablesObject[name]);
  }

  class LinkedVariable implements LinkedVariableInterface {
    reference: string | null

    value: number

    constructor(reference: string | null, value ? : number) {
      this.reference = reference;
      if (value === undefined) {
        if (reference != null) {
          this.value = getVariable(reference);
        } else {
          throw new Error('Null reference and undefined value');
        }
      } else {
        this.value = value;
      }
    }
  }

  class LinkedExpression extends LinkedVariable {
    variables: {
      [key: string]: LinkedVariable
    }

    constructor(baseReference: string, _variables: {
      [key: string]: LinkedVariable
    }) {
      const variables: {
        [key: string]: number
      } = {};
      let reference = baseReference
      Object.entries(_variables)
        .forEach(([key, value]) => {
          if (value.value !== undefined) {
            variables[key] = value.value;
          }
          if (value.reference) {
            reference = reference.replace(key, value.reference)
          } else if (value.value) {
            reference = reference.replace(key, simplify(value.value, 4))
          }
        });
      const value = evaluatex(baseReference, variables)();
      super(reference, value);
      this.variables = _variables;
    }

    evaluate() {
      const variables: {
        [key: string]: number
      } = {};
      Object.entries(this.variables)
        .forEach(([key, value]) => {
          if (value.value !== undefined) {
            variables[key] = value.value;
          }
        });
      if (this.reference) {
        return evaluatex(this.reference, variables)();
      }
      throw new Error('No reference in LinkedExpression');
    }
  }

  const shadingData: {
    [key: string]: {
      x: LinkedVariable,
      y: LinkedVariable
    }
  } = {
    lastUpperBoundary: {
      x: new LinkedVariable(null, -Infinity),
      y: new LinkedVariable(null, -Infinity),
    },
    lastLowerBoundary: {
      x: new LinkedVariable(null, Infinity),
      y: new LinkedVariable(null, Infinity),
    },
  };

  function maxLinkedVariable(linkedVariables: LinkedVariable[]) {
    let maxVariable = new LinkedVariable(null, -Infinity);
    linkedVariables.forEach((variable) => {
      maxVariable = variable.value > maxVariable.value ? variable : maxVariable;
    });
    return maxVariable;
  }

  function minLinkedVariable(linkedVariables: LinkedVariable[]) {
    let minVariable = new LinkedVariable(null, Infinity);
    linkedVariables.forEach((variable) => {
      minVariable = variable.value < minVariable.value ? variable : minVariable;
    });
    return minVariable;
  }

  function updateVariables(filter ? : string) {
    globalVariablesObject = {};
    let currExpressions = Calc.getExpressions();
    if (filter) {
      const idFilter = `${filter}_`;
      currExpressions = currExpressions.filter((x) => x.id.startsWith(idFilter));
    }
    for (let i = 0; i < currExpressions.length; i++) {
      const expression = currExpressions[i];
      const analysis = Calc.expressionAnalysis[expression.id];
      if (analysis) {
        if (analysis.evaluation) {
          if (analysis.evaluation.type === 'Number') {
            const variable = expression.latex.split('=')[0];
            if (variable.includes('_') && !(['x', 'y'].includes(variable))) {
              globalVariablesObject[variable] = analysis.evaluation.value.toFixed(3);
            }
          }
        }
      }
    }
  }

  function fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log(`Fallback: Copying text command was ${msg}`);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  function copyTextToClipboard(text: string) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Async: Copying to clipboard was successful!');
      }, (err) => {
        console.error('Async: Could not copy text: ', err);
      });
  }

  function intersect(array1: string[], array2: string[]) {
    return array1.filter((value) => array2.includes(value));
  }

  function doesIntersect(array1: string[], array2: string[]) {
    const filteredArray = intersect(array1, array2);
    return (filteredArray.length > 0);
  }

  function typeFilter(expressionList: Expression[], conicType: number, types: string[]) {
    const ceTypes = expressionFormat[conicType];
    return expressionList.filter((x) => doesIntersect(
      ceTypes[parseInt(x.id.split('_')[1], 10)].types,
      types,
    ));
  }

  function trySetVariable(_latex: string, variable: string, _id: number, _value: string | number) {
    const value = _value.toString();
    let newLatex = _latex;
    globalVariablesObject[`${variable.replace('_{1', `_{${_id}`)}`] = value;
    if (newLatex.includes(`${variable.replace('_{1', `_{${_id}`)}=`)) {
      const split = newLatex.split('=');
      split[1] = value;
      newLatex = split.join('=');
    }
    return newLatex;
  }

  function generateBounds(
    xMin: LinkedVariableInterface,
    yMin: LinkedVariableInterface,
    xMax: LinkedVariableInterface,
    yMax: LinkedVariableInterface,
  ) {
    const xBounds = {
      value: '',
      reference: '',
    };
    const yBounds = {
      value: '',
      reference: '',
    };
    if (xMin.value === -Infinity) {
      if (xMax.value !== Infinity) {
        xBounds.value = `\\left\\{x<${xMax.value}\\right\\}`;
        xBounds.reference = `\\left\\{x<${xMax.reference}\\right\\}`;
      }
    } else if (xMax.value === Infinity) {
      xBounds.value = `\\left\\{${xMin.value}<x\\right\\}`;
      xBounds.reference = `\\left\\{${xMin.reference}<x\\right\\}`;
    } else {
      xBounds.value = `\\left\\{${xMin.value}<x<${xMax.value}\\right\\}`;
      xBounds.reference = `\\left\\{${xMin.reference}<x<${xMax.reference}\\right\\}`;
    }

    if (yMin.value === -Infinity) {
      if (yMax.value !== Infinity) {
        yBounds.value = `\\left\\{y<${yMax.value}\\right\\}`;
        yBounds.reference = `\\left\\{y<${yMax.reference}\\right\\}`;
      }
    } else if (yMax.value === Infinity) {
      yBounds.value = `\\left\\{${yMin.value}<y\\right\\}`;
      yBounds.reference = `\\left\\{${yMin.reference}<y\\right\\}`;
    } else {
      yBounds.value = `\\left\\{${yMin.value}<y<${yMax.value}\\right\\}`;
      yBounds.reference = `\\left\\{${yMin.reference}<y<${yMax.reference}\\right\\}`;
    }
    return {
      value: `${xBounds.value}${yBounds.value}`,
      reference: `${xBounds.reference}${yBounds.reference}`,
    };
  }

  function hasXDomain(cropType: number) {
    return cropType <= 1;
  }

  function hasYDomain(cropType: number) {
    return !(cropType % 2);
  }

  function getDomains(currId: number) {
    return {
      xMin: new LinkedVariable(`x_{${currId}ca}`),
      yMin: new LinkedVariable(`y_{${currId}ca}`),
      xMax: new LinkedVariable(`x_{${currId}cb}`),
      yMax: new LinkedVariable(`y_{${currId}cb}`),
    };
  }

  function parseDomains(domains: string[]) {
    let [xMin, yMin, xMax, yMax] = [-Infinity, -Infinity, Infinity, Infinity];
    for (let i = 0; i < domains.length; i++) {
      const latex = domains[i];
      const split = latex.split('<');
      let variable = '';
      if (split.includes('x')) {
        variable = 'x';
      } else if (split.includes('y')) {
        variable = 'y';
      }
      if (variable !== '') {
        if (['x', 'y'].includes(split[0])) { // x < 2
          if (variable === 'x') {
            xMax = parseFloat(split[1]);
          } else if (variable === 'y') {
            yMax = parseFloat(split[1]);
          }
        } else if (['x', 'y'].includes(split[1]) && split.length === 2) { // 2 < x
          if (variable === 'x') {
            xMin = parseFloat(split[0]);
          } else if (variable === 'y') {
            yMin = parseFloat(split[0]);
          }
        } else if (['x', 'y'].includes(split[1]) && split.length === 3) { // 2 < x < 3
          if (variable === 'x') {
            xMin = parseFloat(split[0]);
            xMax = parseFloat(split[2]);
          } else if (variable === 'y') {
            yMin = parseFloat(split[0]);
            yMax = parseFloat(split[2]);
          }
        }
      }
    }
    return {
      xMin,
      xMax,
      yMin,
      yMax,
    };
  }

  function simplify(_number: number, decimalPlaces: number) {
    return parseFloat(_number.toFixed(decimalPlaces))
      .toString();
  }

  function substitute(_latex: string) {
    let latex = _latex;
    const variablesNeeded = [...latex.matchAll(/[a-z]+_{[\w\d]+}/g)];
    for (let j = 0; j < variablesNeeded.length; j++) {
      const variableNeeded = variablesNeeded[j][0];
      latex = latex.replace(variableNeeded, simplify(getVariable(variableNeeded), 4));
    }
    return latex;
  }

  function substituteFromId(_latex: string, _id: string) {
    let latex = _latex;
    const variablesNeeded = [...latex.matchAll(/[a-z]+_{[\w\d]+}/g)];
    for (let j = 0; j < variablesNeeded.length; j++) {
      const variableNeeded = variablesNeeded[j][0];
      if (variableNeeded.includes(`_{${_id}`)) {
        const variableValue = simplify(getVariable(variableNeeded), 4);
        latex = latex.replace(variableNeeded, `(${variableValue})`);
      }
    }
    console.log(latex);
    return latex;
  }

  function substituteParenthesis(_latex: string) {
    let latex = _latex;
    const variablesNeeded = [...latex.matchAll(/[a-z]+_{[\w\d]+}/g)];
    for (let j = 0; j < variablesNeeded.length; j++) {
      const variableNeeded = variablesNeeded[j][0];
      const variableValue = simplify(getVariable(variableNeeded), 4);
      console.log(_latex, variableNeeded, variableValue);
      latex = latex.replace(variableNeeded, `(${variableValue})`);
    }
    return latex;
  }

  function convertFromStandard(latex: string, _id: string) {
    const conicId = parseInt(_id, 10);
    const regex = [
      /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\+\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)/g,
      /\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(x([-+]?\d+\.?\d*)\\right\)/g,
      /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(y([-+]?\d+\.?\d*)\\right\)/g,
      /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}\+\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /y=([-+]?\d+\.?\d*)x([-+]?\d+\.?\d*)\\left\\{([-+]?\d+\.?\d*)<x<([-+]?\d+\.?\d*)\\right\\}/g,
    ];
    const conicType = regex.findIndex((pattern) => pattern.test(latex));
    if (conicType === -1) {
      console.log('fail', latex);
    } else {
      const currRegex = regex[conicType];
      const match = latex.match(currRegex);
      console.log(latex, currRegex);
      if (match) {
        const variables = [...match[0].matchAll(currRegex)][0].slice(1)
          .map((x) => parseFloat(x));
        console.log(latex);
        const domains = [
          ...latex.matchAll(/\\left\\{((?:[-+]?\d+\.?\d*<)?[xy](?:<[-+]?\d+\.?\d*)?)\\right\\}/g),
        ].map((domain) => domain[1]);
        if (domains) {
          let {
            xMin,
            xMax,
            yMin,
            yMax
          } = parseDomains(domains);
          const expression = expressionFormat[conicType];
          const expressionsToSet = [];
          for (let i = 0; i < expression.length; i++) {
            let newExpressionLatex = expression[i].latex;
            newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${conicId}`);
            if (i === 0) {
              if (conicType !== 6) {
                newExpressionLatex += generateBounds(new LinkedVariable(`x_{${conicId}ca}`, xMin), new LinkedVariable(`y_{${conicId}ca}`, yMin), new LinkedVariable(`x_{${conicId}cb}`, xMax), new LinkedVariable(`y_{${conicId}cb}`, yMax))
                  .reference;
              }
            }
            let k = 0;
            let c = 0;
            let h = 0;
            let r = 0;
            let a = 0;
            let b = 0;
            let m = 0;
            let x1 = 0;
            let x2 = 0;
            if (conicType === 0) {
                [h, k, r] = variables;
                h = -h;
                k = -k;
                r = Math.sqrt(Math.abs(r));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', conicId, simplify(r, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', conicId, '0');
                globalVariablesObject[`r_{${conicId}}`] = simplify(r, 4)
            }
            else if (conicType === 1) {
                [k, c, h] = variables;
                h = -h;
                k = -k;
                c /= 4;
                const d = Math.sign(c) / 4;
                const e = Math.sqrt(Math.abs(c));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'd_{1}', conicId, simplify(d, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'e_{1}', conicId, simplify(e, 4));
                globalVariablesObject[`c_{${conicId}}`] = simplify(c, 4)
            }
            else if (conicType === 2) {
                [h, c, k] = variables;
                h = -h;
                k = -k;
                c /= 4;
                const d = Math.sign(c) / 4;
                const e = Math.sqrt(Math.abs(c));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'd_{1}', conicId, simplify(d, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'e_{1}', conicId, simplify(e, 4));
                globalVariablesObject[`c_{${conicId}}`] = simplify(c, 4)
            }
            else if (conicType === 3) {
                [h, a, k, b] = variables;
                h = -h;
                k = -k;
                a = Math.sqrt(Math.abs(a));
                b = Math.sqrt(Math.abs(b));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', conicId, simplify(a, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', conicId, simplify(b, 4));
            }
            else if (conicType === 4) {
                [h, a, k, b] = variables;
                h = -h;
                k = -k;
                a = Math.sqrt(Math.abs(a));
                b = Math.sqrt(Math.abs(b));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', conicId, simplify(a, 4));
                newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', conicId, simplify(b, 4));
            } else if (conicType === 5) {
              [k, a, h, b] = variables;
              h = -h;
              k = -k;
              a = Math.sqrt(Math.abs(a));
              b = Math.sqrt(Math.abs(b));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', conicId, simplify(h, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', conicId, simplify(k, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', conicId, simplify(a, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', conicId, simplify(b, 4));
            } else if (conicType === 6) {
              const [m, b, x1, x2] = variables;
              const y1 = m * x1 + b;
              const y2 = m * x2 + b;
              newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1a}', conicId, simplify(x1, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1a}', conicId, simplify(y1, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1b}', conicId, simplify(x2, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1b}', conicId, simplify(y2, 4));
            }
            if (conicType !== 6) {
              newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cam}', conicId, simplify(xMin - h, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cam}', conicId, simplify(yMin - k, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cbm}', conicId, simplify(xMax - h, 4));
              newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cbm}', conicId, simplify(yMax - k, 4));
              globalVariablesObject[`x_{${conicId}ca}`] = simplify(xMin, 4)
              globalVariablesObject[`y_{${conicId}ca}`] = simplify(yMin, 4)
              globalVariablesObject[`x_{${conicId}cb}`] = simplify(xMax, 4)
              globalVariablesObject[`y_{${conicId}cb}`] = simplify(yMax, 4)
              if (i === 0) {
                const conic = new Conic({
                  id: `${conicId.toString()}_${i}`,
                  latex: newExpressionLatex,
                  color: 'BLACK',
                  hidden: doesIntersect(expression[i].types, ['x_expression', 'y_expression']),
                  type: 'expression',
                })
                console.log(globalVariablesObject)
                let bounds = conic.getRealBounds()
                console.log(bounds)
                if (!Number.isFinite(xMin)) {
                  xMin = bounds.xMin.value - 2;
                }
                if (!Number.isFinite(yMin)) {
                  yMin = bounds.yMin.value - 2;
                }
                if (!Number.isFinite(xMax)) {
                  xMax = bounds.xMax.value + 2;
                }
                if (!Number.isFinite(yMax)) {
                  yMax = bounds.yMax.value + 2;
                }
              }
            }
            expressionsToSet.push({
              id: `${conicId.toString()}_${i}`,
              latex: newExpressionLatex,
              color: 'BLACK',
              hidden: doesIntersect(expression[i].types, ['x_expression', 'y_expression']),
              type: 'expression',
            });
          }
          Calc.setExpressions(expressionsToSet);
        }
      }
    }
  }

  class Conic implements Expression {
    color: string

    hidden: boolean

    id: string

    latex: string

    type: string

    conicId: number

    conicType: number

    constructor(expression: Expression) {
      this.color = expression.color;
      this.hidden = expression.hidden;
      this.id = expression.id;
      this.latex = expression.latex;
      this.type = expression.type;
      this.conicId = parseInt(this.id.split('_')[0], 10);
      this.conicType = this.getConicType();
    }

    toExpression() {
      return {
        id: this.id,
        latex: this.latex,
        type: this.type,
        color: this.color,
        hidden: this.hidden,
      };
    }

    getConicType() {
      let type = null;
      for (let i = 0; i < baseExpressionFormat.length; i++) {
        const currExpressionFormat = baseExpressionFormat[i];
        const newExpression = currExpressionFormat.replaceAll('_{1', `_{${this.conicId}`);
        if (this.latex.includes(newExpression)) {
          type = i;
          break;
        }
      }
      if (type === null) {
        throw new Error('Cannot find conic type');
      } else {
        return type;
      }
    }

    getBounds() {
      const {
        conicType
      } = this;
      const {
        conicId
      } = this;
      let {
        xMin,
        yMin,
        xMax,
        yMax,
      } = getDomains(conicId);
      let [newXMin, newXMax, newYMin, newYMax] = [-Infinity, -Infinity, Infinity, Infinity];
      const cropType = this.getCropType();
      if (conicType === 0) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        const r = getVariable(`r_{${conicId}}`);
        newXMin = h - r;
        newXMax = h + r;
        newYMin = k - r;
        newYMax = k + r;
      } else if (conicType === 1) {
        const c = getVariable(`c_{${conicId}}`);
        const h = getVariable(`h_{${conicId}}`);
        newXMin = (c > 0) ? h : -Infinity;
        newXMax = (c < 0) ? h : Infinity;
        newYMin = -Infinity;
        newYMax = Infinity;
      } else if (conicType === 2) {
        const c = getVariable(`c_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        newXMin = -Infinity;
        newXMax = Infinity;
        newYMin = (c > 0) ? k : -Infinity;
        newYMax = (c < 0) ? k : Infinity;
      } else if (conicType === 3) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        const a = Math.abs(getVariable(`a_{${conicId}}`));
        const b = Math.abs(getVariable(`b_{${conicId}}`));
        newXMin = h - a;
        newXMax = h + a;
        newYMin = k - b;
        newYMax = k + b;
      } else if (conicType === 6) {
        const x1 = new LinkedVariable(`x_{${conicId}ca}`);
        const x2 = new LinkedVariable(`x_{${conicId}cb}`);
        const y1 = new LinkedVariable(`y_{${conicId}ca}`);
        const y2 = new LinkedVariable(`y_{${conicId}cb}`);
        xMin = x1.value < x2.value ? x1 : x2;
        xMax = x1.value < x2.value ? x2 : x1;
        yMin = y1.value < y2.value ? y1 : y2;
        yMax = y1.value < y2.value ? y2 : y1;
      }

      newXMin = hasXDomain(cropType) ? newXMin : -Infinity;
      newXMax = hasXDomain(cropType) ? newXMax : Infinity;
      newYMin = hasYDomain(cropType) ? newYMin : -Infinity;
      newYMax = hasYDomain(cropType) ? newYMax : Infinity;

      if (xMin.value < newXMin) {
        xMin = {
          reference: null,
          value: -Infinity,
        };
      }
      if (yMin.value < newYMin) {
        yMin = {
          reference: null,
          value: -Infinity,
        };
      }
      if (xMax.value > newXMax) {
        xMax = {
          reference: null,
          value: Infinity,
        };
      }
      if (yMax.value > newYMax) {
        yMax = {
          reference: null,
          value: Infinity,
        };
      }
      return {
        xMin,
        yMin,
        xMax,
        yMax,
      };
    }

    getCropType() {
      return 3 -
        (this.latex.includes('\\left\\{x') ? 2 : 0) -
        (this.latex.includes('\\left\\{y') ? 1 : 0);
    }

    convertToStandard() {
      let {
        latex
      } = this;
      const {
        conicType
      } = this;
      const currId = this.conicId;
      const {
        xMin,
        yMin,
        xMax,
        yMax,
      } = this.getBounds();
      if (conicType === 0) {
        const r2 = simplify(getVariable(`r_{${currId}}`) ** 2, 4);
        latex = latex.replace(`r_{${currId}}^{2}`, r2);
        latex = substitute(latex);
        latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
      } else if (conicType === 1) {
        latex = latex.replace(`4c_{${currId}}`, simplify(4 * getVariable(`c_{${currId}}`), 4));
        latex = substitute(latex);
        latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
      } else if (conicType === 2) {
        latex = latex.replace(`4c_{${currId}}`, simplify(4 * getVariable(`c_{${currId}}`), 4));
        latex = substitute(latex);
        latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
      } else if (conicType === 3) {
        const a = getVariable(`a_{${currId}}`);
        const b = getVariable(`b_{${currId}}`);
        const a2 = simplify(a ** 2, 4);
        const b2 = simplify(b ** 2, 4);
        latex = latex.replace(`a_{${currId}}^{2}`, a2);
        latex = latex.replace(`b_{${currId}}^{2}`, b2);
        latex = substitute(latex);
        latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
      } else if (conicType === 4) {
        const a = getVariable(`a_{${currId}}`);
        const b = getVariable(`b_{${currId}}`);
        const a2 = simplify(a ** 2, 4);
        const b2 = simplify(b ** 2, 4);
        latex = latex.replace(`a_{${currId}}^{2}`, a2);
        latex = latex.replace(`b_{${currId}}^{2}`, b2);
        latex = substitute(latex);
      } else if (conicType === 5) {
        const a = getVariable(`a_{${currId}}`);
        const b = getVariable(`b_{${currId}}`);
        const a2 = simplify(a ** 2, 4);
        const b2 = simplify(b ** 2, 4);

        latex = latex.replace(`a_{${currId}}^{2}`, a2);
        latex = latex.replace(`b_{${currId}}^{2}`, b2);
        latex = substitute(latex);
      } else {
        latex = substitute(latex);
      }
      latex = latex.replaceAll('--', '+');
      latex = latex.replaceAll('+-', '-');
      return latex;
    }

    getRelevant(axis: string) {
      const {
        conicType,
        conicId
      } = this;
      const {
        xMin,
        yMin,
        xMax,
        yMax,
      } = this.getRealBounds();
      const relevantIndices = [];
      if (conicType === 0) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        if (axis === 'x') {
          if (h < xMin.value) {
            relevantIndices.push(1);
          } else if (h < xMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (xMax.value < h) {
            relevantIndices.push(0);
          }
        }
        if (axis === 'y') {
          if (k < yMin.value) {
            relevantIndices.push(1);
          } else if (k < yMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (yMax.value < k) {
            relevantIndices.push(0);
          }
        }
      } else if (conicType === 1) {
        const k = getVariable(`k_{${conicId}}`);
        if (axis === 'x') {
          relevantIndices.push(0);
        }
        if (axis === 'y') {
          if (k < yMin.value) {
            relevantIndices.push(1);
          } else if (k < yMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (yMax.value < k) {
            relevantIndices.push(0);
          }
        }
      } else if (conicType === 2) {
        const h = getVariable(`h_{${conicId}}`);
        if (axis === 'x') {
          if (h < xMin.value) {
            relevantIndices.push(1);
          } else if (h < xMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (xMax.value < h) {
            relevantIndices.push(0);
          }
        }
        if (axis === 'y') {
          relevantIndices.push(0);
        }
      } else if (conicType === 3) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        if (axis === 'x') {
          if (h < xMin.value) {
            relevantIndices.push(1);
          } else if (h < xMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (xMax.value < h) {
            relevantIndices.push(0);
          }
        }
        if (axis === 'y') {
          if (k < yMin.value) {
            relevantIndices.push(1);
          } else if (k < yMax.value) {
            relevantIndices.push(0);
            relevantIndices.push(1);
          } else if (yMax.value < k) {
            relevantIndices.push(0);
          }
        }
      } else if (conicType === 4) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        const a = getVariable(`a_{${conicId}}`);
        const b = getVariable(`b_{${conicId}}`);
        if (axis === 'x') {
          if (xMax.value < h + a) {
            relevantIndices.push(0);
          }
          if (xMin.value > h - a) {
            relevantIndices.push(1);
          }
        }
        if (axis === 'y') {
          if (yMax.value < k) {
            relevantIndices.push(0);
          }
          if (yMin.value > k) {
            relevantIndices.push(1);
          }
        }
      } else if (conicType === 5) {
        const h = getVariable(`h_{${conicId}}`);
        const k = getVariable(`k_{${conicId}}`);
        const a = getVariable(`a_{${conicId}}`);
        const b = getVariable(`b_{${conicId}}`);
        if (axis === 'x') {
          if (yMax.value < h) {
            relevantIndices.push(0);
          }
          if (yMin.value > h) {
            relevantIndices.push(1);
          }
        }
        if (axis === 'y') {
          if (yMax.value < k + a) {
            relevantIndices.push(0);
          }
          if (yMin.value > k - a) {
            relevantIndices.push(1);
          }
        }
      } else if (conicType === 6) {
        relevantIndices.push(0);
      }
      return relevantIndices;
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
      _variables: {
        [key: string]: LinkedVariable
      },
      input: {
        [key: string]: LinkedVariable
      },
    ): {
      min: LinkedVariable,
      max: LinkedVariable
    } {
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
      const expressions = axis === 'x' ? xExpressions[this.conicType] : yExpressions[this.conicType];
      for (let i = 0; i < expressions.length; i++) {
        let expression = expressions[i].replaceAll('_{1}', '');
        expression = expression.replaceAll('}\\sqrt{', '}\\cdot\\sqrt{');
        const y1c = evaluatex(expression, variables)();
        if (y1c) {
          values.push(new LinkedVariable(
            `f_{${this.conicId}${axis}${String.fromCharCode(97 + i)}}(${input[inputAxis].reference})`,
            y1c,
          ));
        }
      }
      return {
        min: minLinkedVariable(values),
        max: maxLinkedVariable(values),
      };
    }

    getRealBounds() {
      const {
        conicType,
        conicId
      } = this;
      let {
        xMin,
        yMin,
        xMax,
        yMax,
      } = getDomains(conicId);
      let [newXMin, newXMax, newYMin, newYMax] = [
        new LinkedVariable(null, -Infinity),
        new LinkedVariable(null, Infinity),
        new LinkedVariable(null, -Infinity),
        new LinkedVariable(null, Infinity),
      ];
      let x1: LinkedVariable = xMin;
      let x2: LinkedVariable = xMax;
      let y1: LinkedVariable = yMin;
      let y2: LinkedVariable = yMax;
      let xa = {
        min: new LinkedVariable(null, -Infinity),
        max: new LinkedVariable(null, Infinity),
      };
      let xb = {
        min: new LinkedVariable(null, -Infinity),
        max: new LinkedVariable(null, Infinity),
      };
      let ya = {
        min: new LinkedVariable(null, -Infinity),
        max: new LinkedVariable(null, Infinity),
      };
      let yb = {
        min: new LinkedVariable(null, -Infinity),
        max: new LinkedVariable(null, Infinity),
      };
      let points: {
        x: LinkedVariable,
        y: LinkedVariable
      } [] = [];
      if (conicType === 0) {
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);
        const r = new LinkedVariable(`r_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          r
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          r
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          r
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          r
        }, {
          y: yMax
        });

        points = [{
            x: new LinkedExpression('h-r', {
              h,
              r
            }),
            y: k
          },
          {
            x: h,
            y: new LinkedExpression('k-r', {
              k,
              r
            })
          },
          {
            x: new LinkedExpression('h+r', {
              h,
              r
            }),
            y: k
          },
          {
            x: h,
            y: new LinkedExpression('k+r', {
              k,
              r
            })
          },
        ];
      } else if (conicType === 1) {
        const c = new LinkedVariable(`c_{${conicId}}`);
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          c
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          c
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          c
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          c
        }, {
          y: yMax
        });

        points = [{
            x: new LinkedVariable(null, Infinity),
            y: new LinkedVariable(null, -Infinity)
          },
          {
            x: new LinkedVariable(null, Infinity),
            y: new LinkedVariable(null, Infinity)
          },
          {
            x: h,
            y: k
          },
        ];
      } else if (conicType === 2) {
        const c = new LinkedVariable(`c_{${conicId}}`);
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          c
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          c
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          c
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          c
        }, {
          y: yMax
        });

        points = [{
            x: new LinkedVariable(null, -Infinity),
            y: new LinkedVariable(null, Infinity)
          },
          {
            x: new LinkedVariable(null, Infinity),
            y: new LinkedVariable(null, Infinity)
          },
          {
            x: h,
            y: k
          },
        ];
      } else if (conicType === 3) {
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);
        const a = new LinkedVariable(`a_{${conicId}}`);
        const b = new LinkedVariable(`b_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMax
        });

        points = [{
            x: new LinkedExpression('h-a', {
              h,
              a
            }),
            y: k
          },
          {
            x: h,
            y: new LinkedExpression('k-b', {
              k,
              b
            })
          },
          {
            x: new LinkedExpression('h+a', {
              h,
              a
            }),
            y: k
          },
          {
            x: h,
            y: new LinkedExpression('k+b', {
              k,
              b
            })
          },
        ];
      } else if (conicType === 4) {
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);
        const a = new LinkedVariable(`a_{${conicId}}`);
        const b = new LinkedVariable(`b_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMax
        });

        points = [{
            x: new LinkedExpression('h-a', {
              h,
              a
            }),
            y: k
          },
          {
            x: new LinkedExpression('h+a', {
              h,
              a
            }),
            y: k
          },
        ];
      } else if (conicType === 5) {
        const h = new LinkedVariable(`h_{${conicId}}`);
        const k = new LinkedVariable(`k_{${conicId}}`);
        const a = new LinkedVariable(`a_{${conicId}}`);
        const b = new LinkedVariable(`b_{${conicId}}`);

        ya = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMin
        });
        yb = this.evaluator('y', {
          h,
          k,
          a,
          b
        }, {
          x: xMax
        });
        xa = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMin
        });
        xb = this.evaluator('x', {
          h,
          k,
          a,
          b
        }, {
          y: yMax
        });

        points = [{
            x: h,
            y: new LinkedExpression('k-b', {
              k,
              b
            })
          },
          {
            x: h,
            y: new LinkedExpression('k+b', {
              k,
              b
            })
          },
        ];
      } else if (conicType === 6) {
        x1 = new LinkedVariable(`x_{${conicId}ca}`);
        x2 = new LinkedVariable(`x_{${conicId}cb}`);
        y1 = new LinkedVariable(`y_{${conicId}ca}`);
        y2 = new LinkedVariable(`y_{${conicId}cb}`);
        newXMin = minLinkedVariable([x1, x2]);
        newXMax = maxLinkedVariable([x1, x2]);
        newYMin = minLinkedVariable([y1, y2]);
        newYMax = maxLinkedVariable([y1, y2]);
      }
      let additionalPoints = [
        { x: xMin, y: ya.min },
        { x: xMin, y: ya.max },
        { x: xMax, y: yb.min },
        { x: xMax, y: yb.max },
      ].filter(point => isFinite(point.x.value));
      
      additionalPoints = [
        { x: xa.min, y: yMin },
        { x: xa.max, y: yMin },
        { x: xb.min, y: yMax },
        { x: xb.max, y: yMax },
      ].filter(point => isFinite(point.y.value));
  
      points.push(...additionalPoints);
      const innerPoints = points.filter((point) => (xMin.value <= point.x.value) &&
        (point.x.value <= xMax.value) &&
        (yMin.value <= point.y.value) &&
        (point.y.value <= yMax.value));

      x1 = minLinkedVariable(innerPoints.map((point) => point.x));
      x2 = maxLinkedVariable(innerPoints.map((point) => point.x));
      y1 = minLinkedVariable(innerPoints.map((point) => point.y));
      y2 = maxLinkedVariable(innerPoints.map((point) => point.y));

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
      return {
        xMin,
        yMin,
        xMax,
        yMax,
      };
    }

    convertToY() {
      const {
        conicType
      } = this;
      const latexList = yExpressions[conicType];
      const newLatexList = [];
      for (let i = 0; i < latexList.length; i++) {
        const latex = latexList[i].replaceAll('_{1', `_{${this.conicId}`);
        newLatexList.push(latex);
      }
      return newLatexList;
    }

    convertToX() {
      const {
        conicType
      } = this;
      const latexList = xExpressions[conicType];
      const newLatexList = [];
      for (let i = 0; i < latexList.length; i++) {
        const latex = latexList[i].replaceAll('_{1', `_{${this.conicId}`);
        newLatexList.push(latex);
      }
      return newLatexList;
    }
  }

  unsafeWindow.Conic = Conic;

  function unfinalize(expressionId: string) {
    const currId = expressionId.split('_')[1];
    const filteredExpressions = Calc.getExpressions();
    const baseExpression = filteredExpressions
      .find((x) => x.id === expressionId);
    if (baseExpression) {
      convertFromStandard(baseExpression.latex, currId);
      Calc.removeExpressions([baseExpression]);
    }
  }

  function finalize(expressionId: string) {
    const currId = expressionId.split('_')[0];
    const idFilter = `${currId}_`;
    let filteredExpressions = Calc.getExpressions();
    filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
    const baseExpression = filteredExpressions.filter((x) => x.id.includes('_0'))[0];

    const conic = new Conic(baseExpression);

    const expressionList = [];
    const allExpressions = Calc.getExpressions();
    for (let i = 0; i < allExpressions.length; i++) {
      const expression = allExpressions[i];
      if (expression.latex) {
        const usesVariable = expression.latex.includes(`_{${conic.conicId}`);
        if (usesVariable) {
          expression.latex = substituteFromId(expression.latex, conic.conicId.toString());
          expressionList.push(expression);
        }
      }
    }
    conic.latex = conic.convertToStandard();
    conic.id = `final_${conic.conicId}`;

    expressionList.push(conic.toExpression());
    Calc.setExpressions(expressionList);
    Calc.removeExpressions(filteredExpressions);
  }

  function keyUpHandler(e: KeyboardEvent) {
    updateVariables();
    if (!idSet) {
      id = Math.max(0, Math.max(...Calc.getExpressions()
        .filter((x) => x.id.includes('_'))
        .map((x) => parseInt(x.id.split('_')[0], 10))
        .filter((x) => !Number.isNaN(x)))) + 1;
      idSet = true;
    }
    if (currentlyPressed.includes(e.keyCode)) {
      currentlyPressed = currentlyPressed.filter((key) => key !== e.keyCode);
    }
    if (e.ctrlKey && e.shiftKey) {
      const {
        key,
      } = e;
      if (key === '<') {
        const state = Calc.getState();
        const expression = state.expressions.list
          .filter((_expression) => _expression.id === Calc.selectedExpressionId);
        const multipleExpressions = state.expressions.list
          .filter((_expression) => _expression.id !== Calc.selectedExpressionId);
        state.expressions.list = expression.concat(multipleExpressions);
        Calc.setState(state);
      }
      if (key === 'F') { // F - Finalize
        if (Calc.selectedExpressionId.includes('final_')) {
          unfinalize(Calc.selectedExpressionId)
        } else if (Calc.selectedExpressionId.includes('_')) {
          finalize(Calc.selectedExpressionId)
        }
      }
    }
    if (e.altKey) {
      const {
        keyCode,
      } = e;
      if (keyCode === 67) {
        const selected = Calc.getExpressions()
          .find((x) => x.id === Calc.selectedExpressionId);
        if (selected) {
          selected.color = '#415067';
          selected.fillOpacity = '1';
          Calc.setExpression(selected);
        }
      }
      if (keyCode === 77) {
        const conicExpression = Calc.getExpressions()
          .find((x) => x.id === Calc.selectedExpressionId);
        if (conicExpression) {
          console.log((new Conic(conicExpression))
            .getRealBounds());
        }
      }
      if (keyCode === 219) {
        let toFix: Expression[] = [];
        const negativeab = Calc.getExpressions()
          .filter((x) => /[ab]_{\d*\w+}=-\d+[.]{0,1}\d*/g.test(x.latex)); // Selects ellipse, hyperbola with negative a, b
        toFix = [...toFix, ...negativeab.map((expression) => {
          expression.latex.replaceAll('-', '');
          return expression;
        })];
        Calc.setExpressions(toFix);
      }
      if (keyCode === 189) {
        const state = Calc.getState();
        state.expressions.list = state.expressions.list
          .filter((x) => x.id.includes('shade_'))
          .concat(state.expressions.list.filter((x) => !x.id.includes('shade_')));
        Calc.setState(state);
      } else if (keyCode === 187) {
        const shade = Calc.getExpressions()
          .filter((x) => x.id.includes('shade_'));
        Calc.setExpressions(shade.map((_x) => {
          const x = _x;
          x.hidden = !shade[0].hidden;
          return x;
        }));
      } else if ((keyCode >= 49) && (keyCode <= 56)) {
        const expression = expressionFormat[keyCode - 49];
        const expressionsToSet = [];
        for (let i = 0; i < expression.length; i++) {
          let newExpressionLatex = expression[i].latex;
          if (i === 0) {
            if (keyCode !== 55) {
              newExpressionLatex += '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}\\left\\{y_{1ca}<y<y_{1cb}\\right\\}';
            }
          }
          newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${id}`);
          const coordinates = Calc.graphpaperBounds.mathCoordinates;
          expressionPos = {
            x: parseFloat(((coordinates.left + coordinates.right) / 2).toFixed(4)),
            y: parseFloat(((coordinates.top + coordinates.bottom) / 2).toFixed(4)),
          };

          const verticalSize = (coordinates.top - coordinates.bottom);
          const horizontalSize = (coordinates.right - coordinates.left);
          const size = Math.min(verticalSize, horizontalSize);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', id, expressionPos.x);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', id, expressionPos.y);
          if (keyCode === 49) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', id, size * 0.3);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', id, 0);
          } else if ((keyCode > 52) && (keyCode < 55)) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', id, size * 0.3);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', id, size * 0.3);
          } else if (keyCode === 55) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1a}', id, expressionPos.x - size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1a}', id, expressionPos.y - size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1b}', id, expressionPos.x + size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1b}', id, expressionPos.y + size * 0.2);
          }
          newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cam}', id, -size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cam}', id, -size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cbm}', id, size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cbm}', id, size * 0.4);
          expressionsToSet.push({
            id: `${id.toString()}_${i}`,
            latex: newExpressionLatex,
            color: 'BLACK',
            hidden: doesIntersect(
              expression[i].types,
              ['x_expression', 'y_expression'],
            ),
            type: 'expression',
          });
        }
        id += 1;
        Calc.setExpressions(expressionsToSet);
      } else if (keyCode === 83) { // bottom
        shadingData.lastUpperBoundary = {
          x: {
            reference: null,
            value: -Infinity,
          },
          y: {
            reference: null,
            value: -Infinity,
          },
        };
        shadingData.lastLowerBoundary = {
          x: {
            reference: null,
            value: -Infinity,
          },
          y: {
            reference: null,
            value: -Infinity,
          },
        };
      } else if (keyCode === 48) {
        (async () => {
          const expressions = Calc.getExpressions();
          if (expressions.length !== 1) {
            const conicExpressionsBase = expressions.filter((x) => x.id.includes('_0'));
            const conicExpressionsFinal = expressions.filter((x) => x.id.includes('final_') && !x.id.includes('folder'));
            const conicExpressionsShade = expressions.filter((x) => x.id.includes('shade_') && !x.id.includes('folder'));
            const conicExpressionsBaseLatex = conicExpressionsBase.map((_conicExpression) => {
              const conic = new Conic(_conicExpression);
              conic.id = `final_${conic.conicId}`;
              conic.latex = conic.convertToStandard();
              return conic.toExpression();
            });
            const conicExpressionsFinalLatex = conicExpressionsFinal.map((_conicExpression) => {
              return _conicExpression;
            });
            const conicExpressionsShadeLatex = conicExpressionsShade.map((_conicExpression) => {
              const conicExpression = _conicExpression;
              const latex = substituteParenthesis(conicExpression.latex);
              const expression: Expression = {
                color: conicExpression.color,
                fillOpacity: conicExpression.fillOpacity,
                hidden: false,
                id: conicExpression.id,
                latex: latex,
                type: 'expression',
              }
              return expression;
            });
            const latexAll = [
              ...conicExpressionsShadeLatex,
              ...conicExpressionsBaseLatex,
              ...conicExpressionsFinalLatex,
            ];
            localStorage.setItem('expressions', JSON.stringify(latexAll));
          } else {
            const expressions = localStorage.getItem('expressions')
            if (expressions) {
              Calc.setExpressions(JSON.parse(expressions));
            }
          }
        })();
      } else if (keyCode === 88) {
        if (Calc.selectedExpressionId.includes('_')) {
          const currId = Calc.selectedExpressionId.split('_')[0];
          const idFilter = `${currId}_`;
          let filteredExpressions = Calc.getExpressions();
          filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
          Calc.removeExpressions(filteredExpressions);
        }
      } else if (keyCode === 81) {
        if (Calc.selectedExpressionId.includes('_')) {
          const currId = Calc.selectedExpressionId.split('_')[0];
          const idFilter = `${currId}_`;
          let filteredExpressions = Calc.getExpressions();
          filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter))
            .filter((x) => !x.id.includes('folder'));
          const conicExpression = filteredExpressions.find((x) => x.id.includes('_0'));

          if (!conicExpression) {
            throw new Error();
          }

          const conic = new Conic(conicExpression);
          const {
            conicType
          } = conic;
          // 0 - default (x and y), 1 - x only, 2 - y only, 3 - no crop
          let cropType = conic.getCropType();
          cropType = (cropType + 1) % 4;
          [conic.latex] = conic.latex.split('\\left\\{');
          const addition = (cropType < 2 ? '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}' : '') + (!(cropType % 2) ? '\\left\\{y_{1ca}<y<y_{1cb}\\right\\}' : '');
          conic.latex += addition.replaceAll('_{1', `_{${currId}`);
          const xBoundary = typeFilter(filteredExpressions, conicType, ['x']); // x only domain
          const yBoundary = typeFilter(filteredExpressions, conicType, ['y']); // y only domain
          const xyPoints = typeFilter(filteredExpressions, conicType, ['xy']); // points
          const expressionsToSet = [];
          for (let i = 0; i < xBoundary.length; i++) {
            const expression = xBoundary[i];
            expression.hidden = (cropType % 2 === 1);
            expressionsToSet.push(expression);
          }
          for (let i = 0; i < yBoundary.length; i++) {
            const expression = yBoundary[i];
            expression.hidden = (cropType > 1);
            expressionsToSet.push(expression);
          }
          for (let i = 0; i < xyPoints.length; i++) {
            const expression = xyPoints[i];
            expression.hidden = (cropType === 3);
            expressionsToSet.push(expression);
          }
          expressionsToSet.push(conic);
          Calc.setExpressions(expressionsToSet);
        }
      } else if (keyCode === 72) {
        if (Calc.selectedExpressionId.includes('_')) {
          const idFilter = `${Calc.selectedExpressionId.split('_')[0]}_`;
          let filteredExpressions = Calc.getExpressions();
          filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter))
            .filter((x) => !x.id.includes('folder'));
          const conicExpression = filteredExpressions.find((x) => x.id.includes('_0'));

          if (!conicExpression) {
            throw new Error();
          }

          const conic = new Conic(conicExpression);
          const {
            conicType
          } = conic;
          filteredExpressions = typeFilter(filteredExpressions, conicType, ['hide']);
          let [newExpression] = filteredExpressions;
          const newState = !newExpression.hidden;
          const expressionsToSet = [];
          const cropType = conic.getCropType();
          const xBoundary = typeFilter(filteredExpressions, conicType, ['x']); // x only domain
          const yBoundary = typeFilter(filteredExpressions, conicType, ['y']); // y only domain
          const xyPoints = typeFilter(filteredExpressions, conicType, ['xy']); // points
          const avoidPoints = [
            ...xBoundary.map((exp) => exp.id),
            ...yBoundary.map((exp) => exp.id),
            ...xyPoints.map((exp) => exp.id),
          ];
          if (!newState) {
            for (let i = 0; i < filteredExpressions.length; i++) {
              newExpression = filteredExpressions[i];
              if (!avoidPoints.includes(newExpression.id)) {
                newExpression.hidden = false;
              }
              expressionsToSet.push(newExpression);
            }
            for (let j = 0; j < xBoundary.length; j++) {
              const expression = xBoundary[j];
              expression.hidden = (cropType % 2 === 1);
              expressionsToSet.push(expression);
            }
            for (let j = 0; j < yBoundary.length; j++) {
              const expression = yBoundary[j];
              expression.hidden = (cropType > 1);
              expressionsToSet.push(expression);
            }
            for (let j = 0; j < xyPoints.length; j++) {
              const expression = xyPoints[j];
              expression.hidden = (cropType === 3);
              expressionsToSet.push(expression);
            }
          } else {
            for (let i = 0; i < filteredExpressions.length; i++) {
              newExpression = filteredExpressions[i];
              if ('hidden' in newExpression) {
                newExpression.hidden = newState;
              }
              expressionsToSet.push(newExpression);
            }
          }
          Calc.setExpressions(expressionsToSet);
        }
      }
    }
  }

  function keyDownHandler(e: KeyboardEvent) {
    if (e.altKey) {
      if (!currentlyPressed.includes(e.keyCode)) {
        currentlyPressed.push(e.keyCode);
      }
    }
  }

  function fillInside(expressionId: string) {
    const expressionList = Calc.getExpressions();
    const object = expressionList.find((expression) => expressionId === expression.id);
    if (object) {
      const conic = new Conic(object);
      if ([0, 4].includes(conic.conicType)) {
        conic.latex = conic.latex.replace('=', '>')
      } else if ([1, 2, 3, 5, 6].includes(conic.conicType)) {
        conic.latex = conic.latex.replace('=', '<')
      }
      Calc.setExpression({
        color: 'BLACK',
        hidden: false,
        type: 'expression',
        id: `shade_${shadeId}`,
        latex: conic.latex,
      });
      shadeId += 1
    }
  }

  function fillIntersection(lowerId: string, upperId: string, axis: string) {
    const expressionList = Calc.getExpressions();
    const lowerObject = expressionList.find((expression) => lowerId === expression.id);
    const upperObject = expressionList.find((expression) => upperId === expression.id);

    if (!upperObject || !lowerObject) {
      throw new Error("This shouldn't happen");
    }

    const lowerConic = new Conic(lowerObject);
    const upperConic = new Conic(upperObject);

    const lowerBounds = lowerConic.getRealBounds();
    const upperBounds = upperConic.getRealBounds();

    if (axis === 'y') {
      let realMin = lowerBounds.xMin.value < upperBounds.xMin.value ?
        upperBounds.xMin : lowerBounds.xMin;
      if (realMin.value < shadingData.lastUpperBoundary.y.value) {
        realMin = shadingData.lastUpperBoundary.y;
      }
      const realMax = lowerBounds.xMax.value > upperBounds.xMax.value ?
        upperBounds.xMax : lowerBounds.xMax;

      shadingData.lastUpperBoundary.y = realMax;
      const bounds = generateBounds(
          realMin, {
            reference: null,
            value: -Infinity,
          },
          realMax, {
            reference: null,
            value: Infinity,
          },
        )
        .reference;

      const newExpressions = [];
      const lowerConicConverted = lowerConic.convertToYRelevant();
      const upperConicConverted = upperConic.convertToYRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<y<${currUpperConic}${bounds}`;
          newExpressions.push({
            color: 'BLACK',
            hidden: false,
            type: 'expression',
            id: `shade_${shadeId}`,
            latex: newExpression,
            fillOpacity: '1',
          });
          shadeId += 1;
        }
      }
      Calc.setExpressions(newExpressions);
    } else if (axis === 'x') {
      let realMin = lowerBounds.yMin.value < upperBounds.yMin.value ?
        upperBounds.yMin : lowerBounds.yMin;
      if (realMin.value < shadingData.lastUpperBoundary.x.value) {
        realMin = shadingData.lastUpperBoundary.x;
      }
      const realMax = lowerBounds.yMax.value > upperBounds.yMax.value ?
        upperBounds.yMax : lowerBounds.yMax;

      shadingData.lastUpperBoundary.x = realMax;
      const bounds = generateBounds({
          reference: null,
          value: -Infinity,
        }, realMin, {
          reference: null,
          value: Infinity,
        }, realMax)
        .reference;

      const newExpressions = [];
      const lowerConicConverted = lowerConic.convertToXRelevant();
      const upperConicConverted = upperConic.convertToXRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<x<${currUpperConic}${bounds}`;
          newExpressions.push({
            color: 'BLACK',
            hidden: false,
            type: 'expression',
            id: `shade_${shadeId}`,
            latex: newExpression,
          });
          shadeId += 1;
        }
      }
      console.log(newExpressions);
      Calc.setExpressions(newExpressions);
    }
  }
  function mouseUpHandler(e: MouseEvent) {
    updateVariables();
    if (!shadeIdSet) {
      shadeId = getShadeId() + 1;
      shadeIdSet = true;
    }
    if (currentlyPressed.includes(65)) {
      selection.push({
        id: Calc.selectedExpressionId,
        pos: {
          x: e.clientX,
          y: e.clientY,
        },
      });
      if (selection.length >= 2) {
        const upperSelection = selection.pop();
        const lowerSelection = selection.pop();

        if (!upperSelection || !lowerSelection) {
          throw new Error("This shouldn't happen");
        }

        const slope = (Math.abs(upperSelection.pos.y - lowerSelection.pos.y) + 1) /
          (Math.abs(upperSelection.pos.x - lowerSelection.pos.x) + 1);
        const axis = (slope > 1) ? 'y' : 'x';

        const upperId = upperSelection.id;
        const lowerId = lowerSelection.id;

        if (upperId === lowerId) {
          fillInside(upperId)
        } else {
          fillIntersection(lowerId, upperId, axis)
        }
      }
    }
  }

  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  document.addEventListener('mouseup', mouseUpHandler, false);

  function toggleArtist() {
    const x = unsafeWindow.document.querySelector('#artist');
    if (x.style.display === 'none') {
      x.style.display = 'block';
    } else {
      x.style.display = 'none';
    }
  }

  function changeColor() {
    const x = unsafeWindow.document.querySelector('#artist');
    const expressions = Calc.getExpressions();
    const conicId = Calc.selectedExpressionId;
    const conicExpression = expressions.find((expression) => expression.id === conicId);
    if (conicExpression) {
      const colorForm = $('#colorForm');
      if (colorForm) {
        const data = colorForm.serializeArray();
        data.forEach((pair) => {
          conicExpression[pair.name] = pair.value;
        })
        Calc.setExpression(conicExpression);
      }
    }
  }

  unsafeWindow.toggleArtist = toggleArtist;
  unsafeWindow.changeColor = changeColor;
  unsafeWindow.onload = () => {
    const pillbox = unsafeWindow.document.querySelector('.dcg-overgraph-pillbox-elements');
    if (pillbox) {
      pillbox.insertAdjacentHTML('beforeend', '<div class="dcg-artist-view-container"><div class="dcg-tooltip-hit-area-container"><div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings" role="button" onclick=\'toggleArtist()\' style="background:#ededed"><i class="dcg-icon-wrench" aria-hidden="true"></i></div></div><div style="display: none"></div></div>');
    }

    const body = document.querySelector('.dcg-container');
    if (body) {
      body.insertAdjacentHTML('beforeend', '<div id="artist" style="position: absolute; bottom: 5%; right: 5%; padding: 10px; border: 1px solid black; border-radius: 10px"><form id="colorForm" onSubmit="return changeColor()"><div> Color <input name="color" type="color"></div><div> Opacity <input name="fillOpacity" type="number" min="0" max="1" value="0.4"></div><div><input type="button" value="Apply" onclick="changeColor()"></div></form></div>');
    }
  };
})();