import { parse } from "svg-parser"
import { CommandMadeAbsolute, makeAbsolute, parseSVG } from "svg-path-parser"
import { MyCalc, createGraphWithBounds } from "../index.user"
import { bezierMinMax } from "../lib/bezierLib"
import { createBezier, createLineSegment, dist } from "../lib/lib"
import { Coordinate } from "../lib/mathLib"
import { svgArcToCenterParam } from "../lib/svgLib"

export class HaxProcessor {
  lastControlPoint: {
    cubic: Coordinate
    quadratic: Coordinate
  }
  paths: {
    command: CommandMadeAbsolute,
    details: {
      dx: number,
      dy: number,
      color: string,
      isStart: boolean,
    }
  }[]
  haxIndex: number
  haxOnTick: boolean
	constructor() {
    this.paths = []
    this.haxIndex = 0
    this.lastControlPoint = {
      cubic: { x: 0, y: 0 },
      quadratic: { x: 0, y: 0 },
    }
    this.haxOnTick = false
	}

	tick() {
    if (this.haxOnTick) {
      this.nextHax()
    }
	}

	consoleSVG(n: number) {
    console.log(this.paths[n])
  }
  
  hax(n: number) {
    this.allHax(this.paths[n])
  }

  nextHax() {
    if (this.haxIndex < this.paths.length) {
      this.allHax(this.paths[this.haxIndex])
      this.haxIndex += 1
    } else {
      this.haxOnTick = false
    }
  }

  xhr () {
    const url = "http://localhost:8010/proxy/attachments/831873240694652948/906153339161554944/feather.svg"
    let paths: {d: string, style?: string, transform?: string}[] = []
    fetch(url)
      .then( r => r.text() )
      .then( t => {
        const svg = parse(t)
        const child1 = svg.children[0]
        if (child1.type === "element") {
          const child2 = child1.children[0]
          if (typeof child2 !== "string") {
            if (child2.type === "element") {
              paths = child2.children.map(child => {
                if (typeof child !== "string") {
                  if (child.type === "element") {
                    return child.properties as any
                  }
                }
              })
            }
          }
        }
        this.paths = []
        paths.forEach((path) => {
          let transform = ""
          let _dx = "0"
          let _dy = "0"

          let style = ""
          let color = "#000000"
          if (path.transform) {
            [transform, _dx, _dy] = [...path.transform.matchAll(/translate\((-?\d+(?:.\d+)?) (-?\d+(?:.\d+)?)\)/g)][0]
          }
          if (path.style) {
            [style, color] = [...path.style.matchAll(/fill: (#[0-9a-f]{6})/g)][0]
          }
          const commands = makeAbsolute(parseSVG(path.d))
          const newCommands = commands.map((_command, index) => {
            return {
              command: _command,
              details: {
                dx: parseFloat(_dx),
                dy: parseFloat(_dy),
                color,
                isStart: index === 0
              }
            }
          })
          this.paths.push(...newCommands)
        })
      })
  }

	allHax(_paths: {
		command: CommandMadeAbsolute,
		details: {
			dx: number,
			dy: number,
			color: string,
			isStart: boolean,
		}
	}) {
		let startId = MyCalc.globalId;
		const paths = _paths
		const stroke = paths.command
		const {dx, dy, color} = paths.details
		let startPos;
		if (startId !== 1) {
			// finalize(`${startId - 1}_0`, startId - 1)
		}
		if (stroke.command === 'moveto') {
			if (paths.details.isStart) {
				startPos = {
					x: stroke.x,
					y: -stroke.y,
				}
			}
		} else if (stroke.command === 'horizontal lineto' || stroke.command === 'vertical lineto' || stroke.command === 'lineto') {
			const p1 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
			const p2 = {x: stroke.x + dx, y: -stroke.y - dy}
			if (dist(p1, p2) > MyCalc.minRes) {
				const defArray = [
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
					Math.floor(p2.x / MyCalc.minRes),
					Math.floor(p2.y / MyCalc.minRes)
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createLineSegment(p1, p2, startId, {finalize: true})
				} else {
					console.log('skip')
				}
			}
			this.lastControlPoint.cubic = { x: 0, y: 0 }
			this.lastControlPoint.quadratic = { x: 0, y: 0 }
		} else if (stroke.command === 'curveto') {
			const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
			const p1 = {x: stroke.x1 + dx, y: -stroke.y1 - dy}
			const p2 = {x: stroke.x2 + dx, y: -stroke.y2 - dy}
			this.lastControlPoint.cubic = p2
			this.lastControlPoint.quadratic = { x: 0, y: 0 }
			const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
			const minMax = bezierMinMax(p0, p1, p2, p3)
			if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
			} else {
				const defArray = [
					Math.floor(p0.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
					Math.floor(p2.x / MyCalc.minRes),
					Math.floor(p2.y / MyCalc.minRes),
					Math.floor(p3.x / MyCalc.minRes),
					Math.floor(p3.y / MyCalc.minRes),
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createBezier({p1: p0, p2: p1, p3: p2, p4: p3}, startId, {hideHandles: true, hidePoints: true, finalize: true})
				} else {
					console.log('skip')
				}
			}
		} else if (stroke.command === 'smooth curveto') {
			const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
			const p1 = {
				x: 2 * stroke.x0 - this.lastControlPoint.cubic.x + 2 * dx,
				y: 2 * -stroke.y0 - this.lastControlPoint.cubic.y - 2 * dy,
			}
			const p2 = {x: stroke.x2 + dx, y: -stroke.y2 - dy}
			this.lastControlPoint.cubic = p2
			this.lastControlPoint.quadratic = { x: 0, y: 0 }
			const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
			const minMax = bezierMinMax(p0, p1, p2, p3)
			if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
			} else {
				const defArray = [
					Math.floor(p0.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
					Math.floor(p2.x / MyCalc.minRes),
					Math.floor(p2.y / MyCalc.minRes),
					Math.floor(p3.x / MyCalc.minRes),
					Math.floor(p3.y / MyCalc.minRes),
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createBezier({p1: p0, p2: p1, p3: p2, p4: p3}, startId, {hideHandles: true, hidePoints: true, finalize: true})
				} else {
					console.log('skip')
				}
			}
		} else if (stroke.command === 'elliptical arc') {
			const r = stroke.rx
			const centerParam = svgArcToCenterParam(stroke.x0, stroke.y0, r, r, 0, stroke.largeArc, stroke.sweep, stroke.x, stroke.y)
			centerParam.cx = centerParam.cx + dx
			centerParam.cy = -centerParam.cy - dy
			const p1x = stroke.x0 + dx
			const p1y = - stroke.y0 - dy
			const p2x = stroke.x + dx
			const p2y = - stroke.y - dy
			const defArray = [
				Math.floor(p1x / MyCalc.minRes),
				Math.floor(p1y / MyCalc.minRes),
				Math.floor(p2x / MyCalc.minRes),
				Math.floor(p2y / MyCalc.minRes),
				Math.floor(centerParam.cx / MyCalc.minRes),
				Math.floor(centerParam.cy / MyCalc.minRes),
			].sort().toString()
			if (!MyCalc.doneLines.has(defArray)) {
				MyCalc.doneLines.add(defArray)
				createGraphWithBounds(startId, "circle", {
					h: centerParam.cx,
					k: centerParam.cy,
					r: r
				},{
					xMin: Math.min(p1x, p2x),
					yMin: Math.min(p1y, p2y),
					xMax: Math.max(p1x, p2x),
					yMax: Math.max(p1y, p2y),
				},{hideAll: true, finalize: true})
			} else {
				console.log('skip')
			}
			startId += 1
			MyCalc.globalId = startId
			this.lastControlPoint.cubic = { x: 0, y: 0 }
			this.lastControlPoint.quadratic = { x: 0, y: 0 }
		} else if (stroke.command === 'closepath') {
			if (stroke.x0 != stroke.x && stroke.y0 != stroke.y) {
				const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
				const p1 = {x: stroke.x + dx, y: -stroke.y - dy}
				const defArray = [
					Math.floor(p0.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createLineSegment(p0, p1, startId, {finalize: true})
				} else {
					console.log('skip')
				}
			}
			this.lastControlPoint.cubic = { x: 0, y: 0 }
			this.lastControlPoint.quadratic = { x: 0, y: 0 }
		} else if (stroke.command === 'quadratic curveto') {
			const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
			let p1 = {x: stroke.x1 + dx, y: -stroke.y1 - dy}
			const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
			this.lastControlPoint.quadratic = { x: p1.x, y: p1.y }
			p1 = {
				x: p0.x / 3 + 2 * p1.x / 3,
				y: p0.y / 3 + 2 * p1.y / 3,
			}
			const p2 = {
				x: 2 * p1.x / 3 + p3.x / 3,
				y: 2 * p1.y / 3 + p3.y / 3,
			}
			const minMax = bezierMinMax(p0, p1, p2, p3)
			if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
			} else {
				const defArray = [
					Math.floor(p0.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
					Math.floor(p2.x / MyCalc.minRes),
					Math.floor(p2.y / MyCalc.minRes),
					Math.floor(p3.x / MyCalc.minRes),
					Math.floor(p3.y / MyCalc.minRes),
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createBezier({p1: p0, p2: p1, p3: p2, p4: p3}, startId, {hideHandles: true, hidePoints: true, finalize: true})
				} else {
					console.log('skip')
				}
			}
		} else if (stroke.command === 'smooth quadratic curveto') {
			const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
			let p1 = {
				x: 2 * stroke.x0 - this.lastControlPoint.quadratic.x + 2 * dx,
				y: 2 * -stroke.y0 - this.lastControlPoint.quadratic.y - 2 * dy,
			}
			const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
			this.lastControlPoint.cubic = { x: 0, y: 0 }
			this.lastControlPoint.quadratic = { x: p1.x, y: p1.y }
			p1 = {
				x: p0.x / 3 + 2 * p1.x / 3,
				y: p0.y / 3 + 2 * p1.y / 3,
			}
			const p2 = {
				x: 2 * p1.x / 3 + p3.x / 3,
				y: 2 * p1.y / 3 + p3.y / 3,
			}
			const minMax = bezierMinMax(p0, p1, p2, p3)
			if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
			} else {
				const defArray = [
					Math.floor(p0.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.x / MyCalc.minRes),
					Math.floor(p1.y / MyCalc.minRes),
					Math.floor(p2.x / MyCalc.minRes),
					Math.floor(p2.y / MyCalc.minRes),
					Math.floor(p3.x / MyCalc.minRes),
					Math.floor(p3.y / MyCalc.minRes),
				].sort().toString()
				if (!MyCalc.doneLines.has(defArray)) {
					MyCalc.doneLines.add(defArray)
					createBezier({p1: p0, p2: p1, p3: p2, p4: p3}, startId, {hideHandles: true, hidePoints: true, finalize: true})
				} else {
					console.log('skip')
				}
			}
		}
	}
}