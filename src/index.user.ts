import { Graph } from "./classes/Graph";
import { VirtualCalcClass } from "./classes/VirtualCalc";
import { CalcType } from "./types/desmosTypes";

declare const Calc: CalcType;
declare const unsafeWindow: { Graph ?: typeof Graph
  onload: number
  document: Document
  changeColor: () => void
  changegraphType: () => void
  deleteById: (_id: string) => void
  createConicHandler: () => void
  toggleArtist: () => void
  id: number
  idSet: boolean
  VirtualCalc: VirtualCalcClass
};

export let virtualCalc: VirtualCalcClass;

class App {
  constructor() {
    document.addEventListener('keydown', (e) => this.keyDownHandler(e), false);
    document.addEventListener('keyup', (e) => this.keyUpHandler(e), false);
    document.addEventListener('pointerup', (e) => this.mouseUpHandler(e), false);
    document.addEventListener('pointerdown', (e) => this.mouseDownHandler(e), false);
    
    virtualCalc = new VirtualCalcClass(Calc)
    unsafeWindow.VirtualCalc = virtualCalc;
    unsafeWindow.Graph = Graph;
  }

  keyUpHandler(e: KeyboardEvent) {
    return
    // this.onChange()
    // e.preventDefault();
  }

  keyDownHandler(e: KeyboardEvent) {
    this.onChange()
    if (e.altKey) {
      if (e.key === "1") {
        virtualCalc.addGraph("circle")
      } else if (e.key === "2") {
        virtualCalc.addGraph("ellipse")
      }
      
      if (e.key === "a") {
        virtualCalc.setFocus(null)
      }
      if (e.key === "x") {
        virtualCalc.removeGraph()
      }
      e.preventDefault();
    }
  }

  mouseUpHandler(e: PointerEvent) {
    this.onChange()
    // e.preventDefault();
  }

  mouseDownHandler(e: PointerEvent) {
    this.onChange()
    // e.preventDefault();
  }
  
  onChange() {
    virtualCalc.onChange()
    virtualCalc.updateVariables()
  }
  
  getOffset() {
    const graphContainer = document.querySelector('#graph-container') as HTMLElement
    const graphContainerRect = graphContainer.getBoundingClientRect()
    return {x: graphContainerRect.left, y: graphContainerRect.top}
  }

  pixelsToMath(point: {x: number, y: number}) {
    const {x: xOffset, y: yOffset} = this.getOffset()
    return virtualCalc.Calc.pixelsToMath({
      x: point.x - xOffset,
      y: point.y - yOffset,
    });
  }
}

(async () => {
  while (typeof Calc === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const app = new App();
})();
