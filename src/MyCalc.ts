import { Expression, functionRegex, LinkedVariable, usesVariable } from "./lib";

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
          if (!['final', 'shade'].includes(split[1])) {
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
    console.log(maxNumber)
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
    this.Calc.removeExpressions(expressions);
  }

  removeExpression(expression: Expression) {
    if (this.isLogical(expression.id)) {
      delete this.logicalExpressions[expression.id]
    } else {
      this.Calc.removeExpression(expression);
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
    this.Calc.controller.getItemCount()
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
          latex: "x_{1}",
          color: "BLACK",
          id: "reg_1",
          values: [points.map((point) => point.x.toString())]
        },
        {
          latex: "y_{1}",
          color: "BLACK",
          id: "reg_2",
          values: [points.map((point) => point.y.toString())]
        }
      ]
    }
    return table
  }

  regression(points: {x: number, y: number}[]) {
    this.setExpression(this.table(points))
  }

  linkedVariable(reference: number | string | null, _value ?: number) {
    if (typeof reference === 'number') {
      return new LinkedVariable(reference, _value);
    } else {
      if (reference) {
        if (reference in this.linkedVariables) {
          if (_value) {console.log(`Set ${reference} to ${_value} from ${this.linkedVariables[reference].value}`)
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
        console.log(`Set ${linkedVariable.reference} to ${linkedVariable.value} from ${this.linkedVariables[linkedVariable.reference].value}`)
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
}