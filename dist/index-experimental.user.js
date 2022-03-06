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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Graph\": () => (/* binding */ Graph)\n/* harmony export */ });\nclass Graph {\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/classes/Graph.ts?");

/***/ }),

/***/ "./src/classes/VirtualCalc.ts":
/*!************************************!*\
  !*** ./src/classes/VirtualCalc.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"VirtualCalcClass\": () => (/* binding */ VirtualCalcClass)\n/* harmony export */ });\n/* harmony import */ var _types_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../types/types */ \"./src/types/types.ts\");\n\r\nclass VirtualCalcClass {\r\n    constructor(_Calc) {\r\n        this.expressions = {};\r\n        this.variables = {};\r\n        this.lastId = -1;\r\n        this.Calc = _Calc;\r\n        this.Controller = _Calc.controller;\r\n    }\r\n    nextId() {\r\n        this.lastId += 1;\r\n        return this.lastId;\r\n    }\r\n    setVariables(variables) {\r\n        variables.forEach((variable) => {\r\n            const { key, value } = variable;\r\n            this.variables[key] = value;\r\n        });\r\n    }\r\n    addGraph(graphType, variables) {\r\n        const newGraph = _types_types__WEBPACK_IMPORTED_MODULE_0__.GraphTypes[graphType].addGraph(variables);\r\n        this.setFocus(newGraph);\r\n    }\r\n    setFocus(newGraph) {\r\n        newGraph.unstandardize();\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/classes/VirtualCalc.ts?");

/***/ }),

/***/ "./src/graphs/Circle.ts":
/*!******************************!*\
  !*** ./src/graphs/Circle.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Circle\": () => (/* binding */ Circle)\n/* harmony export */ });\n/* harmony import */ var _classes_Graph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../classes/Graph */ \"./src/classes/Graph.ts\");\n\r\nclass Circle extends _classes_Graph__WEBPACK_IMPORTED_MODULE_0__.Graph {\r\n    constructor(variables) {\r\n        super();\r\n        this.graphType = \"circle\";\r\n        this.variables = variables;\r\n    }\r\n    unstandardize() {\r\n    }\r\n}\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/graphs/Circle.ts?");

/***/ }),

/***/ "./src/index.user.ts":
/*!***************************!*\
  !*** ./src/index.user.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"virtualCalc\": () => (/* binding */ virtualCalc)\n/* harmony export */ });\n/* harmony import */ var _classes_Graph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./classes/Graph */ \"./src/classes/Graph.ts\");\n/* harmony import */ var _classes_VirtualCalc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./classes/VirtualCalc */ \"./src/classes/VirtualCalc.ts\");\n\r\n\r\nlet virtualCalc;\r\nclass App {\r\n    constructor() {\r\n        this.virtualCalc = new _classes_VirtualCalc__WEBPACK_IMPORTED_MODULE_1__.VirtualCalcClass(Calc);\r\n        document.addEventListener('keydown', this.keyDownHandler, false);\r\n        document.addEventListener('keyup', this.keyUpHandler, false);\r\n        document.addEventListener('pointerup', this.mouseUpHandler, false);\r\n        unsafeWindow.VirtualCalc = virtualCalc;\r\n        unsafeWindow.Graph = _classes_Graph__WEBPACK_IMPORTED_MODULE_0__.Graph;\r\n    }\r\n    keyUpHandler(e) {\r\n        e.preventDefault();\r\n    }\r\n    keyDownHandler(e) {\r\n        if (e.altKey) {\r\n            if (e.key === \"1\") {\r\n                console.log(\"circle\");\r\n            }\r\n        }\r\n        e.preventDefault();\r\n    }\r\n    mouseUpHandler(e) {\r\n        e.preventDefault();\r\n    }\r\n}\r\n(async () => {\r\n    while (typeof Calc === 'undefined') {\r\n        await new Promise((resolve) => setTimeout(resolve, 1000));\r\n    }\r\n    const app = new App();\r\n})();\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/index.user.ts?");

/***/ }),

/***/ "./src/types/types.ts":
/*!****************************!*\
  !*** ./src/types/types.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"GraphTypes\": () => (/* binding */ GraphTypes)\n/* harmony export */ });\n/* harmony import */ var _graphs_Circle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../graphs/Circle */ \"./src/graphs/Circle.ts\");\n\r\nconst GraphTypes = {\r\n    \"circle\": _graphs_Circle__WEBPACK_IMPORTED_MODULE_0__.Circle\r\n};\r\n\n\n//# sourceURL=webpack://graph-art-creator/./src/types/types.ts?");

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
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.user.ts");
/******/ 	
/******/ })()
;