"use strict";
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
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==
const defaultExpressionFormat = [
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
    [
        { latex: '\\left(x-h_{1}\\right)^{2}+\\left(y-k_{1}\\right)^{2}=r_{1}^{2}', types: ['conic'], name: 'conic' },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'r_{1}=\\sqrt{a_{1}^{2}+b_{1}^{2}}', types: ['helper_var'], name: 'r' },
        { latex: 'h_{1}=0', types: ['var'], name: 'h' },
        { latex: 'k_{1}=0', types: ['var'], name: 'k' },
        { latex: 'a_{1}=1', types: ['var'], name: 'a' },
        { latex: 'b_{1}=0', types: ['var'], name: 'b' },
        ...defaultExpressionFormat,
        ...yExpressions[0].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[0].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: '\\left(y-k_{1}\\right)^{2}=4c_{1}\\left(x-h_{1}\\right)', types: ['conic'] },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+d_{1},k_{1}+e_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'k_{1}=0', types: ['helper_var'], name: 'k' },
        { latex: 'h_{1}=0', types: ['var'], name: 'h' },
        { latex: 'e_{1}=1', types: ['var'], name: 'e' },
        { latex: 'd_{1}=1', types: ['var'], name: 'd' },
        { latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
        ...defaultExpressionFormat,
        ...yExpressions[1].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[1].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: '\\left(x-h_{1}\\right)^{2}=4c_{1}\\left(y-k_{1}\\right)', types: ['conic'] },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+e_{1},k_{1}+d_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'k_{1}=0', types: ['var'], name: 'k' },
        { latex: 'h_{1}=0', types: ['var'], name: 'h' },
        { latex: 'e_{1}=1', types: ['var'], name: 'e' },
        { latex: 'd_{1}=1', types: ['var'], name: 'd' },
        { latex: 'c_{1}=\\frac{e_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
        ...defaultExpressionFormat,
        ...yExpressions[2].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[2].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}+\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'k_{1}=0', types: ['var'], name: 'h' },
        { latex: 'h_{1}=0', types: ['var'], name: 'k' },
        { latex: 'a_{1}=1', types: ['var'], name: 'a' },
        { latex: 'b_{1}=1', types: ['var'], name: 'b' },
        ...defaultExpressionFormat,
        ...yExpressions[3].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[3].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+\\sqrt{2}a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'k_{1}=0', types: ['var'], name: 'k' },
        { latex: 'h_{1}=0', types: ['var'], name: 'h' },
        { latex: 'a_{1}=1', types: ['var'], name: 'a' },
        { latex: 'b_{1}=1', types: ['var'], name: 'b' },
        ...defaultExpressionFormat,
        ...yExpressions[4].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[4].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: '\\frac{\\left(y-k_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(x-h_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['conic'] },
        { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1},k_{1}+a_{1}\\right)', types: ['point', 'hide'] },
        { latex: '\\left(h_{1}+b_{1},k_{1}+\\sqrt{2}a_{1}\\right)', types: ['point', 'hide'] },
        { latex: 'k_{1}=0', types: ['var'], name: 'k' },
        { latex: 'h_{1}=0', types: ['var'], name: 'h' },
        { latex: 'a_{1}=1', types: ['var'], name: 'a' },
        { latex: 'b_{1}=1', types: ['var'], name: 'b' },
        ...defaultExpressionFormat,
        ...yExpressions[5].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
        ...xExpressions[5].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    ],
    [
        { latex: 'y=m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}', types: ['conic'] },
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
    ],
];
const expressionNames = expressionFormat.map((expressionList) => {
    const x = {};
    expressionList.forEach((latexExpression, expressionId) => {
        if (latexExpression.name) {
            x[latexExpression.name] = expressionId;
        }
    });
    return x;
});
const baseExpressionFormat = [];
for (let i = 0; i < expressionFormat.length; i++) {
    const expression = expressionFormat[i];
    baseExpressionFormat.push(expression[0].latex);
}
function isConic(expression) {
    return expression.id.endsWith('_0');
}
class MyCalcClass {
    constructor(_Calc) {
        this.Calc = _Calc;
        this.Controller = _Calc.controller;
    }
    getSelected() {
        return this.getExpression(this.selectedExpressionId);
    }
    getExpression(_id) {
        return this.Controller.getItemModel(_id);
    }
    getExpressions() {
        return this.Calc.getExpressions();
    }
    get expressionAnalysis() {
        return this.Calc.expressionAnalysis;
    }
    get selectedExpressionId() {
        return this.Calc.selectedExpressionId;
    }
    removeExpressions(expressions) {
        this.Calc.removeExpressions(expressions);
    }
    setExpressions(expressions) {
        this.Calc.setExpressions(expressions);
    }
    setExpression(expression) {
        this.Calc.setExpression(expression);
    }
    pixelsToMath(point) {
        return this.Calc.pixelsToMath(point);
    }
    get graphpaperBounds() {
        return this.Calc.graphpaperBounds;
    }
    getState() {
        return this.Calc.getState();
    }
    setState(value) {
        return this.Calc.setState(value);
    }
}
let MyCalc;
(() => {
    const selection = [];
    const conicAbbrev = ['C', 'HP', 'VP', 'E', 'HH', 'VH', 'LS'];
    let lastSelectedId = '';
    let currentlyPressed = [];
    let idSet = false;
    let shadeIdSet = false;
    let altTime = 0;
    let expressionPos = { x: 0, y: 0 };
    let globalVariablesObject = {};
    let id = 1;
    let shadeId = 1;
    let currConicId = 0;
    let centerPoint = {
        x: Infinity,
        y: Infinity,
    };
    let lastCenterPoint = {
        x: Infinity,
        y: Infinity,
    };
    function getShadeId() {
        return Math.max(...MyCalc
            .getExpressions()
            .filter((x) => x.id.startsWith('shade_'))
            .filter((x) => !x.id.includes('folder'))
            .map((x) => parseInt(x.id.split('_')[1], 10)), 0);
    }
    function simplify(_number, decimalPlaces) {
        return parseFloat(_number.toFixed(decimalPlaces))
            .toString();
    }
    function getVariable(name) {
        const split = name.split('(');
        if (split.length === 1) {
            return parseFloat(globalVariablesObject[name]);
        }
        if (split.length === 2) {
            console.log(name);
        }
        throw Error('Bruh moment');
    }
    function setVariable(variable, _value) {
        let value = _value;
        if (typeof value === 'number') {
            value = value.toString();
        }
        globalVariablesObject[variable] = value;
    }
    class LinkedVariable {
        constructor(reference, _value) {
            if (typeof reference === 'number') {
                this.reference = null;
                this._value = reference;
            }
            else {
                this.reference = reference;
                if (_value === undefined) {
                    if (reference != null) {
                        this._value = getVariable(reference);
                    }
                    else {
                        throw new Error('Null reference and undefined value');
                    }
                }
                else {
                    this._value = _value;
                }
            }
        }
        get value() {
            if (this.reference) {
                if (this.reference in globalVariablesObject) {
                    return parseFloat(globalVariablesObject[this.reference]);
                }
            }
            return this._value;
        }
        set value(_value) {
            if (this.reference) {
                globalVariablesObject[this.reference] = simplify(_value, 4);
            }
            this._value = _value;
        }
    }
    class LinkedExpression extends LinkedVariable {
        constructor(baseReference, _variables) {
            const variables = {};
            let reference = baseReference;
            Object.entries(_variables)
                .forEach(([key, value]) => {
                if (value.value !== undefined) {
                    variables[key] = value.value;
                }
                if (value.reference) {
                    reference = reference.replace(key, value.reference);
                }
                else if (value.value) {
                    reference = reference.replace(key, simplify(value.value, 4));
                }
            });
            const value = evaluatex(baseReference, variables)();
            super(reference, value);
            this.variables = _variables;
        }
        evaluate() {
            const variables = {};
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
    const shadingData = {
        lastUpperBoundary: {
            x: new LinkedVariable(null, -Infinity),
            y: new LinkedVariable(null, -Infinity),
        },
        lastLowerBoundary: {
            x: new LinkedVariable(null, Infinity),
            y: new LinkedVariable(null, Infinity),
        },
    };
    function maxLinkedVariable(linkedVariables) {
        let maxVariable = new LinkedVariable(null, -Infinity);
        linkedVariables.forEach((variable) => {
            maxVariable = variable.value > maxVariable.value ? variable : maxVariable;
        });
        return maxVariable;
    }
    function minLinkedVariable(linkedVariables) {
        let minVariable = new LinkedVariable(null, Infinity);
        linkedVariables.forEach((variable) => {
            minVariable = variable.value < minVariable.value ? variable : minVariable;
        });
        return minVariable;
    }
    function updateVariables(filter) {
        globalVariablesObject = {};
        let currExpressions = MyCalc.getExpressions();
        if (filter) {
            const idFilter = `${filter}_`;
            currExpressions = currExpressions.filter((x) => x.id.startsWith(idFilter));
        }
        for (let i = 0; i < currExpressions.length; i++) {
            const expression = currExpressions[i];
            const analysis = MyCalc.expressionAnalysis[expression.id];
            if (analysis) {
                if (analysis.evaluation) {
                    if (analysis.evaluation.type === 'Number') {
                        const variable = expression.latex.split('=')[0];
                        if (variable.includes('_') && !(['x', 'y'].includes(variable))) {
                            globalVariablesObject[variable] = analysis.evaluation.value.toFixed(3);
                        }
                    }
                }
                else if (expression.latex) {
                    if (expression.latex.includes('f_')) {
                        // console.log(expression);
                    }
                }
            }
        }
    }
    function intersect(array1, array2) {
        return array1.filter((value) => array2.includes(value));
    }
    function doesIntersect(array1, array2) {
        const filteredArray = intersect(array1, array2);
        return (filteredArray.length > 0);
    }
    function typeFilter(expressionList, conicType, types) {
        const ceTypes = expressionFormat[conicType];
        return expressionList.filter((x) => doesIntersect(ceTypes[parseInt(x.id.split('_')[1], 10)].types, types));
    }
    function trySetVariable(_latex, variable, _id, _value) {
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
    function generateBounds(xMin, yMin, xMax, yMax) {
        const xBounds = { value: '', reference: '' };
        const yBounds = { value: '', reference: '' };
        if (xMin.value === -Infinity) {
            if (xMax.value !== Infinity) {
                xBounds.value = `\\left\\{x<${xMax.value}\\right\\}`;
                xBounds.reference = `\\left\\{x<${xMax.reference}\\right\\}`;
            }
        }
        else if (xMax.value === Infinity) {
            xBounds.value = `\\left\\{${xMin.value}<x\\right\\}`;
            xBounds.reference = `\\left\\{${xMin.reference}<x\\right\\}`;
        }
        else {
            xBounds.value = `\\left\\{${xMin.value}<x<${xMax.value}\\right\\}`;
            xBounds.reference = `\\left\\{${xMin.reference}<x<${xMax.reference}\\right\\}`;
        }
        if (yMin.value === -Infinity) {
            if (yMax.value !== Infinity) {
                yBounds.value = `\\left\\{y<${yMax.value}\\right\\}`;
                yBounds.reference = `\\left\\{y<${yMax.reference}\\right\\}`;
            }
        }
        else if (yMax.value === Infinity) {
            yBounds.value = `\\left\\{${yMin.value}<y\\right\\}`;
            yBounds.reference = `\\left\\{${yMin.reference}<y\\right\\}`;
        }
        else {
            yBounds.value = `\\left\\{${yMin.value}<y<${yMax.value}\\right\\}`;
            yBounds.reference = `\\left\\{${yMin.reference}<y<${yMax.reference}\\right\\}`;
        }
        return { value: `${xBounds.value}${yBounds.value}`, reference: `${xBounds.reference}${yBounds.reference}` };
    }
    function hasXDomain(cropType) {
        return cropType <= 1;
    }
    function hasYDomain(cropType) {
        return !(cropType % 2);
    }
    function getDomains(currId) {
        return {
            xMin: new LinkedVariable(`x_{${currId}ca}`),
            yMin: new LinkedVariable(`y_{${currId}ca}`),
            xMax: new LinkedVariable(`x_{${currId}cb}`),
            yMax: new LinkedVariable(`y_{${currId}cb}`),
        };
    }
    function parseDomains(domains) {
        let [xMin, yMin, xMax, yMax] = [-Infinity, -Infinity, Infinity, Infinity];
        for (let i = 0; i < domains.length; i++) {
            const latex = domains[i];
            const split = latex.split('<');
            let variable = '';
            if (split.includes('x')) {
                variable = 'x';
            }
            else if (split.includes('y')) {
                variable = 'y';
            }
            if (variable !== '') {
                if (['x', 'y'].includes(split[0])) { // x < 2
                    if (variable === 'x') {
                        xMax = parseFloat(split[1]);
                    }
                    else if (variable === 'y') {
                        yMax = parseFloat(split[1]);
                    }
                }
                else if (['x', 'y'].includes(split[1]) && split.length === 2) { // 2 < x
                    if (variable === 'x') {
                        xMin = parseFloat(split[0]);
                    }
                    else if (variable === 'y') {
                        yMin = parseFloat(split[0]);
                    }
                }
                else if (['x', 'y'].includes(split[1]) && split.length === 3) { // 2 < x < 3
                    if (variable === 'x') {
                        xMin = parseFloat(split[0]);
                        xMax = parseFloat(split[2]);
                    }
                    else if (variable === 'y') {
                        yMin = parseFloat(split[0]);
                        yMax = parseFloat(split[2]);
                    }
                }
            }
        }
        return { xMin, xMax, yMin, yMax };
    }
    function evaluateExpression() {
    }
    function evaluateFunction(_function, variables) {
        //
    }
    function findById() {
    }
    function minMax(variables) {
        return {
            min: minLinkedVariable(variables),
            max: maxLinkedVariable(variables),
        };
    }
    function substitute(_latex) {
        let latex = _latex;
        const variablesNeeded = [...latex.matchAll(/[a-z]+_{[\w\d]+}(?:\((.*)\))?/g)];
        for (let j = 0; j < variablesNeeded.length; j++) {
            if (variablesNeeded[j].length === 3) { // function
                const functionName = variablesNeeded[j][1];
                const variables = variablesNeeded[j][2].split(',');
                console.log(functionName, variables);
            }
            const variableNeeded = variablesNeeded[j][0];
            latex = latex.replace(variableNeeded, simplify(getVariable(variableNeeded), 4));
        }
        return latex;
    }
    function substituteFromId(_latex, _id) {
        let latex = _latex;
        const variablesNeeded = [...latex.matchAll(/[a-z]+_{[\w\d]+}/g)];
        for (let j = 0; j < variablesNeeded.length; j++) {
            const variableNeeded = variablesNeeded[j][0];
            if (variableNeeded.includes(`_{${_id}`)) {
                const variableValue = simplify(getVariable(variableNeeded), 4);
                latex = latex.replace(variableNeeded, `(${variableValue})`);
                console.log(variableNeeded, variableValue);
            }
        }
        console.log(latex);
        return latex;
    }
    function substituteParenthesis(_latex) {
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
    class Conic {
        constructor(expression) {
            this.color = expression.color;
            this.hidden = expression.hidden;
            this.id = expression.id;
            this.latex = expression.latex;
            this.type = expression.type;
            this.conicId = parseInt(this.id.split('_')[0], 10);
            this.conicType = this.getConicType();
        }
        // return `${A}x^{2}+${C}y^{2}+${D}x+${E}y+${F}=0`;
        getGeneralForm() {
            let A = 0;
            let C = 0;
            let D = 0;
            let E = 0;
            let F = 0;
            if (this.conicType === 0) { // Circle
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const r = getVariable(`r_{${this.conicId}}`);
                A = 1;
                C = 1;
                D = -2 * h;
                E = -2 * k;
                F = k ** 2 + h ** 2 - r ** 2;
            }
            else if (this.conicType === 1) { // Horizontal Parabola
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const c = getVariable(`c_{${this.conicId}}`);
                A = 0;
                C = 1;
                D = -4 * c;
                E = -2 * k;
                F = 4 * c * h + k ** 2;
            }
            else if (this.conicType === 2) { // Vertical Parabola
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const c = getVariable(`c_{${this.conicId}}`);
                A = 1;
                C = 0;
                D = -2 * h;
                E = -4 * c;
                F = 4 * c * k + h ** 2;
            }
            else if (this.conicType === 3) { // Circle
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const a = getVariable(`a_{${this.conicId}}`);
                const b = getVariable(`b_{${this.conicId}}`);
                A = b ** 2;
                C = a ** 2;
                D = -2 * h * b ** 2;
                E = -2 * k * a ** 2;
                F = b ** 2 * h ** 2 + a ** 2 * k ** 2 - a ** 2 * b ** 2;
            }
            else if (this.conicType === 4) { // Circle
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const a = getVariable(`a_{${this.conicId}}`);
                const b = getVariable(`b_{${this.conicId}}`);
                A = b ** 2;
                C = -(a ** 2);
                D = -2 * h * b ** 2;
                E = 2 * k * a ** 2;
                F = b ** 2 * h ** 2 - a ** 2 * k ** 2 - a ** 2 * b ** 2;
            }
            else if (this.conicType === 5) { // Circle
                const h = getVariable(`h_{${this.conicId}}`);
                const k = getVariable(`k_{${this.conicId}}`);
                const a = getVariable(`a_{${this.conicId}}`);
                const b = getVariable(`b_{${this.conicId}}`);
                // (y - k)^2 * a^2 - (x - h)^2 * b^2 = a^2 * b^2
                // a^2(y^2 - 2ky + k^2) - b^2(x^2 - 2hx + h^2) = a^2 * b^2
                A = -(b ** 2);
                C = a ** 2;
                D = 2 * h * b ** 2;
                E = -2 * k * a ** 2;
                F = a ** 2 * k ** 2 - b ** 2 * h ** 2 - a ** 2 * b ** 2;
            }
            else if (this.conicType === 6) { // Circle
                const m = getVariable(`m_{${this.conicId}}`);
                const b = getVariable(`b_{${this.conicId}}`);
                A = 0;
                C = 0;
                D = m;
                E = 0;
                F = b;
            }
            return {
                A: parseFloat(simplify(A, 4)),
                C: parseFloat(simplify(C, 4)),
                D: parseFloat(simplify(D, 4)),
                E: parseFloat(simplify(E, 4)),
                F: parseFloat(simplify(F, 4)),
            };
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
            }
            else {
                return type;
            }
        }
        getBounds() {
            let { xMin, yMin, xMax, yMax } = this.getRealBounds();
            const cropType = this.getCropType();
            const { xMin: xMinDomain, yMin: yMinDomain, xMax: xMaxDomain, yMax: yMaxDomain, } = getDomains(this.conicId);
            xMin = xMinDomain.value < xMin.value ? new LinkedVariable(-Infinity) : xMinDomain;
            xMax = xMaxDomain.value > xMax.value ? new LinkedVariable(Infinity) : xMaxDomain;
            yMin = yMinDomain.value < yMin.value ? new LinkedVariable(-Infinity) : yMinDomain;
            yMax = yMaxDomain.value > yMax.value ? new LinkedVariable(Infinity) : yMaxDomain;
            xMin = hasXDomain(cropType) ? xMin : new LinkedVariable(-Infinity);
            xMax = hasXDomain(cropType) ? xMax : new LinkedVariable(Infinity);
            yMin = hasYDomain(cropType) ? yMin : new LinkedVariable(-Infinity);
            yMax = hasYDomain(cropType) ? yMax : new LinkedVariable(Infinity);
            return { xMin, yMin, xMax, yMax };
        }
        getCropType() {
            return 3
                - (this.latex.includes('\\left\\{x') ? 2 : 0)
                - (this.latex.includes('\\left\\{y') ? 1 : 0);
        }
        convertToStandard() {
            let { latex } = this;
            const { conicType } = this;
            const currId = this.conicId;
            const { xMin, yMin, xMax, yMax } = this.getBounds();
            console.log(this, this.getBounds());
            if (conicType === 0) {
                const r2 = simplify(getVariable(`r_{${currId}}`) ** 2, 4);
                latex = latex.replace(`r_{${currId}}^{2}`, r2);
                latex = substitute(latex);
                latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
            }
            else if (conicType === 1) {
                latex = latex.replace(`4c_{${currId}}`, simplify(4 * getVariable(`c_{${currId}}`), 4));
                latex = substitute(latex);
                latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
            }
            else if (conicType === 2) {
                latex = latex.replace(`4c_{${currId}}`, simplify(4 * getVariable(`c_{${currId}}`), 4));
                latex = substitute(latex);
                latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
            }
            else if (conicType === 3) {
                const a = getVariable(`a_{${currId}}`);
                const b = getVariable(`b_{${currId}}`);
                const a2 = simplify(a ** 2, 4);
                const b2 = simplify(b ** 2, 4);
                latex = latex.replace(`a_{${currId}}^{2}`, a2);
                latex = latex.replace(`b_{${currId}}^{2}`, b2);
                latex = substitute(latex);
                latex = `${latex.split('\\left\\{')[0]}${generateBounds(xMin, yMin, xMax, yMax).value}`;
            }
            else if (conicType === 4) {
                const a = getVariable(`a_{${currId}}`);
                const b = getVariable(`b_{${currId}}`);
                const a2 = simplify(a ** 2, 4);
                const b2 = simplify(b ** 2, 4);
                latex = latex.replace(`a_{${currId}}^{2}`, a2);
                latex = latex.replace(`b_{${currId}}^{2}`, b2);
                latex = substitute(latex);
            }
            else if (conicType === 5) {
                const a = getVariable(`a_{${currId}}`);
                const b = getVariable(`b_{${currId}}`);
                const a2 = simplify(a ** 2, 4);
                const b2 = simplify(b ** 2, 4);
                latex = latex.replace(`a_{${currId}}^{2}`, a2);
                latex = latex.replace(`b_{${currId}}^{2}`, b2);
                latex = substitute(latex);
            }
            else {
                latex = substitute(latex);
            }
            latex = latex.replaceAll('--', '+');
            latex = latex.replaceAll('+-', '-');
            return latex;
        }
        getRelevant(axis) {
            const { conicType, conicId } = this;
            const { xMin, yMin, xMax, yMax } = this.getRealBounds();
            const relevantIndices = [];
            if (conicType === 0) {
                const h = getVariable(`h_{${conicId}}`);
                const k = getVariable(`k_{${conicId}}`);
                if (axis === 'x') {
                    if (h < xMax.value)
                        relevantIndices.push(1);
                    if (xMin.value < h)
                        relevantIndices.push(0);
                }
                if (axis === 'y') {
                    if (k < yMax.value)
                        relevantIndices.push(1);
                    if (yMin.value < k)
                        relevantIndices.push(0);
                }
            }
            else if (conicType === 1) {
                const k = getVariable(`k_{${conicId}}`);
                if (axis === 'x') {
                    relevantIndices.push(0);
                }
                if (axis === 'y') {
                    if (k < yMax.value)
                        relevantIndices.push(1);
                    if (yMin.value < k)
                        relevantIndices.push(0);
                }
            }
            else if (conicType === 2) {
                const h = getVariable(`h_{${conicId}}`);
                if (axis === 'x') {
                    if (h < xMax.value)
                        relevantIndices.push(1);
                    if (xMin.value < h)
                        relevantIndices.push(0);
                }
                if (axis === 'y') {
                    relevantIndices.push(0);
                }
            }
            else if (conicType === 3) {
                const h = getVariable(`h_{${conicId}}`);
                const k = getVariable(`k_{${conicId}}`);
                if (axis === 'x') {
                    if (h < xMax.value)
                        relevantIndices.push(1);
                    if (xMin.value < h)
                        relevantIndices.push(0);
                }
                if (axis === 'y') {
                    if (k < yMax.value)
                        relevantIndices.push(1);
                    if (yMin.value < k)
                        relevantIndices.push(0);
                }
            }
            else if (conicType === 4) {
                const h = getVariable(`h_{${conicId}}`);
                const k = getVariable(`k_{${conicId}}`);
                const a = getVariable(`a_{${conicId}}`);
                const b = getVariable(`b_{${conicId}}`);
                if (axis === 'x') {
                    if (xMax.value < h + a)
                        relevantIndices.push(0);
                    if (xMin.value > h - a)
                        relevantIndices.push(1);
                }
                if (axis === 'y') {
                    if (yMax.value < k)
                        relevantIndices.push(0);
                    if (yMin.value > k)
                        relevantIndices.push(1);
                }
            }
            else if (conicType === 5) {
                const h = getVariable(`h_{${conicId}}`);
                const k = getVariable(`k_{${conicId}}`);
                const a = getVariable(`a_{${conicId}}`);
                const b = getVariable(`b_{${conicId}}`);
                if (axis === 'x') {
                    if (yMax.value < h)
                        relevantIndices.push(0);
                    if (yMin.value > h)
                        relevantIndices.push(1);
                }
                if (axis === 'y') {
                    if (yMax.value < k + a)
                        relevantIndices.push(0);
                    if (yMin.value > k - a)
                        relevantIndices.push(1);
                }
            }
            else if (conicType === 6) {
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
        evaluator(axis, _variables, input) {
            const variables = {};
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
                    values.push(new LinkedVariable(`f_{${this.conicId}${axis}${String.fromCharCode(97 + i)}}(${input[inputAxis].reference})`, y1c));
                }
            }
            return { min: minLinkedVariable(values), max: maxLinkedVariable(values) };
        }
        getRealBounds() {
            const { conicType, conicId } = this;
            let { xMin, yMin, xMax, yMax } = getDomains(conicId);
            let [newXMin, newXMax, newYMin, newYMax] = [
                new LinkedVariable(null, -Infinity), new LinkedVariable(null, Infinity), new LinkedVariable(null, -Infinity), new LinkedVariable(null, Infinity),
            ];
            let x1 = xMin;
            let x2 = xMax;
            let y1 = yMin;
            let y2 = yMax;
            let xa = { min: new LinkedVariable(-Infinity), max: new LinkedVariable(Infinity) };
            let xb = { min: new LinkedVariable(-Infinity), max: new LinkedVariable(Infinity) };
            let ya = { min: new LinkedVariable(-Infinity), max: new LinkedVariable(Infinity) };
            let yb = { min: new LinkedVariable(-Infinity), max: new LinkedVariable(Infinity) };
            let points = [];
            if (conicType === 0) {
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                const r = new LinkedVariable(`r_{${conicId}}`);
                ya = this.evaluator('y', { h, k, r }, { x: xMin });
                yb = this.evaluator('y', { h, k, r }, { x: xMax });
                xa = this.evaluator('x', { h, k, r }, { y: yMin });
                xb = this.evaluator('x', { h, k, r }, { y: yMax });
                points = [
                    { x: new LinkedExpression('h-r', { h, r }), y: k },
                    { x: h, y: new LinkedExpression('k-r', { k, r }) },
                    { x: new LinkedExpression('h+r', { h, r }), y: k },
                    { x: h, y: new LinkedExpression('k+r', { k, r }) },
                ];
            }
            else if (conicType === 1) {
                const c = new LinkedVariable(`c_{${conicId}}`);
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                ya = this.evaluator('y', { h, k, c }, { x: xMin });
                yb = this.evaluator('y', { h, k, c }, { x: xMax });
                xa = this.evaluator('x', { h, k, c }, { y: yMin });
                xb = this.evaluator('x', { h, k, c }, { y: yMax });
                points = [{ x: new LinkedVariable(null, Infinity), y: new LinkedVariable(null, -Infinity) },
                    { x: new LinkedVariable(null, Infinity), y: new LinkedVariable(null, Infinity) },
                    { x: h, y: k },
                ];
            }
            else if (conicType === 2) {
                const c = new LinkedVariable(`c_{${conicId}}`);
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                ya = this.evaluator('y', { h, k, c }, { x: xMin });
                yb = this.evaluator('y', { h, k, c }, { x: xMax });
                xa = this.evaluator('x', { h, k, c }, { y: yMin });
                xb = this.evaluator('x', { h, k, c }, { y: yMax });
                points = [{ x: new LinkedVariable(null, -Infinity), y: new LinkedVariable(null, Infinity) },
                    { x: new LinkedVariable(null, Infinity), y: new LinkedVariable(null, Infinity) },
                    { x: h, y: k },
                ];
            }
            else if (conicType === 3) {
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                const a = new LinkedVariable(`a_{${conicId}}`);
                const b = new LinkedVariable(`b_{${conicId}}`);
                ya = this.evaluator('y', { h, k, a, b }, { x: xMin });
                yb = this.evaluator('y', { h, k, a, b }, { x: xMax });
                xa = this.evaluator('x', { h, k, a, b }, { y: yMin });
                xb = this.evaluator('x', { h, k, a, b }, { y: yMax });
                points = [{ x: new LinkedExpression('h-a', { h, a }), y: k },
                    { x: h, y: new LinkedExpression('k-b', { k, b }) },
                    { x: new LinkedExpression('h+a', { h, a }), y: k },
                    { x: h, y: new LinkedExpression('k+b', { k, b }) },
                ];
            }
            else if (conicType === 4) {
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                const a = new LinkedVariable(`a_{${conicId}}`);
                const b = new LinkedVariable(`b_{${conicId}}`);
                ya = this.evaluator('y', { h, k, a, b }, { x: xMin });
                yb = this.evaluator('y', { h, k, a, b }, { x: xMax });
                xa = this.evaluator('x', { h, k, a, b }, { y: yMin });
                xb = this.evaluator('x', { h, k, a, b }, { y: yMax });
                console.log(xa, xb, ya, yb);
                points = [{ x: new LinkedExpression('h-a', { h, a }), y: k },
                    { x: new LinkedExpression('h+a', { h, a }), y: k },
                ];
            }
            else if (conicType === 5) {
                const h = new LinkedVariable(`h_{${conicId}}`);
                const k = new LinkedVariable(`k_{${conicId}}`);
                const a = new LinkedVariable(`a_{${conicId}}`);
                const b = new LinkedVariable(`b_{${conicId}}`);
                ya = this.evaluator('y', { h, k, a, b }, { x: xMin });
                yb = this.evaluator('y', { h, k, a, b }, { x: xMax });
                xa = this.evaluator('x', { h, k, a, b }, { y: yMin });
                xb = this.evaluator('x', { h, k, a, b }, { y: yMax });
                points = [{ x: h, y: new LinkedExpression('k-b', { k, b }) },
                    { x: h, y: new LinkedExpression('k+b', { k, b }) },
                ];
            }
            else if (conicType === 6) {
                x1 = new LinkedVariable(`x_{${conicId}ca}`);
                x2 = new LinkedVariable(`x_{${conicId}cb}`);
                y1 = new LinkedVariable(`y_{${conicId}ca}`);
                y2 = new LinkedVariable(`y_{${conicId}cb}`);
                xa = minMax([x1, x2]);
                xb = minMax([x1, x2]);
                ya = minMax([y1, y2]);
                yb = minMax([y1, y2]);
            }
            let additionalPoints = [
                { x: xMin, y: ya.min },
                { x: xMin, y: ya.max },
                { x: xMax, y: yb.min },
                { x: xMax, y: yb.max },
            ].filter((point) => Number.isFinite(point.x.value));
            points.push(...additionalPoints);
            additionalPoints = [
                { x: xa.min, y: yMin },
                { x: xa.max, y: yMin },
                { x: xb.min, y: yMax },
                { x: xb.max, y: yMax },
            ].filter((point) => Number.isFinite(point.y.value));
            points.push(...additionalPoints);
            const innerPoints = points.filter((point) => (xMin.value <= point.x.value)
                && (point.x.value <= xMax.value)
                && (yMin.value <= point.y.value)
                && (point.y.value <= yMax.value));
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
            return { xMin, yMin, xMax, yMax };
        }
        convertToY() {
            const { conicType } = this;
            const latexList = yExpressions[conicType];
            const newLatexList = [];
            for (let i = 0; i < latexList.length; i++) {
                const latex = latexList[i].replaceAll('_{1', `_{${this.conicId}`);
                newLatexList.push(latex);
            }
            return newLatexList;
        }
        convertToX() {
            const { conicType } = this;
            const latexList = xExpressions[conicType];
            const newLatexList = [];
            for (let i = 0; i < latexList.length; i++) {
                const latex = latexList[i].replaceAll('_{1', `_{${this.conicId}`);
                newLatexList.push(latex);
            }
            return newLatexList;
        }
    }
    function getDomainsFromLatex(latex) {
        return [
            ...latex.matchAll(/\\left\\{((?:[-+]?\d+\.?\d*<)?[xy](?:<[-+]?\d+\.?\d*)?)\\right\\}/g),
        ].map((domain) => domain[1]);
    }
    function transformVariables(conicType, variables) {
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
        }
        if (conicType === 1) {
            [k, c, h] = variables;
            h = -h;
            k = -k;
            c /= 4;
        }
        if (conicType === 2) {
            [h, c, k] = variables;
            h = -h;
            k = -k;
            c /= 4;
        }
        if (conicType === 3) {
            [h, a, k, b] = variables;
            h = -h;
            k = -k;
            a = Math.sqrt(Math.abs(a));
            b = Math.sqrt(Math.abs(b));
        }
        if (conicType === 4) {
            [h, a, k, b] = variables;
            h = -h;
            k = -k;
            a = Math.sqrt(Math.abs(a));
            b = Math.sqrt(Math.abs(b));
        }
        if (conicType === 5) {
            [k, a, h, b] = variables;
            h = -h;
            k = -k;
            a = Math.sqrt(Math.abs(a));
            b = Math.sqrt(Math.abs(b));
        }
        if (conicType === 6) {
            [m, b, x1, x2] = variables;
        }
        return { k, c, h, r, a, b, m, x1, x2 };
    }
    function toId(expression, _id) {
        return expression.replace(/_\{\d+([a-z]*)}/g, `_{${_id}$1}`);
    }
    function createWithBounds(conicId, conicType, variables, _bounds) {
        let { xMin, yMin, xMax, yMax } = _bounds;
        const expression = expressionFormat[conicType];
        const expressionsToSet = [];
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
            ({ h, k, r } = variables);
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`a_{${conicId}}`, simplify(r, 4));
            setVariable(`b_{${conicId}}`, '0');
            setVariable(`r_{${conicId}}`, simplify(r, 4));
        }
        else if (conicType === 1) {
            ({ k, c, h } = variables);
            const d = Math.sign(c) / 4;
            const e = Math.sqrt(Math.abs(c));
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`d_{${conicId}}`, simplify(d, 4));
            setVariable(`e_{${conicId}}`, simplify(e, 4));
            setVariable(`c_{${conicId}}`, simplify(c, 4));
        }
        else if (conicType === 2) {
            ({ h, c, k } = variables);
            const d = Math.sign(c) / 4;
            const e = Math.sqrt(Math.abs(c));
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`d_{${conicId}}`, simplify(d, 4));
            setVariable(`e_{${conicId}}`, simplify(e, 4));
            globalVariablesObject[`c_{${conicId}}`] = simplify(c, 4);
        }
        else if (conicType === 3) {
            ({ h, a, k, b } = variables);
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`a_{${conicId}}`, simplify(a, 4));
            setVariable(`b_{${conicId}}`, simplify(b, 4));
        }
        else if (conicType === 4) {
            ({ h, a, k, b } = variables);
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`a_{${conicId}}`, simplify(a, 4));
            setVariable(`b_{${conicId}}`, simplify(b, 4));
        }
        else if (conicType === 5) {
            ({ k, a, h, b } = variables);
            setVariable(`h_{${conicId}}`, simplify(h, 4));
            setVariable(`k_{${conicId}}`, simplify(k, 4));
            setVariable(`a_{${conicId}}`, simplify(a, 4));
            setVariable(`b_{${conicId}}`, simplify(b, 4));
        }
        else if (conicType === 6) {
            ({ m, b, x1, x2 } = variables);
            const y1 = m * x1 + b;
            const y2 = m * x2 + b;
            setVariable(`x_{${conicId}a}`, simplify(x1, 4));
            setVariable(`y_{${conicId}a}`, simplify(y1, 4));
            setVariable(`x_{${conicId}b}`, simplify(x2, 4));
            setVariable(`y_{${conicId}b}`, simplify(y2, 4));
        }
        if (conicType !== 6) {
            setVariable(`x_{${conicId}cam}`, simplify(xMin - h, 4));
            setVariable(`y_{${conicId}cam}`, simplify(yMin - k, 4));
            setVariable(`x_{${conicId}cbm}`, simplify(xMax - h, 4));
            setVariable(`y_{${conicId}cbm}`, simplify(yMax - k, 4));
            setVariable(`x_{${conicId}ca}`, simplify(xMin, 4));
            setVariable(`y_{${conicId}ca}`, simplify(yMin, 4));
            setVariable(`x_{${conicId}cb}`, simplify(xMax, 4));
            setVariable(`y_{${conicId}cb}`, simplify(yMax, 4));
        }
        for (let i = 0; i < expression.length; i++) {
            const newExpression = expression[i];
            let newExpressionLatex = newExpression.latex;
            newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${conicId}`);
            if (doesIntersect(newExpression.types, ['var'])) {
                const [variable] = newExpressionLatex.split('=');
                const value = globalVariablesObject[toId(variable, id)];
                newExpressionLatex = `${variable}=${value}`;
            }
            if (conicType !== 6) {
                if (i === 0) {
                    newExpressionLatex += generateBounds(new LinkedVariable(`x_{${conicId}ca}`, xMin), new LinkedVariable(`y_{${conicId}ca}`, yMin), new LinkedVariable(`x_{${conicId}cb}`, xMax), new LinkedVariable(`y_{${conicId}cb}`, yMax))
                        .reference;
                    const conic = new Conic({ id: `${conicId.toString()}_${i}`, latex: newExpressionLatex, color: 'BLACK', hidden: doesIntersect(expression[i].types, ['x_expression', 'y_expression']), type: 'expression' });
                    console.log(globalVariablesObject);
                    const bounds = conic.getRealBounds();
                    console.log(bounds);
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
                    setVariable(`x_{${conicId}cam}`, simplify(xMin - h, 4));
                    setVariable(`y_{${conicId}cam}`, simplify(yMin - k, 4));
                    setVariable(`x_{${conicId}cbm}`, simplify(xMax - h, 4));
                    setVariable(`y_{${conicId}cbm}`, simplify(yMax - k, 4));
                    setVariable(`x_{${conicId}ca}`, simplify(xMin, 4));
                    setVariable(`y_{${conicId}ca}`, simplify(yMin, 4));
                    setVariable(`x_{${conicId}cb}`, simplify(xMax, 4));
                    setVariable(`y_{${conicId}cb}`, simplify(yMax, 4));
                }
            }
            expressionsToSet.push({ id: `${conicId.toString()}_${i}`, latex: newExpressionLatex, color: 'BLACK', hidden: doesIntersect(expression[i].types, ['x_expression', 'y_expression']), type: 'expression' });
        }
        MyCalc.setExpressions(expressionsToSet);
    }
    function convertFromStandard(latex, _id) {
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
        }
        else {
            const currRegex = regex[conicType];
            const match = latex.match(currRegex);
            console.log(latex, currRegex);
            if (match) {
                const variables = [...match[0].matchAll(currRegex)][0].slice(1)
                    .map((x) => parseFloat(x));
                const domains = getDomainsFromLatex(latex);
                if (domains) {
                    const bounds = parseDomains(domains);
                    createWithBounds(conicId, conicType, transformVariables(conicType, variables), bounds);
                }
            }
        }
    }
    function unfinalizeConvert(expressionId) {
        const regex = /y=([-+]?(?:\d+\.?\d*)?)\\sqrt\{([-+]?\d+\.?\d*)\+\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}([-+]?\d+\.?\d*)/g;
        const expression = MyCalc.getExpressions().find((_expression) => _expression.id === expressionId);
        if (expression) {
            const variables = [...expression.latex.matchAll(regex)][0].slice(1);
            if (variables.length) {
                const [_a, _b, _h, _k] = variables;
                const a = parseFloat(_a === '-' ? '-1' : _a);
                const b = parseFloat(_b);
                const h = -parseFloat(_h);
                const k = parseFloat(_k);
                const a2 = b * a ** 2;
                const b2 = b;
                const { xMin: _xMin, xMax: _xMax, yMin: _yMin, yMax: _yMax } = parseDomains(getDomainsFromLatex(expression.latex));
                const xMin = Math.max(-Infinity, _xMin);
                const xMax = Math.min(Infinity, _xMax);
                if (a < 0) { // down
                    const yMin = Math.max(-Infinity, _yMin);
                    const yMax = Math.min(k, _yMax);
                    if (b < 0) { // horizontal hyperbola
                        createWithBounds(id, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
                    }
                    else if (b > 0) { // vertical hyperbola
                        createWithBounds(id, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
                    }
                }
                else if (a > 0) { // up
                    const yMin = Math.max(k, _yMin);
                    const yMax = Math.min(Infinity, _yMax);
                    if (b < 0) { // horizontal hyperbola
                        createWithBounds(id, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
                    }
                    else if (b > 0) { // vertical parabola
                        createWithBounds(id, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
                    }
                }
            }
        }
    }
    function unfinalize(expressionId) {
        const currId = expressionId.split('_')[1];
        const filteredExpressions = MyCalc.getExpressions();
        const baseExpression = filteredExpressions
            .find((x) => x.id === expressionId);
        if (baseExpression) {
            convertFromStandard(baseExpression.latex, currId);
            MyCalc.removeExpressions([baseExpression]);
        }
    }
    function finalize(expressionId) {
        const currId = expressionId.split('_')[0];
        const hasSameId = MyCalc.getExpressions().find((x) => x.id === `final_${currId}`);
        const idFilter = `${currId}_`;
        let filteredExpressions = MyCalc.getExpressions();
        filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
        const baseExpression = filteredExpressions.filter((x) => x.id.endsWith('_0'))[0];
        const conic = new Conic(baseExpression);
        const expressionList = [];
        const allExpressions = MyCalc.getExpressions();
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
        if (hasSameId) {
            conic.id = `final_${id}`;
            id += 1;
        }
        else {
            conic.id = `final_${conic.conicId}`;
        }
        expressionList.push(conic.toExpression());
        MyCalc.setExpressions(expressionList);
        MyCalc.removeExpressions(filteredExpressions);
    }
    function createConic(conicType) {
        const expression = expressionFormat[conicType];
        const expressionsToSet = [];
        const coordinates = MyCalc.graphpaperBounds.mathCoordinates;
        expressionPos = { x: parseFloat(((coordinates.left + coordinates.right) / 2).toFixed(4)), y: parseFloat(((coordinates.top + coordinates.bottom) / 2).toFixed(4)) };
        const verticalSize = (coordinates.top - coordinates.bottom);
        const horizontalSize = (coordinates.right - coordinates.left);
        const size = Math.min(verticalSize, horizontalSize);
        setVariable(`h_{${id}}`, expressionPos.x);
        setVariable(`k_{${id}}`, expressionPos.y);
        if (conicType === 0) {
            setVariable(`a_{${id}}`, size * 0.3);
            setVariable(`b_{${id}}`, 0);
        }
        else if (conicType === 1) {
            setVariable(`e_{${id}}`, size * 0.3);
            setVariable(`d_{${id}}`, size * 0.3);
        }
        else if (conicType === 2) {
            setVariable(`e_{${id}}`, size * 0.3);
            setVariable(`d_{${id}}`, size * 0.3);
        }
        else if (conicType === 3) {
            setVariable(`a_{${id}}`, size * 0.3);
            setVariable(`b_{${id}}`, size * 0.2);
        }
        else if (conicType === 4) {
            setVariable(`a_{${id}}`, size * 0.2);
            setVariable(`b_{${id}}`, size * 0.2);
        }
        else if (conicType === 5) {
            setVariable(`a_{${id}}`, size * 0.2);
            setVariable(`b_{${id}}`, size * 0.2);
        }
        else if (conicType === 6) {
            setVariable(`x_{${id}a}`, expressionPos.x - size * 0.2);
            setVariable(`y_{${id}a}`, expressionPos.y - size * 0.2);
            setVariable(`x_{${id}b}`, expressionPos.x + size * 0.2);
            setVariable(`y_{${id}b}`, expressionPos.y + size * 0.2);
        }
        if (conicType !== 6) {
            setVariable(`x_{${id}cam}`, -size * 0.4);
            setVariable(`y_{${id}cam}`, -size * 0.4);
            setVariable(`x_{${id}cbm}`, size * 0.4);
            setVariable(`y_{${id}cbm}`, size * 0.4);
        }
        for (let i = 0; i < expression.length; i++) {
            const newExpression = expression[i];
            let newExpressionLatex = newExpression.latex;
            if (i === 0) {
                if (conicType !== 6) {
                    newExpressionLatex += '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}\\left\\{y_{1ca}<y<y_{1cb}\\right\\}';
                }
            }
            newExpressionLatex = newExpressionLatex.replace(/_\{\d+([a-z]*)}/g, `_{${id}$1}`);
            if (doesIntersect(newExpression.types, ['var'])) {
                const [variable] = newExpressionLatex.split('=');
                const value = globalVariablesObject[toId(variable, id)];
                newExpressionLatex = `${variable}=${value}`;
            }
            const hidden = doesIntersect(expression[i].types, ['x_expression', 'y_expression']);
            expressionsToSet.push({ id: `${id.toString()}_${i}`,
                latex: newExpressionLatex,
                color: 'BLACK',
                hidden,
                type: 'expression' });
        }
        id += 1;
        MyCalc.setExpressions(expressionsToSet);
    }
    function freeze(force) {
        let newId = 0;
        const expressions = MyCalc.getExpressions();
        if (expressions.length !== 1) {
            let conicExpressionsNormal = [];
            if (force) {
                conicExpressionsNormal = expressions.filter((x) => !x.id.includes('_'));
            }
            const conicExpressionsBase = expressions.filter((x) => x.id.endsWith('_0') && !x.id.startsWith('final_'));
            const conicExpressionsFinal = expressions.filter((x) => x.id.startsWith('final_') && !x.id.includes('folder'));
            const conicExpressionsShade = expressions.filter((x) => x.id.startsWith('shade_') && !x.id.includes('folder'));
            const conicExpressionsNormalLatex = conicExpressionsNormal.map((_conicExpression) => {
                const conicExpression = _conicExpression;
                conicExpression.id = `final_${newId}`;
                newId += 1;
                return conicExpression;
            });
            const conicExpressionsBaseLatex = conicExpressionsBase.map((_conicExpression) => {
                const conic = new Conic(_conicExpression);
                conic.latex = conic.convertToStandard();
                conic.id = `final_${newId}`;
                conic.conicId = newId;
                newId += 1;
                return conic.toExpression();
            });
            const conicExpressionsFinalLatex = conicExpressionsFinal.map((_conicExpression) => {
                const conicExpression = _conicExpression;
                conicExpression.id = `final_${newId}`;
                newId += 1;
                return conicExpression;
            });
            const conicExpressionsShadeLatex = conicExpressionsShade.map((_conicExpression) => {
                const conicExpression = _conicExpression;
                const latex = substituteParenthesis(conicExpression.latex);
                const expression = { color: conicExpression.color, fillOpacity: conicExpression.fillOpacity, hidden: false, id: conicExpression.id, latex, type: 'expression' };
                return expression;
            });
            const latexAll = [
                ...conicExpressionsNormalLatex,
                ...conicExpressionsShadeLatex,
                ...conicExpressionsBaseLatex,
                ...conicExpressionsFinalLatex,
            ];
            localStorage.setItem('expressions', JSON.stringify(latexAll));
        }
        else {
            const newExpressions = localStorage.getItem('expressions');
            if (newExpressions) {
                MyCalc.setExpressions(JSON.parse(newExpressions));
            }
        }
    }
    function resetSelection() {
        shadingData.lastUpperBoundary = { x: new LinkedVariable(-Infinity), y: new LinkedVariable(-Infinity) };
        shadingData.lastLowerBoundary = { x: new LinkedVariable(Infinity), y: new LinkedVariable(Infinity) };
    }
    function finalizeId(_id) {
        if (_id.startsWith('final_')) {
            unfinalize(_id);
        }
        else if (_id.includes('_')) {
            finalize(_id);
        }
        else {
            unfinalizeConvert(_id);
        }
    }
    function fixNegative() {
        let toFix = [];
        const negativeab = MyCalc.getExpressions()
            .filter((x) => /[ab]_{\d*\w+}=-\d+[.]{0,1}\d*/g.test(x.latex)); // Selects ellipse, hyperbola with negative a, b
        toFix = [...toFix, ...negativeab.map((expression) => {
                expression.latex.replaceAll('-', '');
                return expression;
            })];
        MyCalc.setExpressions(toFix);
    }
    function deleteById(_id) {
        if (_id.includes('_')) {
            const currId = _id.split('_')[0];
            if (['shade', 'final'].includes(currId)) {
                const filteredExpressions = MyCalc.getExpressions();
                const expression = filteredExpressions.find((x) => x.id === _id);
                if (expression) {
                    MyCalc.removeExpressions([expression]);
                }
            }
            else {
                const idFilter = `${currId}_`;
                let filteredExpressions = MyCalc.getExpressions();
                filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
                MyCalc.removeExpressions(filteredExpressions);
            }
        }
    }
    function changeCropMode(_id) {
        if (_id.includes('_')) {
            const currId = _id.split('_')[0];
            const idFilter = `${currId}_`;
            let filteredExpressions = MyCalc.getExpressions();
            filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter) && !x.id.includes('folder'));
            const conicExpression = filteredExpressions.find((x) => x.id.endsWith('_0'));
            if (!conicExpression) {
                throw new Error();
            }
            const conic = new Conic(conicExpression);
            const { conicType } = conic;
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
            MyCalc.setExpressions(expressionsToSet);
        }
    }
    function hideCropLines(_id) {
        if (_id.includes('_')) {
            const idFilter = `${_id.split('_')[0]}_`;
            let filteredExpressions = MyCalc.getExpressions();
            filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter))
                .filter((x) => !x.id.includes('folder'));
            const conicExpression = filteredExpressions.find((x) => x.id.endsWith('_0'));
            if (!conicExpression) {
                throw new Error();
            }
            const conic = new Conic(conicExpression);
            const { conicType } = conic;
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
            }
            else {
                for (let i = 0; i < filteredExpressions.length; i++) {
                    newExpression = filteredExpressions[i];
                    if ('hidden' in newExpression) {
                        newExpression.hidden = newState;
                    }
                    expressionsToSet.push(newExpression);
                }
            }
            MyCalc.setExpressions(expressionsToSet);
        }
    }
    function setId() {
        const baseId = Math.max(0, Math.max(...MyCalc.getExpressions()
            .filter((x) => x.id.endsWith('_0'))
            .map((x) => parseInt(x.id.split('_')[0], 10))
            .filter((x) => !Number.isNaN(x)))) + 1;
        const finalId = Math.max(0, Math.max(...MyCalc.getExpressions()
            .filter((x) => x.id.startsWith('final_'))
            .map((x) => parseInt(x.id.split('_')[1], 10))
            .filter((x) => !Number.isNaN(x)))) + 1;
        console.log(baseId, finalId);
        id = Math.max(baseId, finalId);
        idSet = true;
    }
    function shadeToBack() {
        const state = MyCalc.getState();
        state.expressions.list = state.expressions.list
            .filter((x) => x.id.startsWith('shade_'))
            .concat(state.expressions.list.filter((x) => !x.id.startsWith('shade_')));
        MyCalc.setState(state);
    }
    function toggleShading() {
        const shade = MyCalc.getExpressions()
            .filter((x) => x.id.startsWith('shade_') && !x.id.includes('folder'));
        const newState = !shade[0].hidden;
        console.log(newState);
        MyCalc.setExpressions(shade.map((_x) => {
            const x = _x;
            x.hidden = newState;
            return x;
        }));
    }
    function getBoundsById(_id) {
        const conicExpression = MyCalc.getExpressions()
            .find((x) => x.id === _id);
        if (conicExpression) {
            console.log((new Conic(conicExpression))
                .getRealBounds());
        }
    }
    function expressionToFront(_id) {
        const state = MyCalc.getState();
        const expression = state.expressions.list
            .filter((_expression) => _expression.id === _id);
        const multipleExpressions = state.expressions.list
            .filter((_expression) => _expression.id !== _id);
        state.expressions.list = expression.concat(multipleExpressions);
        MyCalc.setState(state);
    }
    function keyUpHandler(e) {
        updateVariables();
        setId();
        if (currentlyPressed.includes(e.keyCode)) {
            currentlyPressed = currentlyPressed.filter((key) => key !== e.keyCode);
        }
        if (e.ctrlKey && e.shiftKey) {
            const { key } = e;
            if (key === '<') {
                expressionToFront(MyCalc.selectedExpressionId);
            }
            if (key === 'F') { // F - Finalize
                finalizeId(MyCalc.selectedExpressionId);
            }
        }
        if (e.key === 'Alt') {
            altTime = Date.now();
        }
        if (e.altKey || (Date.now() - altTime) < 100) {
            altTime = Date.now();
            const { keyCode } = e;
            if (keyCode === 77) {
                getBoundsById(MyCalc.selectedExpressionId);
            }
            if (keyCode === 219) {
                fixNegative();
            }
            if (keyCode === 189) {
                shadeToBack();
            }
            else if (keyCode === 187) {
                toggleShading();
            }
            else if ((keyCode >= 49) && (keyCode <= 56)) {
                createConic(keyCode - 49);
            }
            else if (keyCode === 83) { // bottom
                resetSelection();
            }
            else if (keyCode === 48) {
                freeze(e.shiftKey);
            }
            else if (keyCode === 88) {
                deleteById(MyCalc.selectedExpressionId);
            }
            else if (keyCode === 81) {
                changeCropMode(MyCalc.selectedExpressionId);
            }
            else if (keyCode === 72) {
                hideCropLines(MyCalc.selectedExpressionId);
            }
        }
        e.preventDefault();
    }
    function keyDownHandler(e) {
        if (e.altKey) {
            if (!currentlyPressed.includes(e.keyCode)) {
                currentlyPressed.push(e.keyCode);
            }
        }
    }
    function fillInside(expressionId) {
        const expressionList = MyCalc.getExpressions();
        const object = expressionList.find((expression) => expressionId === expression.id);
        if (object) {
            const conic = new Conic(object);
            if ([0, 4].includes(conic.conicType)) {
                conic.latex = conic.latex.replace('=', '>');
            }
            else if ([1, 2, 3, 5, 6].includes(conic.conicType)) {
                conic.latex = conic.latex.replace('=', '<');
            }
            MyCalc.setExpression({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: conic.latex });
            shadeId += 1;
        }
    }
    function fillIntersection(lowerId, upperId, axis) {
        const expressionList = MyCalc.getExpressions();
        const lowerObject = expressionList.find((expression) => lowerId === expression.id);
        const upperObject = expressionList.find((expression) => upperId === expression.id);
        console.log(lowerObject, upperObject);
        if (!upperObject || !lowerObject) {
            throw new Error("This shouldn't happen");
        }
        const lowerConic = new Conic(lowerObject);
        const upperConic = new Conic(upperObject);
        const lowerBounds = lowerConic.getRealBounds();
        const upperBounds = upperConic.getRealBounds();
        console.log(lowerBounds);
        console.log(upperBounds);
        if (axis === 'y') {
            let realMin = lowerBounds.xMin.value < upperBounds.xMin.value
                ? upperBounds.xMin : lowerBounds.xMin;
            let realMax = lowerBounds.xMax.value > upperBounds.xMax.value
                ? upperBounds.xMax : lowerBounds.xMax;
            console.log(shadingData.lastUpperBoundary.y.value, realMin.value, lastCenterPoint.x, centerPoint.x);
            console.log(shadingData.lastLowerBoundary.y.value, realMax.value, lastCenterPoint.x, centerPoint.x);
            if (Number.isFinite(lastCenterPoint.x)) {
                if (shadingData.lastUpperBoundary.y.value > realMin.value && lastCenterPoint.x < centerPoint.x) { // To right
                    realMin = shadingData.lastUpperBoundary.y;
                }
                if (shadingData.lastLowerBoundary.y.value < realMax.value && lastCenterPoint.x > centerPoint.x) {
                    realMax = shadingData.lastLowerBoundary.y;
                }
            }
            shadingData.lastUpperBoundary.y = realMax;
            shadingData.lastLowerBoundary.y = realMin;
            const bounds = generateBounds(realMin, { reference: null, value: -Infinity }, realMax, { reference: null, value: Infinity }).reference;
            console.log(bounds);
            const newExpressions = [];
            const lowerConicConverted = lowerConic.convertToYRelevant();
            const upperConicConverted = upperConic.convertToYRelevant();
            for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
                const currLowerConic = lowerConicConverted[lowerIndex];
                for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
                    const currUpperConic = upperConicConverted[upperIndex];
                    const newExpression = `${currLowerConic}<y<${currUpperConic}${bounds}`;
                    newExpressions.push({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: newExpression, fillOpacity: '1' });
                    shadeId += 1;
                }
            }
            MyCalc.setExpressions(newExpressions);
        }
        else if (axis === 'x') {
            let realMin = lowerBounds.yMin.value < upperBounds.yMin.value
                ? upperBounds.yMin : lowerBounds.yMin;
            let realMax = lowerBounds.yMax.value > upperBounds.yMax.value
                ? upperBounds.yMax : lowerBounds.yMax;
            if (Number.isFinite(lastCenterPoint.y)) {
                if (shadingData.lastUpperBoundary.x.value > realMin.value && lastCenterPoint.y < centerPoint.y) {
                    realMin = shadingData.lastUpperBoundary.x;
                }
                if (shadingData.lastLowerBoundary.x.value < realMax.value && lastCenterPoint.y > centerPoint.y) {
                    realMax = shadingData.lastLowerBoundary.x;
                }
            }
            shadingData.lastUpperBoundary.x = realMax;
            shadingData.lastLowerBoundary.x = realMin;
            const bounds = generateBounds({ reference: null, value: -Infinity }, realMin, { reference: null, value: Infinity }, realMax)
                .reference;
            const newExpressions = [];
            const lowerConicConverted = lowerConic.convertToXRelevant();
            const upperConicConverted = upperConic.convertToXRelevant();
            for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
                const currLowerConic = lowerConicConverted[lowerIndex];
                for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
                    const currUpperConic = upperConicConverted[upperIndex];
                    const newExpression = `${currLowerConic}<x<${currUpperConic}${bounds}`;
                    newExpressions.push({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: newExpression });
                    shadeId += 1;
                }
            }
            console.log(newExpressions);
            MyCalc.setExpressions(newExpressions);
        }
    }
    function mouseUpHandler(e) {
        setId();
        if (MyCalc.selectedExpressionId) {
            lastSelectedId = MyCalc.selectedExpressionId;
        }
        updateVariables();
        if (!shadeIdSet) {
            shadeId = getShadeId() + 1;
            shadeIdSet = true;
        }
        if (currentlyPressed.includes(65)) {
            const selected = MyCalc.getSelected();
            if (isConic(selected)) {
                selection.push({ id: selected.id, pos: { x: e.clientX, y: e.clientY } });
            }
            if (selection.length >= 2) {
                const lowerSelection = selection.shift();
                const upperSelection = selection.shift();
                if (!upperSelection || !lowerSelection) {
                    throw new Error("This shouldn't happen");
                }
                centerPoint = MyCalc.pixelsToMath({
                    x: (upperSelection.pos.x + lowerSelection.pos.x) / 2,
                    y: (upperSelection.pos.x + lowerSelection.pos.y) / 2,
                });
                const slope = (Math.abs(upperSelection.pos.y - lowerSelection.pos.y) + 1)
                    / (Math.abs(upperSelection.pos.x - lowerSelection.pos.x) + 1);
                const axis = (slope > 1) ? 'y' : 'x';
                let upperId = upperSelection.id;
                let lowerId = lowerSelection.id;
                if (upperId === lowerId) {
                    const lowerFinal = lowerId.startsWith('final_');
                    if (lowerFinal) {
                        unfinalize(lowerId);
                        lowerId = `${lowerId.split('_')[1]}_0`;
                    }
                    fillInside(lowerId);
                    if (lowerFinal)
                        finalize(lowerId);
                }
                else {
                    const lowerFinal = lowerId.startsWith('final_');
                    const upperFinal = upperId.startsWith('final_');
                    if (lowerFinal) {
                        unfinalize(lowerId);
                        lowerId = `${lowerId.split('_')[1]}_0`;
                    }
                    if (upperFinal) {
                        unfinalize(upperId);
                        upperId = `${upperId.split('_')[1]}_0`;
                    }
                    fillIntersection(lowerId, upperId, axis);
                    if (lowerFinal)
                        finalize(lowerId);
                    if (upperFinal)
                        finalize(upperId);
                }
                lastCenterPoint = centerPoint;
            }
        }
    }
    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('keyup', keyUpHandler, false);
    document.addEventListener('pointerup', mouseUpHandler, false);
    function toggleArtist() {
        const x = document.querySelector('#artist');
        const y = document.querySelector('#artist-container');
        if (x)
            x.style.display = x.style.display === 'none' ? 'block' : 'none';
        if (y)
            y.style.display = y.style.display === 'none' ? 'block' : 'none';
    }
    function changeColor() {
        const expressions = MyCalc.getExpressions();
        const conicExpression = expressions.find((expression) => expression.id === lastSelectedId);
        if (conicExpression) {
            const colorForm = $('#colorForm');
            if (colorForm) {
                const data = colorForm.serializeArray();
                data.forEach((pair) => {
                    conicExpression[pair.name] = pair.value;
                });
                MyCalc.setExpression(conicExpression);
            }
        }
    }
    function changeConicType() {
        currConicId = (currConicId + 1) % 7;
        const button = document.querySelector('#artist-button');
        console.log('hi');
        if (button) {
            button.innerHTML = conicAbbrev[currConicId];
        }
    }
    function createConicHandler() {
        createConic(currConicId);
    }
    function load() {
        MyCalc = new MyCalcClass(Calc);
        const pillbox = unsafeWindow.document.querySelector('.dcg-overgraph-pillbox-elements');
        console.log(pillbox);
        if (pillbox) {
            pillbox.insertAdjacentHTML('beforeend', '<div id="artist-button-container"><div class="dcg-tooltip-hit-area-container"><div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings" role="button" onclick=\'toggleArtist()\' style="background:#ededed"><i class="dcg-icon-wrench" aria-hidden="true"></i></div></div><div style="display: none"></div></div>');
            pillbox.insertAdjacentHTML('beforeend', '<div id="artist-container" class="dcg-artist-view-container"></div>');
            const artistContainer = unsafeWindow.document.querySelector('#artist-container');
            if (artistContainer) {
                artistContainer.insertAdjacentHTML('beforeend', `<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div id="artist-button" class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" oncontextmenu="createConicHandler();return false;" onclick="changeConicType()" style="background:#ededed">${conicAbbrev[currConicId]}</div></div>`);
                artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="deleteById(Calc.selectedExpressionId)" style="background:#ededed">X</div></div>');
                artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="hideCropLines(Calc.selectedExpressionId)" style="background:#ededed">H</div></div>');
                artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="changeCropMode(Calc.selectedExpressionId)" style="background:#ededed">Q</div></div>');
                artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="finalizeId(Calc.selectedExpressionId)" style="background:#ededed">F</div></div>');
                artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" oncontextmenu="freeze(false);return false;" style="background:#ededed">S</div></div>');
            }
        }
        const body = document.querySelector('.dcg-grapher');
        if (body) {
            body.insertAdjacentHTML('beforeend', '<div id="artist" style="position: absolute; bottom: 5%; right: 5%; padding: 10px; border: 1px solid black; border-radius: 10px"><form id="colorForm" onSubmit="return changeColor()"><div> Color <input name="color" type="color"></div><div> Opacity <input name="fillOpacity" type="number" min="0" max="1" value="0.4"></div><div><input type="button" value="Apply" onclick="changeColor()"></div></form></div>');
        }
    }
    (async () => {
        while (typeof Calc === 'undefined') {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        load();
    })();
    unsafeWindow.idSet = idSet;
    unsafeWindow.id = id;
    unsafeWindow.Conic = Conic;
    unsafeWindow.changeColor = changeColor;
    unsafeWindow.changeConicType = changeConicType;
    unsafeWindow.createConicHandler = createConicHandler;
    unsafeWindow.globalVariablesObject = globalVariablesObject;
    unsafeWindow.toggleArtist = toggleArtist;
})();