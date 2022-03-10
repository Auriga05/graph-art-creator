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
  isShifting = false;
  keyDownFired = false;
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
    if (!e.shiftKey) {
      if (this.isShifting) {
        e.preventDefault()
        this.onChange()
        virtualCalc.onUnshift()
      }
      this.isShifting = false
    }
    // this.onChange()
    // e.preventDefault();
  }

  keyDownHandler(e: KeyboardEvent) {
    if (e.shiftKey) {
      if (!this.isShifting) {
        e.preventDefault()
        this.onChange()
        virtualCalc.onShift()
      }
      this.isShifting = true
    }
    if (e.altKey) {
      e.preventDefault();
      if (e.key === "1") {
        this.onChange()
        virtualCalc.addGraph("ellipse_or_hyperbola")
      } else if (e.key === "2") {
        this.onChange()
        virtualCalc.addGraph("bezier")
      } else if (e.key === "a") {
        this.onChange()
        virtualCalc.setFocus(null)
      } else if (e.key === "s") {
        this.onChange()
        virtualCalc.save()
      } else if (e.key === "c") {
        this.onChange()
        virtualCalc.removeGraph()
      }
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
