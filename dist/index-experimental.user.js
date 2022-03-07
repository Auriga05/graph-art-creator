// ==UserScript==
// @name         Graph Art Creator - Experimental
// @namespace    http://tampermonkey.net/
// @version      1.0a
// @description  precal thing
// @author       Auriga05
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// @updateURL    https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @downloadURL  https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/classes/Graph.ts":
/*!******************************!*\
  !*** ./src/classes/Graph.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Graph\": () => (/* binding */ Graph)\n/* harmony export */ });\n/* harmony import */ var _index_user__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index.user */ \"./src/index.user.ts\");\n/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ \"./src/utils/utils.ts\");\n\r\n\r\nclass Graph {\r\n    constructor() {\r\n        this.id = _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.nextId();\r\n        this.cropVariables = {\r\n            minX: -8,\r\n            minY: -4,\r\n            maxX: 8,\r\n            maxY: 4,\r\n        };\r\n        this.focused = false;\r\n        this.shown = false;\r\n    }\r\n    unstandardize() {\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.setExpressions(_index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.showVariables([\r\n            ...Object.keys(this.variables),\r\n            ...Graph.boundVariableNames\r\n        ]));\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.setExpressions(this.showPoints());\r\n    }\r\n    showPoints() {\r\n        const points = this.pointsLatex.map((latex, index) => {\r\n            return { id: `graphpoint_${index}`, type: \"expression\", latex };\r\n        });\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.points = points;\r\n        return points;\r\n    }\r\n    focus() {\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.setVariables([\r\n            { key: 'c_{x1}', value: this.cropVariables.minX - this.variables.h },\r\n            { key: 'c_{y1}', value: this.cropVariables.minY - this.variables.k },\r\n            { key: 'c_{x2}', value: this.cropVariables.maxX - this.variables.h },\r\n            { key: 'c_{y2}', value: this.cropVariables.maxY - this.variables.k },\r\n        ]);\r\n        this.focused = true;\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.setVariables((0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.convertToVariableObjects)(this.variables));\r\n        this.unstandardize();\r\n    }\r\n    defocus() {\r\n        this.focused = false;\r\n        this.standardize();\r\n    }\r\n    update() {\r\n        if (this.focused) {\r\n            if (!this.shown) {\r\n                this.show();\r\n            }\r\n            this.variables = Object.fromEntries(Object.keys(this.variables).map(variableName => [variableName, _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.variables[variableName].value]));\r\n            _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.recalculateBoundVariables();\r\n            this.cropVariables = _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.getMinMaxBoundVariables();\r\n        }\r\n    }\r\n    getGraphId() {\r\n        return `graph_${this.id}`;\r\n    }\r\n    standardizedBoundsLatex() {\r\n        const { minX, minY, maxX, maxY } = _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.getMinMaxBoundVariables();\r\n        return `\\\\left\\\\{${minX}<x<${maxX}\\\\right\\\\}\\\\left\\\\{${minY}<y<${maxY}\\\\right\\\\}`;\r\n    }\r\n    standardize() {\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.removeGraphPoints();\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.setExpressions([\r\n            {\r\n                type: \"expression\",\r\n                id: `graph_${this.id}`,\r\n                latex: this.getExpressionLatex()\r\n            }\r\n        ]);\r\n    }\r\n    delete() {\r\n        this.defocus();\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.removeGraphPoints();\r\n        _index_user__WEBPACK_IMPORTED_MODULE_0__.virtualCalc.Calc.removeExpression();\r\n    }\r\n}\r\nGraph.boundVariableNames = ['c_{x1}', 'c_{y1}', 'c_{x2}', 'c_{y2}'];\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/classes/Graph.ts?");

/***/ }),

/***/ "./src/classes/Variable.ts":
/*!*********************************!*\
  !*** ./src/classes/Variable.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Variable\": () => (/* binding */ Variable)\n/* harmony export */ });\nclass Variable {\r\n    constructor(key, value) {\r\n        this.key = key.toString();\r\n        this.value = value;\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/classes/Variable.ts?");

/***/ }),

/***/ "./src/classes/VirtualCalc.ts":
/*!************************************!*\
  !*** ./src/classes/VirtualCalc.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"VirtualCalcClass\": () => (/* binding */ VirtualCalcClass)\n/* harmony export */ });\n/* harmony import */ var _types_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../types/types */ \"./src/types/types.ts\");\n/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ \"./src/utils/utils.ts\");\n/* harmony import */ var _Variable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Variable */ \"./src/classes/Variable.ts\");\n\r\n\r\n\r\nclass VirtualCalcClass {\r\n    constructor(_Calc) {\r\n        this.graphs = {};\r\n        this.variables = {};\r\n        this.lastId = -1;\r\n        this.Calc = _Calc;\r\n        this.Controller = _Calc.controller;\r\n        this.focus = null;\r\n        this.points = [];\r\n    }\r\n    init() {\r\n        this.setVariables([\r\n            { key: \"c_{x1}\", value: 8 },\r\n            { key: \"c_{y1}\", value: 4 },\r\n            { key: \"c_{x2}\", value: -8 },\r\n            { key: \"c_{y2}\", value: -4 },\r\n        ]),\r\n            this.setExpressions([\r\n                ...this.showVariables([\"c_{x1}\", \"c_{y1}\", \"c_{x2}\", \"c_{y2}\"]),\r\n                ...this.showBounds()\r\n            ]);\r\n    }\r\n    nextId() {\r\n        this.lastId += 1;\r\n        if (this.lastId === 0) {\r\n            this.init();\r\n        }\r\n        return this.lastId;\r\n    }\r\n    setVariables(variables) {\r\n        variables.forEach((variable) => {\r\n            const { key, value } = variable;\r\n            if (key in this.variables) {\r\n                this.variables[key].value = value;\r\n            }\r\n            else {\r\n                this.variables[key] = new _Variable__WEBPACK_IMPORTED_MODULE_2__.Variable(key, value);\r\n            }\r\n        });\r\n    }\r\n    updateVariables() {\r\n        const newVariables = [];\r\n        const analysis = this.Calc.expressionAnalysis;\r\n        Object.keys(this.variables).forEach((variable) => {\r\n            const variableAnalysis = analysis[`variable_${variable}`];\r\n            if (!variableAnalysis)\r\n                throw new Error(`Analysis of ${variable} not found`);\r\n            if (!variableAnalysis.evaluation)\r\n                return;\r\n            if (variableAnalysis.evaluation.type === \"Number\") {\r\n                newVariables.push(new _Variable__WEBPACK_IMPORTED_MODULE_2__.Variable(variable, variableAnalysis.evaluation.value));\r\n            }\r\n        });\r\n        console.log(newVariables);\r\n        this.setVariables(newVariables);\r\n    }\r\n    addGraph(graphType, variables) {\r\n        const newGraph = variables ? new _types_types__WEBPACK_IMPORTED_MODULE_0__.GraphTypes[graphType](variables) : _types_types__WEBPACK_IMPORTED_MODULE_0__.GraphTypes[graphType].createDefault();\r\n        this.graphs[newGraph.id] = newGraph;\r\n        this.setFocus(newGraph);\r\n    }\r\n    showBounds() {\r\n        return [\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"c_{x1a}=c_{x1} + h\", id: \"variable_c_{x1a}\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"c_{x2a}=c_{x2} + h\", id: \"variable_c_{x2a}\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"c_{y1a}=c_{y1} + k\", id: \"variable_c_{y1a}\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"c_{y2a}=c_{y2} + k\", id: \"variable_c_{y2a}\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: `\\\\left(c_{x1} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('h')},c_{y1} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('k')}\\\\right)`, id: \"point_1\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: `\\\\left(c_{x1} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('h')},c_{y2} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('k')}\\\\right)`, id: \"point_2\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: `\\\\left(c_{x2} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('h')},c_{y1} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('k')}\\\\right)`, id: \"point_3\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: `\\\\left(c_{x2} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('h')},c_{y2} + ${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.abssgn)('k')}\\\\right)`, id: \"point_4\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"\\\\left(c_{x1a},c_{y1a}+\\\\left(c_{y2a}-c_{y1a}\\\\right)t\\\\right)\", id: \"line_1\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"\\\\left(c_{x2a},c_{y1a}+\\\\left(c_{y2a}-c_{y1a}\\\\right)t\\\\right)\", id: \"line_2\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"\\\\left(c_{x1a}+\\\\left(c_{x2a}-c_{x1a}\\\\right)t,c_{y1a}\\\\right)\", id: \"line_3\" },\r\n            { type: \"expression\", hidden: false, color: \"black\", latex: \"\\\\left(c_{x1a}+\\\\left(c_{x2a}-c_{x1a}\\\\right)t,c_{y2a}\\\\right)\", id: \"line_4\" },\r\n        ];\r\n    }\r\n    hideBounds() {\r\n        return this.showBounds().map(x => {\r\n            x.hidden = true;\r\n            return x;\r\n        });\r\n    }\r\n    setFocus(newGraph) {\r\n        this.focus?.defocus();\r\n        if (newGraph) {\r\n            this.setExpressions(this.showBounds());\r\n            this.focus = newGraph;\r\n            newGraph.focus();\r\n            newGraph.update();\r\n        }\r\n        else {\r\n            this.setExpressions(this.hideBounds());\r\n        }\r\n    }\r\n    setExpressions(expressions) {\r\n        this.Calc.setExpressions(expressions);\r\n    }\r\n    showVariables(variableList) {\r\n        const variables = variableList.map(variableName => {\r\n            console.log(variableName, this.variables);\r\n            return {\r\n                type: \"expression\",\r\n                latex: `${variableName}=${this.variables[variableName].value}`,\r\n                id: `variable_${variableName}`,\r\n                hidden: true,\r\n            };\r\n        });\r\n        return variables;\r\n    }\r\n    onChange() {\r\n        Object.values(this.graphs).forEach(graph => {\r\n            graph.update();\r\n        });\r\n        if (this.focus && this.Calc.selectedExpressionId) {\r\n            if (this.Calc.selectedExpressionId.startsWith('graph_')) {\r\n                if (this.focus.getGraphId() !== this.Calc.selectedExpressionId) {\r\n                    const newFocusId = this.Calc.selectedExpressionId.replace('graph_', '');\r\n                    this.setFocus(this.graphs[newFocusId]);\r\n                }\r\n            }\r\n        }\r\n    }\r\n    getMinMaxBoundVariables() {\r\n        const minX = Math.min(this.variables['c_{x1a}'].value, this.variables['c_{x2a}'].value);\r\n        const maxX = Math.max(this.variables['c_{x1a}'].value, this.variables['c_{x2a}'].value);\r\n        const minY = Math.min(this.variables['c_{y1a}'].value, this.variables['c_{y2a}'].value);\r\n        const maxY = Math.max(this.variables['c_{y1a}'].value, this.variables['c_{y2a}'].value);\r\n        return { minX, minY, maxX, maxY };\r\n    }\r\n    recalculateBoundVariables() {\r\n        this.setVariables([\r\n            { key: 'c_{x1a}', value: this.variables['c_{x1}'].value + this.variables['h'].value },\r\n            { key: 'c_{x2a}', value: this.variables['c_{x2}'].value + this.variables['h'].value },\r\n            { key: 'c_{y1a}', value: this.variables['c_{y1}'].value + this.variables['k'].value },\r\n            { key: 'c_{y2a}', value: this.variables['c_{y2}'].value + this.variables['k'].value },\r\n        ]);\r\n    }\r\n    removeGraphPoints() {\r\n        this.Calc.removeExpressions(this.points);\r\n    }\r\n    removeGraph() {\r\n        if (this.Calc.selectedExpressionId?.startsWith(\"graph_\")) {\r\n            const graphId = this.Calc.selectedExpressionId.replace(\"graph_\", \"\");\r\n            const graph = this.graphs[graphId];\r\n            graph.delete();\r\n            delete this.graphs[graphId];\r\n        }\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/classes/VirtualCalc.ts?");

/***/ }),

/***/ "./src/graphs/Circle.ts":
/*!******************************!*\
  !*** ./src/graphs/Circle.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Circle\": () => (/* binding */ Circle)\n/* harmony export */ });\n/* harmony import */ var _classes_Graph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../classes/Graph */ \"./src/classes/Graph.ts\");\n/* harmony import */ var _index_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../index.user */ \"./src/index.user.ts\");\n/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ \"./src/utils/utils.ts\");\n\r\n\r\n\r\nclass Circle extends _classes_Graph__WEBPACK_IMPORTED_MODULE_0__.Graph {\r\n    constructor(variables) {\r\n        super();\r\n        this.pointsLatex = [\"\\\\left(h,k\\\\right)\", `\\\\left(h+r,${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.abssgn)('k')}\\\\right)`];\r\n        this.variables = variables;\r\n    }\r\n    static createDefault() {\r\n        return new Circle(this.defaultVariables);\r\n    }\r\n    getExpressionLatex() {\r\n        return `\\\\left(x-${this.variables.h}\\\\right)^{2}+\\\\left(y-${this.variables.k}\\\\right)^{2}=${this.variables.r ** 2}${this.standardizedBoundsLatex()}`;\r\n    }\r\n    show() {\r\n        const expressions = [{\r\n                type: \"expression\",\r\n                id: this.getGraphId(),\r\n                latex: \"\\\\left(x-h\\\\right)^{2}+\\\\left(y-k\\\\right)^{2}=r^{2}\" +\r\n                    \"\\\\left\\\\{\\\\min\\\\left(c_{x1a},c_{x2a}\\\\right)<x<\\\\max\\\\left(c_{x1a},c_{x2a}\\\\right)\\\\right\\\\}\" +\r\n                    \"\\\\left\\\\{\\\\min\\\\left(c_{y1a},c_{y2a}\\\\right)<y<\\\\max\\\\left(c_{y1a},c_{y2a}\\\\right)\\\\right\\\\}\"\r\n            }];\r\n        _index_user__WEBPACK_IMPORTED_MODULE_1__.virtualCalc.setExpressions(expressions);\r\n    }\r\n}\r\nCircle.graphType = \"circle\";\r\nCircle.defaultVariables = { h: 0, k: 0, r: 2 };\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/graphs/Circle.ts?");

/***/ }),

/***/ "./src/graphs/Ellipse.ts":
/*!*******************************!*\
  !*** ./src/graphs/Ellipse.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Ellipse\": () => (/* binding */ Ellipse)\n/* harmony export */ });\n/* harmony import */ var _classes_Graph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../classes/Graph */ \"./src/classes/Graph.ts\");\n/* harmony import */ var _index_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../index.user */ \"./src/index.user.ts\");\n/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ \"./src/utils/utils.ts\");\n\r\n\r\n\r\nclass Ellipse extends _classes_Graph__WEBPACK_IMPORTED_MODULE_0__.Graph {\r\n    constructor(variables) {\r\n        super();\r\n        this.pointsLatex = [\"\\\\left(h,k\\\\right)\", `\\\\left(h+a,${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.abssgn)('k')}\\\\right)`, `\\\\left(${(0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.abssgn)('h')},k+b\\\\right)`];\r\n        this.variables = variables;\r\n    }\r\n    static createDefault() {\r\n        return new Ellipse(this.defaultVariables);\r\n    }\r\n    getExpressionLatex() {\r\n        return `\\\\frac{\\\\left(x-${this.variables.h}\\\\right)^{2}}{${this.variables.a ** 2}}+\\\\frac{\\\\left(y-${this.variables.k}\\\\right)^{2}}{${this.variables.b ** 2}}=1${this.standardizedBoundsLatex()}`;\r\n    }\r\n    show() {\r\n        const expressions = [{\r\n                type: \"expression\",\r\n                id: this.getGraphId(),\r\n                latex: \"\\\\frac{\\\\left(x-h\\\\right)^{2}}{a^{2}}+\\\\frac{\\\\left(y-k\\\\right)^{2}}{b^{2}}=1\" +\r\n                    \"\\\\left\\\\{\\\\min\\\\left(c_{x1a},c_{x2a}\\\\right)<x<\\\\max\\\\left(c_{x1a},c_{x2a}\\\\right)\\\\right\\\\}\" +\r\n                    \"\\\\left\\\\{\\\\min\\\\left(c_{y1a},c_{y2a}\\\\right)<y<\\\\max\\\\left(c_{y1a},c_{y2a}\\\\right)\\\\right\\\\}\"\r\n            }];\r\n        _index_user__WEBPACK_IMPORTED_MODULE_1__.virtualCalc.setExpressions(expressions);\r\n    }\r\n}\r\nEllipse.graphType = \"ellipse\";\r\nEllipse.defaultVariables = { h: 0, k: 0, a: 3, b: 2 };\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/graphs/Ellipse.ts?");

/***/ }),

/***/ "./src/index.user.ts":
/*!***************************!*\
  !*** ./src/index.user.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"virtualCalc\": () => (/* binding */ virtualCalc)\n/* harmony export */ });\n/* harmony import */ var _classes_Graph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./classes/Graph */ \"./src/classes/Graph.ts\");\n/* harmony import */ var _classes_VirtualCalc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./classes/VirtualCalc */ \"./src/classes/VirtualCalc.ts\");\n\r\n\r\nlet virtualCalc;\r\nclass App {\r\n    constructor() {\r\n        document.addEventListener('keydown', (e) => this.keyDownHandler(e), false);\r\n        document.addEventListener('keyup', (e) => this.keyUpHandler(e), false);\r\n        document.addEventListener('pointerup', (e) => this.mouseUpHandler(e), false);\r\n        document.addEventListener('pointerdown', (e) => this.mouseDownHandler(e), false);\r\n        virtualCalc = new _classes_VirtualCalc__WEBPACK_IMPORTED_MODULE_1__.VirtualCalcClass(Calc);\r\n        unsafeWindow.VirtualCalc = virtualCalc;\r\n        unsafeWindow.Graph = _classes_Graph__WEBPACK_IMPORTED_MODULE_0__.Graph;\r\n    }\r\n    keyUpHandler(e) {\r\n        return;\r\n        // this.onChange()\r\n        // e.preventDefault();\r\n    }\r\n    keyDownHandler(e) {\r\n        this.onChange();\r\n        if (e.altKey) {\r\n            if (e.key === \"1\") {\r\n                virtualCalc.addGraph(\"circle\");\r\n            }\r\n            else if (e.key === \"2\") {\r\n                virtualCalc.addGraph(\"ellipse\");\r\n            }\r\n            if (e.key === \"a\") {\r\n                virtualCalc.setFocus(null);\r\n            }\r\n            if (e.key === \"x\") {\r\n                virtualCalc.removeGraph();\r\n            }\r\n            e.preventDefault();\r\n        }\r\n    }\r\n    mouseUpHandler(e) {\r\n        this.onChange();\r\n        // e.preventDefault();\r\n    }\r\n    mouseDownHandler(e) {\r\n        this.onChange();\r\n        // e.preventDefault();\r\n    }\r\n    onChange() {\r\n        virtualCalc.onChange();\r\n        virtualCalc.updateVariables();\r\n    }\r\n    getOffset() {\r\n        const graphContainer = document.querySelector('#graph-container');\r\n        const graphContainerRect = graphContainer.getBoundingClientRect();\r\n        return { x: graphContainerRect.left, y: graphContainerRect.top };\r\n    }\r\n    pixelsToMath(point) {\r\n        const { x: xOffset, y: yOffset } = this.getOffset();\r\n        return virtualCalc.Calc.pixelsToMath({\r\n            x: point.x - xOffset,\r\n            y: point.y - yOffset,\r\n        });\r\n    }\r\n}\r\n(async () => {\r\n    while (typeof Calc === 'undefined') {\r\n        await new Promise((resolve) => setTimeout(resolve, 1000));\r\n    }\r\n    const app = new App();\r\n})();\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/index.user.ts?");

/***/ }),

/***/ "./src/types/types.ts":
/*!****************************!*\
  !*** ./src/types/types.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"GraphTypes\": () => (/* binding */ GraphTypes)\n/* harmony export */ });\n/* harmony import */ var _graphs_Circle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../graphs/Circle */ \"./src/graphs/Circle.ts\");\n/* harmony import */ var _graphs_Ellipse__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../graphs/Ellipse */ \"./src/graphs/Ellipse.ts\");\n\r\n\r\nconst GraphTypesClass = [_graphs_Circle__WEBPACK_IMPORTED_MODULE_0__.Circle, _graphs_Ellipse__WEBPACK_IMPORTED_MODULE_1__.Ellipse];\r\nconst GraphTypes = Object.fromEntries(GraphTypesClass.map(graphType => [graphType.graphType, graphType]));\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/types/types.ts?");

/***/ }),

/***/ "./src/utils/utils.ts":
/*!****************************!*\
  !*** ./src/utils/utils.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"convertToKeyValuePairs\": () => (/* binding */ convertToKeyValuePairs),\n/* harmony export */   \"convertToVariableObjects\": () => (/* binding */ convertToVariableObjects),\n/* harmony export */   \"abssgn\": () => (/* binding */ abssgn)\n/* harmony export */ });\n/* harmony import */ var _classes_Variable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../classes/Variable */ \"./src/classes/Variable.ts\");\n\r\nfunction convertToKeyValuePairs(arg) {\r\n    return Object.entries(arg).map((entry) => {\r\n        const [key, value] = entry;\r\n        return { key, value };\r\n    });\r\n}\r\nfunction convertToVariableObjects(arg) {\r\n    return Object.entries(arg).map((entry) => {\r\n        const [key, value] = entry;\r\n        return new _classes_Variable__WEBPACK_IMPORTED_MODULE_0__.Variable(key, value);\r\n    });\r\n}\r\nfunction abssgn(text) {\r\n    return `\\\\operatorname{abs}\\\\left(${text}\\\\right)\\\\operatorname{sgn}\\\\left(${text}\\\\right)`;\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/utils/utils.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.user.ts");
/******/ 	
/******/ })()
;