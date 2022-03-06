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
  virtualCalc = new VirtualCalcClass(Calc);
  constructor() {
    document.addEventListener('keydown', this.keyDownHandler, false);
    document.addEventListener('keyup', this.keyUpHandler, false);
    document.addEventListener('pointerup', this.mouseUpHandler, false);
  
    unsafeWindow.VirtualCalc = virtualCalc;
    unsafeWindow.Graph = Graph;
  }

  keyUpHandler(e: KeyboardEvent) {
    e.preventDefault();
  }

  keyDownHandler(e: KeyboardEvent) {
    if (e.altKey) {
      if (e.key === "1") {
        console.log("circle")
      }
    }
    e.preventDefault();
  }

  mouseUpHandler(e: PointerEvent) {
    e.preventDefault();
  }
}

(async () => {
  while (typeof Calc === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const app = new App();
})();
