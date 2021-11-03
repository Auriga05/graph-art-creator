import { createGraphObject, Expression, functionRegex, intersectConics, LinkedVariable, usesVariable } from "./lib";
interface ExpressionAnalysis { evaluation ? : { type: string
  value: number
}
}
interface ControllerType {
getItemModel: (_id: string) => Expression
getItemCount: () => number
dispatch: (args: {
  [key: string]: any,
  type: string,
}) => any
}
export interface CalcType { getExpressions: () => Expression[]
expressionAnalysis: {
  [key: string]: ExpressionAnalysis
}
selectedExpressionId: string
removeExpressions: (expressions: Expression[]) => void
removeExpression: (expression: Expression) => void
setExpressions: (expressions: Expression[]) => void
setExpression: (expression: Partial<Expression>) => void
pixelsToMath: (point: {x: number, y: number}) => {x: number, y: number}
graphpaperBounds: { mathCoordinates: { left: number
      right: number
      top: number
      bottom: number
    }
  }, setState: (state: State) => void
getState: () => State
removeSelected: () => void
controller: ControllerType
}

interface State {
  expressions: {
    list: Expression[]
  }
}
export class MyCalcClass {
  Calc: CalcType

  Controller: ControllerType

  linkedVariables: {[key: string]: LinkedVariable}

  usedId: number[]

  logicalExpressions: {[key: string]: Expression}

  globalVariablesObject: {[key: string]: string}

  globalFunctionsObject: {[key: string]: {id: string, args: string[], definition: string}}

  constructor(_Calc: CalcType) {
    this.Calc = _Calc;
    this.Controller = _Calc.controller;
    this.logicalExpressions = {}
    this.usedId = []
    this.globalVariablesObject = {}
    this.globalFunctionsObject = {}
    this.linkedVariables = {}
    this.update();
    this.init()
  }

  init() {
    this.getExpressions().forEach((expression) => {
      if (expression.id.includes('_')) {
        const split = expression.id.split('_')
        if (split[0] === 'final') {
          this.usedId.push(parseInt(split[1]))
        } else if (/\d+/.test(split[0])) {
          const matches = [...expression.latex.matchAll(functionRegex)]
          if (matches.length > 0) { // Is a function
            this.globalFunctionsObject[matches[0][1]] = {
              id: expression.id,
              args: matches[0][2].split(','),
              definition: expression.latex.split('=')[1],
            }
          }
          if (expression.id.endsWith('_0')) {
            this.usedId.push(parseInt(split[0]))
          }
        }
      }
    })
  }

  update() {
    const expressions = this.getExpressions();
    const expressionsToSet: Expression[] = [];
    const maxNumber: {[key: number]: number} = {};
    expressions.forEach((_expression) => {
      const expression = _expression;
      if (expression.latex) {
        if (expression.latex.includes('e_{')) {
          expression.latex = expression.latex.replace('e_{', 'q_{');
          expressionsToSet.push(expression);
        }
        if (expression.id.includes('_')) {
          const split = expression.id.split('_')
          if (!['final', 'shade'].includes(split[0])) {
            const id = parseInt(split[0])
            const num = parseInt(split[1])
            if (id in maxNumber) {
              if (num > maxNumber[id]) {
                maxNumber[id] = num
              }
            } else {
              maxNumber[id] = num
            }
          }
        }
      }
    });
    this.updateExpressions(expressionsToSet);
  }

  getSelected() {
    if (this.selectedExpressionId) {
      return this.getExpression(this.selectedExpressionId);
    }
    return undefined
  }

  getExpression(_id: string) {
    if (Object.keys(this.logicalExpressions).includes(_id)) {
      return this.logicalExpressions[_id];
    } else {
      const expression = this.Controller.getItemModel(_id);
      if (expression) {
        return expression
      }
      return undefined
    }
  }

  getExpressions() {
    return this.Calc.getExpressions();
  }
  
  setLogicalExpression(expression: Expression) {
    if (!Object.keys(this.logicalExpressions).includes(expression.id)) {
      this.logicalExpressions[expression.id] = expression;
    }
  }

  get expressionAnalysis() {
    return this.Calc.expressionAnalysis;
  }

  get selectedExpressionId() {
    return this.Calc.selectedExpressionId;
  }
  
  set selectedExpressionId(id: string | undefined) {
    this.Controller.dispatch({type: "set-selected-id", id: id})
  }

  removeExpressions(expressions: Expression[]) {
    expressions.forEach((expression) => {
      const split = expression.id.split('_')
      if (['final', 'shade'].includes(split[0])) {
        const id = parseInt(split[1])
        if (this.usedId.includes(id)) {
          this.usedId = this.usedId.filter(_id => _id !== id)
        }
      } else {
        const id = parseInt(split[0])
        if (this.usedId.includes(id)) {
          this.usedId = this.usedId.filter(_id => _id !== id)
        }
      }
    })
    this.Calc.removeExpressions(expressions);
  }

  removeExpression(expression: Expression) {
    if (this.isLogical(expression.id)) {
      delete this.logicalExpressions[expression.id]
    } else {
      this.Calc.removeExpression(expression);
      const split = expression.id.split('_')
      if (['final', 'shade'].includes(split[0])) {
        const id = parseInt(split[1])
        this.usedId = this.usedId.filter(_id => _id !== id)
      } else {
        const id = parseInt(split[0])
        this.usedId = this.usedId.filter(_id => _id !== id)
      }
    }
  }

  removeExpressionById(expressionId: string) {
    if (this.isLogical(expressionId)) {
      delete this.logicalExpressions[expressionId]
    } else {
      const expression = this.getExpression(expressionId)
      if (expression) {
        this.removeExpression(expression)
      }
    }
  }

  newGraph(id: number, expressions: Expression[]) {
    if (this.usedId.includes(id)) {
      throw Error('id already in expressions list')
    } else {
      this.usedId.push(id)
      this.setExpressions(expressions);
    }
  }

  setExpressions(expressions: Expression[]) {
    const expressionsToBeCreated: Expression[] = []
    expressions.forEach((expression) => {
      if (this.getExpression(expression.id)) {
        throw Error("Tried to update create existent expression")
      } else {
        expressionsToBeCreated.push(expression)
      }
    })
    this.Calc.setExpressions(expressionsToBeCreated);
  }

  updateExpressions(expressions: Expression[]) {
    const expressionsToBeUpdated: Expression[] = []
    expressions.forEach((expression) => {
      if (this.getExpression(expression.id)) {
        expressionsToBeUpdated.push(expression)
      } else {
        throw Error("Tried to update non-existent expression")
      }
    })
    this.Calc.setExpressions(expressionsToBeUpdated);
  }

  updateExpression(expression: Partial<Expression>, _logical?: boolean) {
    const logical = !!_logical
    if (logical) {
      this.setLogicalExpression(expression as Expression);
    } else {
      this.Calc.setExpression(expression);
    }
  }

  setExpression(expression: Partial<Expression>, _logical?: boolean) {
    const logical = !!_logical
    if (logical) {
      this.setLogicalExpression(expression as Expression);
    } else {
      this.Calc.setExpression(expression);
    }
  }

  getOffset() {
    const graphContainer = document.querySelector('#graph-container') as HTMLElement
    const graphContainerRect = graphContainer.getBoundingClientRect()
    return {x: graphContainerRect.left, y: graphContainerRect.top}
  }

  pixelsToMath(point: {x: number, y: number}) {
    const {x: xOffset, y: yOffset} = this.getOffset()
    return this.Calc.pixelsToMath({
      x: point.x - xOffset,
      y: point.y - yOffset,
    });
  }

  get graphpaperBounds() {
    return this.Calc.graphpaperBounds;
  }

  getState(): State {
    return this.Calc.getState();
  }

  setState(state: State) {
    return this.Calc.setState(state);
  }

  getItemCount() {
    return this.Controller.getItemCount()
  }

  isLogical(id: string) {
    return Object.keys(this.logicalExpressions).includes(id);
  }

  dependsOn(graphId: number) {
    const expressionList = []
    const allExpressions = this.getExpressions();
    for (let i = 0; i < allExpressions.length; i++) {
      const expression = allExpressions[i];
      if (expression.latex) {
        if (usesVariable(expression.latex, graphId)) {
          expressionList.push(expression);
        }
      }
    }
    return expressionList
  }

  table (points: {x: number, y: number}[]) {
    const table = {
      id: "reg_table",
      type: "table",
      columns: [
        {
          latex: "r_{x}",
          color: "BLACK",
          id: "reg_1",
          values: points.map((point) => parseFloat(point.x.toFixed(4)))
        },
        {
          latex: "r_{y}",
          color: "BLACK",
          id: "reg_2",
          values: points.map((point) => parseFloat(point.y.toFixed(4)))
        }
      ]
    }
    return table
  }

  regression(points: {x: number, y: number}[]) {
    const newExp = {
      reg: "r_{A}r_{x}^{2}+r_{C}r_{x}^{2}+r_{D}r_{x}+r_{E}r_{y}+r_{F}\\sim0\\left\{\\frac{r_{F}^{2}}{r_{A}r_{C}}>1\\right\\}",
      reg_exp: "r_{A}r_{x}^{2}+r_{C}r_{x}^{2}+r_{D}r_{x}+r_{E}r_{y}+r_{F}\\sim0\\left\\{\\frac{r_{F}^{2}}{r_{A}r_{C}}>1\\right\\}"
    }
    this.setExpression(this.table(points))
  }

  linkedVariable(reference: number | string | null, _value ?: number) {
    if (typeof reference === 'number') {
      return new LinkedVariable(reference, _value);
    } else {
      if (reference) {
        if (reference in this.linkedVariables) {
          if (_value) {
            this.linkedVariables[reference].value = _value
          }
          return this.linkedVariables[reference]
        } else {
          return new LinkedVariable(reference, _value);
        }
      } else {
        return new LinkedVariable(reference, _value)
      }
    }
  }

  addLinkedVariable(linkedVariable: LinkedVariable) {
    if (linkedVariable.reference) {
      if (linkedVariable.reference in this.linkedVariables) {
        this.linkedVariables[linkedVariable.reference] = linkedVariable
      } else {
        this.linkedVariables[linkedVariable.reference] = linkedVariable
      }
    }
  }

  updateLinkedVariables() {
    Object.values(this.linkedVariables).forEach(linkedVariable => {
      if (linkedVariable.reference && !linkedVariable.alwaysClean) {
        this.linkedVariables[linkedVariable.reference].clean = false
      }
    })
  }

  getConicById(id: number) {
    let graph = this.getExpression(`final_${id}`)
    if (!graph) {
      graph = this.getExpression(`${id}_0`)  
      if (!graph) {
        return undefined
      }
    }
    return graph
  }

  intersectConicsById(a: number, b: number) {
    const aExpression = this.getConicById(a)
    const bExpression = this.getConicById(b)

    if (aExpression && bExpression) {
      const aGraph = createGraphObject(aExpression)
      const bGraph = createGraphObject(bExpression)

      intersectConics(aGraph, bGraph)
    }
  }
}