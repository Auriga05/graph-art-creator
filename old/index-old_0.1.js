/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
//
// ==UserScript==
// @name         Precal thing
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  precal thing
// @author       You (not Watanabe)
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  const Calc = null;

  const selection = [];
  let currentlyPressed = [];
  let idSet = false;
  let expressionPos = {
    x: 0,
    y: 0,
  };
  let globalVariables = {};
  let globalVariablesObject = {};
  const shadingData = {
    lastUpperBoundary: {
      x: {
        reference: null,
        value: -Infinity,
      },
      y: {
        reference: null,
        value: -Infinity,
      },
    },
  };

  const defaultExpressions = [
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

  const compatibility = [
    ['x', 'y'],
    ['x'],
    ['y'],
    ['x', 'y'],
    ['x'],
    ['y'],
    ['x', 'y'],
  ];

  const expressions = [
    [ // Circle (x or y)
      { latex: '\\left(x-h_{1}\\right)^{2}+\\left(y-k_{1}\\right)^{2}=r_{1}^{2}', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'r_{1}=\\sqrt{a_{1}^{2}+b_{1}^{2}}', types: ['helper_var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'k_{1}=0', types: ['var'] },
      { latex: 'a_{1}=1', types: ['var'] },
      { latex: 'b_{1}=0', types: ['var'] },
      ...defaultExpressions,
    ],
    [ // Horizontal Parabola (x)
      { latex: '\\left(y-k_{1}\\right)^{2}=4c_{1}\\left(x-h_{1}\\right)', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+d_{1},k_{1}+e_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'k_{1}=0', types: ['helper_var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'e_{1}=1', types: ['var'] },
      { latex: 'd_{1}=1', types: ['var'] },
      { latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}', types: ['var'] },
      ...defaultExpressions,
    ],
    [ // Vertical Parabola (y)
      { latex: '\\left(x-h_{1}\\right)^{2}=4c_{1}\\left(y-k_{1}\\right)', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+e_{1},k_{1}+d_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'k_{1}=0', types: ['var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'e_{1}=1', types: ['var'] },
      { latex: 'd_{1}=1', types: ['var'] },
      { latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}', types: ['helper_var'] },
      ...defaultExpressions,
    ],
    [ // Ellipse (x or y)
      { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}+\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'k_{1}=0', types: ['var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'a_{1}=1', types: ['var'] },
      { latex: 'b_{1}=1', types: ['var'] },
      ...defaultExpressions,
    ],
    [ // Horizontal Hyperbola (x)
      { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+\\sqrt{2}a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'k_{1}=0', types: ['var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'a_{1}=1', types: ['var'] },
      { latex: 'b_{1}=1', types: ['var'] },
      ...defaultExpressions,
    ],
    [ // Vertical Hyperbola (y)
      { latex: '\\frac{\\left(y-k_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(x-h_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
      { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1},k_{1}+a_{1}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(h_{1}+b_{1},k_{1}+\\sqrt{2}a_{1}\\right)', types: ['point', 'hide'] },
      { latex: 'k_{1}=0', types: ['var'] },
      { latex: 'h_{1}=0', types: ['var'] },
      { latex: 'a_{1}=1', types: ['var'] },
      { latex: 'b_{1}=1', types: ['var'] },
      ...defaultExpressions,
    ], // min to ca, max to cb
    [ // Line Segment (x or y)
      { latex: 'y=m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}', types: ['conic'] },
      { latex: '\\left(x_{1a},y_{1a}\\right)', types: ['point', 'hide'] },
      { latex: '\\left(x_{1b},y_{1b}\\right)', types: ['point', 'hide'] },
      { latex: 'x_{1ca}=\\min\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
      { latex: 'x_{1cb}=\\max\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
      { latex: 'm_{1}=\\frac{\\left(y_{1b}-y_{1a}\\right)}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
      { latex: 'b_{1}=y_{1a}-\\frac{\\left(y_{1b}-y_{1a}\\right)x_{1a}}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
      { latex: 'y_{1a}=0', types: ['var'] },
      { latex: 'y_{1b}=1', types: ['var'] },
      { latex: 'x_{1a}=0', types: ['var'] },
      { latex: 'x_{1b}=1', types: ['var'] },
    ],
  ];

  const yExpressions = [
    ['k_{1}+\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}-\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
    ['k_{1}+\\sqrt{4c_{1}\\left(x-h_{1}\\right)}', 'k_{1}-\\sqrt{4c_{1}\\left(x-h_{1}\\right)}'],
    ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}'],
    ['k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
    ['k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}', 'k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}'],
    ['k_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}', 'k_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}'],
    ['m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}'],
  ];

  const xExpressions = [
    ['h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
    ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
    ['h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
    ['h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
    ['h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-b_{1}^{2}}', 'h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-b_{1}^{2}}'],
    ['h_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
    ['x=\\frac{\\left(y-b_{1}\\right)}{m_{1}}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}'],
  ];

  const baseExpressionFormat = [];
  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];
    baseExpressionFormat.push(expression[0].latex);
  }
  let id = 1;

  function getCropType(expression) {
    return 3
          - (expression.latex.includes('\\left\\{x') ? 2 : 0)
          - (expression.latex.includes('\\left\\{y') ? 1 : 0);
  }

  function updateVariables(filter) {
    globalVariables = {};
    globalVariablesObject = {};
    let currExpressions = Calc.getExpressions();
    if (filter) {
      const idFilter = `${filter}_`;
      currExpressions = currExpressions.filter((x) => x.id.startsWith(idFilter));
    }
    for (let i = 0; i < currExpressions.length; i++) {
      const expression = currExpressions[i];
      const analysis = Calc.expressionAnalysis[expression.id];
      if ('evaluation' in analysis) {
        if (analysis.evaluation.type === 'Number') {
          const variable = expression.latex.split('=')[0];
          if (variable.includes('_') && !(['x', 'y'].includes(variable))) {
            let currId = variable.split('_')[1];
            currId = parseInt(currId.slice(1, -1), 10)
              .toString();
            if (currId in globalVariables) {
              globalVariables[currId].push([variable, analysis.evaluation.value.toFixed(3)]);
            } else {
              globalVariables[currId] = [
                [variable, analysis.evaluation.value.toFixed(3)],
              ];
            }
            globalVariablesObject[variable] = analysis.evaluation.value.toFixed(3);
          }
        }
      }
    }
  }

  function fallbackCopyTextToClipboard(text) {
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

  function copyTextToClipboard(text) {
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

  function intersect(array1, array2) {
    return array1.filter((value) => array2.includes(value));
  }

  function doesIntersect(array1, array2) {
    const filteredArray = intersect(array1, array2);
    return (filteredArray.length > 0);
  }

  function getConicType(conic) {
    const split = conic.id.split('_');
    const currId = split[0];
    let type = null;
    for (let i = 0; i < baseExpressionFormat.length; i++) {
      const expressionFormat = baseExpressionFormat[i];
      const newExpression = expressionFormat.replaceAll('_{1', `_{${currId}`);
      if (conic.latex.includes(newExpression)) {
        type = i;
        break;
      }
    }
    return type;
  }

  function typeFilter(expressionList, conicType, types) {
    const ceTypes = expressions[conicType];
    return expressionList.filter((x) => doesIntersect(
      ceTypes[parseInt(x.id.split('_')[1], 10)].types,
      types,
    ));
  }

  function trySetVariable(_latex, variable, _id, value) {
    let newLatex = _latex;
    if (newLatex.includes(`${variable.replace('_{1', `_{${id}`)}=`)) {
      const split = newLatex.split('=');
      split[1] = value;
      newLatex = split.join('=');
    }
    return newLatex;
  }

  function convertToY(expression) {
    const elType = getConicType(expression);
    const latexList = yExpressions[elType];
    const expressionId = expression.id.split('_')[0];
    const newLatexList = [];
    for (let i = 0; i < latexList.length; i++) {
      const latex = latexList[i].replaceAll('_{1', `_{${expressionId}`);
      newLatexList.push(latex);
    }
    return newLatexList;
  }

  function convertToX(expression) {
    const elType = getConicType(expression);
    const latexList = xExpressions[elType];
    const expressionId = expression.id.split('_')[0];
    const newLatexList = [];
    for (let i = 0; i < latexList.length; i++) {
      const latex = latexList[i].replaceAll('_{1', `_{${expressionId}`);
      newLatexList.push(latex);
    }
    return newLatexList;
  }

  function generateBounds(xMin, yMin, xMax, yMax) {
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

  function hasXDomain(cropType) {
    return cropType <= 1;
  }

  function hasYDomain(cropType) {
    return !(cropType % 2);
  }

  function getVariables(currId, conicType) {
    let variableList = {};
    if (conicType === 0) {
      const h = parseFloat(globalVariablesObject[`h_{${currId}}`]);
      const k = parseFloat(globalVariablesObject[`k_{${currId}}`]);
      const r = parseFloat(globalVariablesObject[`r_{${currId}}`]);
      variableList = { h, k, r };
    } else if (conicType === 1) {
      const c = parseFloat(globalVariablesObject[`c_{${currId}}`]);
      const h = parseFloat(globalVariablesObject[`h_{${currId}}`]);
      variableList = { c, h };
    } else if (conicType === 2) {
      const c = parseFloat(globalVariablesObject[`c_{${currId}}`]);
      const k = parseFloat(globalVariablesObject[`k_{${currId}}`]);
      variableList = { c, k };
    } else if (conicType === 3) {
      const h = parseFloat(globalVariablesObject[`h_{${currId}}`]);
      const k = parseFloat(globalVariablesObject[`k_{${currId}}`]);
      const a = Math.abs(parseFloat(globalVariablesObject[`a_{${currId}}`]));
      const b = Math.abs(parseFloat(globalVariablesObject[`b_{${currId}}`]));
      variableList = {
        h, k, a, b,
      };
    }
    return variableList;
  }

  function getDomains(currId) {
    return {
      newXMin: {
        reference: `x_{${currId}ca}`,
        value: parseFloat(globalVariablesObject[`x_{${currId}ca}`]),
      },
      newYMin: {
        reference: `y_{${currId}ca}`,
        value: parseFloat(globalVariablesObject[`y_{${currId}ca}`]),
      },
      newXMax: {
        reference: `x_{${currId}cb}`,
        value: parseFloat(globalVariablesObject[`x_{${currId}cb}`]),
      },
      newYMax: {
        reference: `y_{${currId}cb}`,
        value: parseFloat(globalVariablesObject[`y_{${currId}cb}`]),
      },
    };
  }
  function getBounds(conic, variableList) {
    const conicType = getConicType(conic);
    const currId = conic.id.split('_')[0];
    let {
      newXMin, newYMin, newXMax, newYMax,
    } = getDomains(currId);
    let [xMin, xMax, yMin, yMax] = [-Infinity, -Infinity, Infinity, Infinity];
    const cropType = getCropType(conic);
    if (conicType === 0) {
      const { h, k, r } = variableList;
      xMin = hasXDomain(cropType) ? h - r : -Infinity;
      xMax = hasXDomain(cropType) ? h + r : Infinity;
      yMin = hasYDomain(cropType) ? k - r : -Infinity;
      yMax = hasYDomain(cropType) ? k + r : Infinity;
    } else if (conicType === 1) {
      const { c, h } = variableList;
      xMin = (hasXDomain(cropType) && c > 0) ? h : -Infinity;
      xMax = (hasXDomain(cropType) && c < 0) ? h : Infinity;
      yMin = -Infinity;
      yMax = Infinity;
    } else if (conicType === 2) {
      const { c, k } = variableList;
      xMin = -Infinity;
      xMax = Infinity;
      yMin = (hasYDomain(cropType) && c > 0) ? k : -Infinity;
      yMax = (hasYDomain(cropType) && c < 0) ? k : Infinity;
    } else if (conicType === 3) {
      const {
        h, k, a, b,
      } = variableList;
      xMin = hasXDomain(cropType) ? h - a : -Infinity;
      xMax = hasXDomain(cropType) ? h + a : Infinity;
      yMin = hasYDomain(cropType) ? k - b : -Infinity;
      yMax = hasYDomain(cropType) ? k + b : Infinity;
    }
    if (newXMin.value < xMin) newXMin = { reference: null, value: -Infinity };
    if (newYMin.value < yMin) newYMin = { reference: null, value: -Infinity };
    if (newXMax.value > xMax) newXMax = { reference: null, value: Infinity };
    if (newYMax.value > yMax) newYMax = { reference: null, value: Infinity };
    return {
      newXMin, newYMin, newXMax, newYMax,
    };
  }
  function convertToStandard(conic) {
    let { latex } = conic;
    const conicType = getConicType(conic);
    const currId = conic.id.split('_')[0];
    const currVariables = globalVariables[currId];
    if (conicType === 0) {
      const { h, k, r } = getVariables(currId, conicType);
      const {
        newXMin, newYMin, newXMax, newYMax,
      } = getBounds(conic, { h, k, r });

      const r2 = (globalVariablesObject[`r_{${currId}}`] ** 2).toFixed(4);
      latex = latex.replace(`r_{${currId}}^{2}`, parseFloat(r2));
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
      latex = `${latex.split('\\left\\{')[0]}${generateBounds(newXMin, newYMin, newXMax, newYMax).value}`;
    } else if (conicType === 1) {
      const { c, h } = getVariables(currId, conicType);
      const {
        newXMin, newYMin, newXMax, newYMax,
      } = getBounds(conic, { c, h });

      latex = latex.replace(`4c_{${currId}}`, 4 * globalVariablesObject[`c_{${currId}}`]);
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
      latex = `${latex.split('\\left\\{')[0]}${generateBounds(newXMin, newYMin, newXMax, newYMax).value}`;
    } else if (conicType === 2) {
      const { c, k } = getVariables(currId, conicType);
      const {
        newXMin, newYMin, newXMax, newYMax,
      } = getBounds(conic, { c, k });

      latex = latex.replace(`4c_{${currId}}`, 4 * globalVariablesObject[`c_{${currId}}`]);
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
      latex = `${latex.split('\\left\\{')[0]}${generateBounds(newXMin, newYMin, newXMax, newYMax).value}`;
    } else if (conicType === 3) {
      const {
        h, k, a, b,
      } = getVariables(currId, conicType);
      const {
        newXMin, newYMin, newXMax, newYMax,
      } = getBounds(conic, {
        h, k, a, b,
      });

      const a2 = (a ** 2).toFixed(4);
      const b2 = (b ** 2).toFixed(4);
      latex = latex.replace(`a_{${currId}}^{2}`, parseFloat(a2));
      latex = latex.replace(`b_{${currId}}^{2}`, parseFloat(b2));
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
      latex = `${latex.split('\\left\\{')[0]}${generateBounds(newXMin, newYMin, newXMax, newYMax).value}`;
    } else if (conicType === 4) {
      const a = parseFloat(globalVariablesObject[`a_{${currId}}`]);
      const b = parseFloat(globalVariablesObject[`b_{${currId}}`]);
      const a2 = (a ** 2).toFixed(4);
      const b2 = (b ** 2).toFixed(4);
      latex = latex.replace(`a_{${currId}}^{2}`, parseFloat(a2));
      latex = latex.replace(`b_{${currId}}^{2}`, parseFloat(b2));
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
    } else if (conicType === 5) {
      const a = parseFloat(globalVariablesObject[`a_{${currId}}`]);
      const b = parseFloat(globalVariablesObject[`b_{${currId}}`]);
      const a2 = (a ** 2).toFixed(4);
      const b2 = (b ** 2).toFixed(4);
      latex = latex.replace(`a_{${currId}}^{2}`, parseFloat(a2));
      latex = latex.replace(`b_{${currId}}^{2}`, parseFloat(b2));
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
    } else {
      for (let j = 0; j < currVariables.length; j++) {
        latex = latex.replace(currVariables[j][0], currVariables[j][1]);
      }
    }
    latex = latex.replace('--', '+');
    latex = latex.replace('+-', '-');
    return latex;
  }

  function keyUpHandler(e) {
    if (!idSet) {
      id = Math.max(0, Math.max(...Calc.getExpressions()
        .filter((x) => x.id.includes('_'))
        .map((x) => parseInt(x.id.split('_')[0], 10)))) + 1;
      idSet = true;
    }
    if (currentlyPressed.includes(e.keyCode)) {
      currentlyPressed = currentlyPressed.filter((key) => key !== e.keyCode);
    }
    if (e.ctrlKey && e.shiftKey) {
      const { keyCode } = e;
      if (keyCode === 70) { // F - Finalize
        if (Calc.selectedExpressionId.includes('_')) {
          const currId = Calc.selectedExpressionId.split('_')[0];
          const idFilter = `${currId}_`;
          let filteredExpressions = Calc.getExpressions();
          filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
          let baseExpression = filteredExpressions.filter((x) => x.id.includes('_0'))[0];

          updateVariables(currId);

          const el = JSON.parse(JSON.stringify(baseExpression));
          const latex = convertToStandard(el);
          baseExpression = el;
          baseExpression.latex = latex;
          baseExpression.id = `final_${baseExpression.id}`;
          Calc.removeExpressions(filteredExpressions);
          Calc.setExpression(baseExpression);
        }
      }
    }
    if (e.altKey) {
      const { keyCode } = e;
      if ((keyCode >= 49) && (keyCode <= 56)) {
        const expression = expressions[keyCode - 49];
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
            x: (coordinates.left + coordinates.right) / 2,
            y: (coordinates.top + coordinates.bottom) / 2,
          };

          const verticalSize = (coordinates.top - coordinates.bottom);
          const horizontalSize = (coordinates.right - coordinates.left);
          const size = Math.min(verticalSize, horizontalSize);
          if (keyCode === 55) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1a}', id, expressionPos.x - size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1a}', id, expressionPos.y - size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1b}', id, expressionPos.x + size * 0.2);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1b}', id, expressionPos.y + size * 0.2);
          }
          newExpressionLatex = trySetVariable(newExpressionLatex, 'h_{1}', id, expressionPos.x);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'k_{1}', id, expressionPos.y);
          if (keyCode === 49) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', id, size * 0.3);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', id, 0);
          } else if ((keyCode > 52) && (keyCode !== 55)) {
            newExpressionLatex = trySetVariable(newExpressionLatex, 'a_{1}', id, size * 0.3);
            newExpressionLatex = trySetVariable(newExpressionLatex, 'b_{1}', id, size * 0.3);
          }
          newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cam}', id, -size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cam}', id, -size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'x_{1cbm}', id, size * 0.4);
          newExpressionLatex = trySetVariable(newExpressionLatex, 'y_{1cbm}', id, size * 0.4);
          expressionsToSet.push({
            id: `${id.toString()}_${i}`,
            latex: newExpressionLatex,
            color: 'BLACK',
          });
        }
        id += 1;
        Calc.setExpressions(expressionsToSet);
      } else if (keyCode === 83) { // bottom
        shadingData.lastUpperBoundary.y = {
          reference: null,
          value: -Infinity,
        };
      } else if (keyCode === 48) {
        updateVariables(null);
        (async () => {
          const latexAll = [];
          const allExpressions = Calc.getExpressions();
          for (let i = 1; i < id; i++) {
            const els = allExpressions.filter((x) => x.id === `${i}_0`);
            if (els.length > 0) {
              const el = els[0];
              const latex = convertToStandard(el);
              latexAll.push(latex);
            }
          }
          const a = latexAll.join('\n');
          copyTextToClipboard(a);
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
          const conic = filteredExpressions.filter((x) => x.id.includes('_0'))[0];
          const conicType = getConicType(conic);
          // 0 - default (x and y), 1 - x only, 2 - y only, 3 - no crop
          let cropType = getCropType(conic);
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
          const conic = filteredExpressions.filter((x) => x.id.includes('_0'))[0];
          const conicType = getConicType(conic);
          filteredExpressions = typeFilter(filteredExpressions, conicType, ['hide']);
          let [newExpression] = filteredExpressions;
          const newState = !newExpression.hidden;
          const expressionsToSet = [];
          const cropType = getCropType(conic);
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
  function keyDownHandler(e) {
    if (e.altKey) {
      if (!currentlyPressed.includes(e.keyCode)) {
        currentlyPressed.push(e.keyCode);
      }
    }
  }
  function mouseUpHandler(e) {
    if (currentlyPressed.includes(65)) {
      selection.push({
        id: Calc.selectedExpressionId,
        pos: { x: e.clientX, y: e.clientY },
      });
      if (selection.length >= 2) {
        const upperSelection = selection.pop();
        const lowerSelection = selection.pop();

        const upperId = upperSelection.id;
        const lowerId = lowerSelection.id;

        const slope = (Math.abs(upperSelection.pos.y - lowerSelection.pos.y) + 1)
          / (Math.abs(upperSelection.pos.x - lowerSelection.pos.x) + 1);
        const expressionList = Calc.getExpressions();
        const lowerObject = expressionList.find((expression) => lowerId === expression.id);
        const upperObject = expressionList.find((expression) => upperId === expression.id);

        updateVariables(null);

        const lowerVariables = getVariables(lowerObject.id.split('_')[0]);
        const lowerBounds = getBounds(lowerObject, lowerVariables);

        const upperVariables = getVariables(upperObject.id.split('_')[0]);
        const upperBounds = getBounds(upperObject, upperVariables);

        const lowerComp = compatibility[getConicType(lowerObject)];
        const upperComp = compatibility[getConicType(upperObject)];
        const comp = intersect(lowerComp, upperComp);
        let selectedComp = null;
        if (comp.length === 1) {
          [selectedComp] = comp;
        } else if (comp.length === 2) {
          if (slope > 1) {
            selectedComp = 'y';
          } else {
            selectedComp = 'x';
          }
        }
        console.log(selectedComp);
        if (selectedComp === 'y') {
          let realMin = lowerBounds.newXMin.value < upperBounds.newXMin.value
            ? upperBounds.newXMin : lowerBounds.newXMin;
          if (realMin.value < shadingData.lastUpperBoundary.y.value) {
            realMin = shadingData.lastUpperBoundary.y;
          }
          const realMax = lowerBounds.newXMax.value > upperBounds.newXMax.value
            ? upperBounds.newXMax : lowerBounds.newXMax;
          console.log(realMin, realMax);
          const bounds = generateBounds(
            realMin, { reference: null, value: -Infinity },
            realMax, { reference: null, value: Infinity },
          ).reference;
          shadingData.lastUpperBoundary.y = realMax;
          const newExpression = `${convertToY(lowerObject)[0]}<y<${convertToY(upperObject)[0]}${bounds}`;
          Calc.setExpression({
            latex: newExpression,
          });
        } else if (selectedComp === 'x') {
          let realMin = lowerBounds.newYMin.value < upperBounds.newYMin.value
            ? upperBounds.newYMin : lowerBounds.newYMin;
          if (realMin.value < shadingData.lastUpperBoundary.x.value) {
            realMin = shadingData.lastUpperBoundary.x;
          }
          const realMax = lowerBounds.newYMax.value > upperBounds.newYMax.value
            ? upperBounds.newYMax : lowerBounds.newYMax;
          console.log(realMin, realMax);
          const bounds = generateBounds(
            { reference: null, value: -Infinity }, realMin,
            { reference: null, value: Infinity }, realMax,
          ).reference;
          shadingData.lastUpperBoundary.y = realMax;
          const newExpression = `${convertToX(lowerObject)[0]}<x<${convertToX(upperObject)[0]}${bounds}`;
          Calc.setExpression({
            latex: newExpression,
          });
        }
        console.log(
          lowerComp, lowerBounds,
          upperComp, upperBounds,
        );
      }
    }
  }
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  document.addEventListener('mouseup', mouseUpHandler, false);
})();
