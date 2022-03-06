import { getGraphTypeFromStandard } from "../actions/convertFromStandard"
import { unfinalize, finalize } from "../actions/finalize"
import { hideCropLines } from "../actions/hideCropLines"
import { Bezier } from "../graphs/Bezier"
import { LinkedVariable, isBaseExpression, getIdParts, isFinal, functionRegex, createGraphObject, substituteToAll, getVariablesNeeded, transformBezier, substituteFromId, usesVariable, setVariable } from "../lib/lib"
import { CalcType, ControllerType, State } from "../types/desmosTypes"
import { Expression, InputBaseExpression, TableExpression, MinBaseExpression, BaseExpression } from "../types/types"
import { HaxProcessor } from "./HaxProcessor"
import { VirtualCalc } from "./VirtualCalc"

export class MyCalcClass {
  Calc: CalcType
  Controller: ControllerType
  linkedVariables: {[key: string]: LinkedVariable}
  usedId: Set<number>
  logicalExpressions: {[key: string]: Expression}
  globalFunctionsObject: {[key: string]: {id: string, args: string[], definition: string}}
  expressionsToRemove: {beforeRemove: string, expressions: Expression[]}[]
  globalId: number
  isProcessing: boolean
  toFinalizeId: Set<string>
  isProcessingFinalize: boolean
  minRes: number
  doneLines: Set<string>
  precision: number
  existingExpressions: Set<string>
  haxProcessor: HaxProcessor
  virtualCalc: VirtualCalc
  constructor(_Calc: CalcType) {
    this.Calc = _Calc;
    this.Controller = _Calc.controller;
    this.logicalExpressions = {}
    this.usedId = new Set<number>()
    this.globalFunctionsObject = {}
    this.linkedVariables = {}
    this.expressionsToRemove = []
    this.globalId = 1
    this.isProcessing = false
    this.toFinalizeId = new Set<string>()
    this.isProcessingFinalize = false
    this.minRes = 0
    this.doneLines = new Set<string>()
    this.existingExpressions = new Set<string>()
    this.precision = 6;
    this.haxProcessor = new HaxProcessor()
    this.virtualCalc = new VirtualCalc()
    this.update();
    this.init()
  }

  unfinalizeAll() {
    const expressions = this.getExpressions()
      .filter(isBaseExpression)
      .map(x => getIdParts(x.id))
      .filter(isFinal)
    expressions.forEach(x => unfinalize(x))
    expressions.forEach(x => {
      try {
        hideCropLines(getIdParts(`${x.graphId}_0`))
      } catch {
        console.log('you suck')
      }
    })
  }

  init() {
    this.getExpressions().forEach((expression) => {
      if (isBaseExpression(expression)) {
        const id = getIdParts(expression.id)
        if (id.isEditable) {
          const matches = [...expression.latex.matchAll(functionRegex)]
          if (matches.length > 0) { // Is a function
            this.globalFunctionsObject[matches[0][1]] = {
              id: expression.id,
              args: matches[0][2].split(','),
              definition: expression.latex.split('=')[1],
            }
          }
          if (id.graphId === 0) {
            this.usedId.add(id.graphId)
          }
        } else if (id.isFinal) {
          this.usedId.add(id.graphId)
        }
      }
    })
    setInterval(() => this.tick(), 100);
  }

  update() {
    const expressions = this.getExpressions();
    const expressionsToSet: Expression[] = [];
    const maxNumber: {[key: number]: number} = {};
    expressions.forEach((_expression) => {
      const expression = _expression;
      if (isBaseExpression(expression)) {
        if (expression.latex) {
          if (expression.latex.includes('e_{')) {
            expression.latex = expression.latex.replace('e_{', 'q_{');
            expressionsToSet.push(expression);
          }
          if (expression.id.includes('_')) {
            const split = expression.id.split('_')
            if (split[0] === 'final') {
              // const graphId = parseInt(split[1])
              if (!expression.label) {
                const graphType = getGraphTypeFromStandard(expression.latex)
                expression.label = JSON.stringify({
                  graphType
                })
                expressionsToSet.push(expression)
              }
            } else if (!['final', 'shade'].includes(split[0])) {
              const id = parseInt(split[0])
              const graphId = parseInt(split[1])
              if (id in maxNumber) {
                if (graphId > maxNumber[id]) {
                  maxNumber[id] = graphId
                }
              } else {
                maxNumber[id] = graphId
              }
              if (graphId === 0) {
                if (!expression.label) {
                  const graphObject = createGraphObject(expression)
                  graphObject.label = JSON.stringify({
                    graphType: graphObject.graphType
                  })
                  expressionsToSet.push(graphObject)
                }
              }
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
    }
  }

  getExpressions() {
    return this.Calc.getExpressions();
  }
  
  setLogicalExpression(expression: InputBaseExpression | TableExpression) {
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

  removeExpressions(expressions: Partial<Expression>[]) {
    expressions.forEach((expression) => {
      if (!expression.id) {
        throw Error("Expression without id")
      }
      const id = getIdParts(expression.id);
      if (id.isFinal || id.isEditable) {
        if (this.usedId.has(id.graphId)) {
          this.usedId.delete(id.graphId)
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
      const id = getIdParts(expression.id);
      if (id.isFinal || id.isEditable) {
        if (this.usedId.has(id.graphId)) {
          this.usedId.delete(id.graphId)
        }
      }
    }
  }

  removeExpressionById(_id: string) {
    const id = getIdParts(_id)
    if (id.isEditable || id.isFinal) {
      if (this.isLogical(id.id)) {
        const allExpressions = this.getExpressions()
        const expressionList = substituteToAll(allExpressions, id.graphId)
        this.updateExpressions(expressionList)
        delete this.logicalExpressions[id.id]
      } else {
        const expression = this.getExpression(id.id)
        if (expression) {
          this.removeExpression(expression)
        }
      }
    }
  }

  newGraph(id: number, expressions: MinBaseExpression[]) {
    if (this.usedId.has(id)) {
      throw Error('id already in expressions list')
    } else {
      this.setExpressions(expressions);
      this.usedId.delete(id)
    }
  }

  tick(this: MyCalcClass) {
    this.haxProcessor.tick()
    // this.updateVariables()
    if (this.expressionsToRemove && !this.isProcessing) {
      this.isProcessing = true
      this.expressionsToRemove.forEach((expressionGroup) => {
        const success = true
        if (expressionGroup.beforeRemove === 'update') {
          this.updateVariables()
          const baseExpression = expressionGroup.expressions[0]
          if (isBaseExpression(baseExpression)) {
            this.removeExpressionById(baseExpression.latex.split('_')[0])
          }
        }
        if (success) {
          this.removeExpressions(expressionGroup.expressions)
        }
      })
      this.isProcessing = false
    }
    
    if (this.toFinalizeId && !this.isProcessingFinalize) {
      this.isProcessingFinalize = true
      this.toFinalizeId.forEach((_id: string) => {
        const id = getIdParts(_id)
        const expression = this.getExpression(id.id)
        if (expression && isBaseExpression(expression)) {
          if (expression.id.endsWith('_0')) { 
            const variablesNeeded = getVariablesNeeded(expression.latex)
              .map((variable) => variable[0])
            let values: {[key: string]: LinkedVariable} = {}
            const graphObject = createGraphObject(expression)
            let hasValues = false
            values = {}
            try {
              values = graphObject.getGraphVariables()
              hasValues = true
            } catch {
              
            }
            if (hasValues) {
            // console.log(Object.entries(values).map(value => `${value[1].reference}:${value[1].value}`).join(','))
              if (Object.values(values).every(value => value.value)) {
                if (graphObject instanceof Bezier) {
                  transformBezier(graphObject.id)
                  this.expressionsToRemove.push({
                    beforeRemove: "update",
                    expressions: [graphObject.toExpression()]
                  })
                } else {
                  this.updateVariables()
                  if (id.isEditable) {
                    finalize(id)
                  }
                }
                this.toFinalizeId.delete(id.id)
              }
            }
          }
        }
      })
      this.isProcessingFinalize = false
    }
  }

  deleteById(_id: string) {
    if (_id.includes('_')) {
      if (['shade', 'final'].includes(_id.split('_')[0])) {
        const expression = this.getExpression(_id);
        if (expression) {
          this.removeExpression(expression);
        }
      } else {
        const graphId = parseInt(_id.split('_')[0]);
        const idFilter = `${graphId}_`;
        let filteredExpressions = this.getExpressions();
        filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
        this.removeExpressions(filteredExpressions);
        // this.removeExpressions(this.dependsOn(parseInt(currId)))
        const expressionList = this.dependsOn(graphId).map((_expression) => {
          const expression = _expression
          expression.latex = substituteFromId(expression.latex, graphId)
          return expression
        })
        this.updateExpressions(expressionList); 
      }
    }
  }

  setExpressions(expressions: Expression[]) {
    const expressionsToBeCreated: Expression[] = []
    expressions.forEach((expression) => {
      if (expression.id) {
        if (this.getExpression(expression.id)) {
          throw Error("Tried to update create existent expression")
        } else {
          expressionsToBeCreated.push(expression)
        }
      }
    })
    this.virtualCalc.setExpressions(expressionsToBeCreated)
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
    this.virtualCalc.setExpressions(expressionsToBeUpdated)
    this.Calc.setExpressions(expressionsToBeUpdated);
  }

  updateExpression(expression: BaseExpression, _logical?: boolean) {
    const logical = !!_logical
    if (logical) {
      this.setLogicalExpression(expression);
    } else {
      this.Calc.setExpression(expression);
    }
  }

  setExpression(expression: InputBaseExpression | TableExpression, _logical?: boolean) {
    const logical = !!_logical
    if (logical) {
      this.setLogicalExpression(expression);
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
      if (isBaseExpression(expression)) {
        if (expression.latex) {
          if (usesVariable(expression.latex, graphId)) {
            expressionList.push(expression);
          }
        }
      }
    }
    return expressionList
  }

  table (points: {x: number, y: number}[]) {
    const table: TableExpression = {
      id: "reg_table",
      type: "table",
      columns: [
        {
          latex: "r_{x}",
          color: "BLACK",
          id: "reg_1",
          values: points.map((point) => point.x.toFixed(this.precision))
        },
        {
          latex: "r_{y}",
          color: "BLACK",
          id: "reg_2",
          values: points.map((point) => point.y.toFixed(this.precision))
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

  linkedVariable(reference: number): LinkedVariable
  linkedVariable(reference: string, _value ?: number): LinkedVariable
  linkedVariable(reference: number): LinkedVariable
  linkedVariable(reference: number | string | {[key: string]: number} | null, _value ?: number) {
    if (typeof reference === 'number') {
      return new LinkedVariable(reference, _value);
    } else if (typeof reference === 'object') {
      if (reference) {
        const newReference: {[key: string]: LinkedVariable} = {}
        Object.entries(reference)
          .forEach(pair => {
            newReference[pair[0]] = this.linkedVariable(pair[1])
          })
        return newReference;
      }
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
    throw Error("thing broke")
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

    if (aExpression && isBaseExpression(aExpression) && bExpression && isBaseExpression(bExpression)) {
      const aGraph = createGraphObject(aExpression)
      const bGraph = createGraphObject(bExpression)

      // if (aGraph.isConic && bGraph.isConic) {
      //   intersectConics(aGraph, bGraph)
      // }
    }
  }

  updateVariables(filter ? : string) {
    // Object.keys(this.globalVariablesObject).forEach(key => {
    //   delete this.globalVariablesObject[key];
    // })
    let currExpressions = this.getExpressions();
    if (filter) {
      const idFilter = `${filter}_`;
      currExpressions = currExpressions.filter((x) => x.id.startsWith(idFilter));
    }
    for (let i = 0; i < currExpressions.length; i++) {
      const expression = currExpressions[i];
      const analysis = this.expressionAnalysis[expression.id];
      if (analysis && isBaseExpression(expression)) {
        if (analysis.evaluation) {
          if (analysis.evaluation.type === 'Number') {
            const variable = expression.latex.split('=')[0];
            if (variable.includes('_') && !(['x', 'y'].includes(variable))) {
              setVariable(variable, analysis.evaluation.value.toString());
            }
          }
        } else if (expression.latex) {
          if (expression.latex.includes('f_')) {
            // console.log(expression);
          }
        }
      }
    }
  }
}