function compareNum(a: number,b: number) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export interface Coordinate {
    x: number,
    y: number
}

function findInflectionPoints(
    p1: Coordinate,
    p2: Coordinate,
    p3: Coordinate,
    p4: Coordinate,
){
  var ax = -p1.x + 3*p2.x - 3*p3.x + p4.x;
  var bx = 3*p1.x - 6*p2.x + 3*p3.x;
  var cx = -3*p1.x + 3*p2.x;

  var ay = -p1.y + 3*p2.y - 3*p3.y + p4.y;
  var by = 3*p1.y - 6*p2.y + 3*p3.y;
  var cy = -3*p1.y + 3*p2.y;
  var a = 3*(ay*bx-ax*by);
  var b = 3*(ay*cx-ax*cy);
  var c = by*cx-bx*cy;
  var r2 = b*b - 4*a*c;
  var firstIfp = 0;
  var secondIfp = 0;
  if (r2>=0 && a!==0)
  {
    var r = Math.sqrt(r2);
    firstIfp = (-b + r) / (2*a);
    secondIfp = (-b - r) / (2*a);
    if ((firstIfp>0 && firstIfp<1) && (secondIfp>0 && secondIfp<1))
    {
      if (firstIfp>secondIfp)
      {
        var tmp = firstIfp;
        firstIfp = secondIfp;
        secondIfp = tmp;
      }
      if (secondIfp-firstIfp > 0.00001)
        return [firstIfp, secondIfp];
      else return [firstIfp];
    }
    else if (firstIfp>0 && firstIfp<1)
      return [firstIfp];
    else if (secondIfp>0 && secondIfp<1)
    {
      firstIfp = secondIfp;
      return [firstIfp];
    }
    return [];
  }
  else return [];
}

export function getCriticalPoints(
    p1: Coordinate,
    c1: Coordinate,
    c2: Coordinate,
    p2: Coordinate,
){
    var a = (c2.x - 2 * c1.x + p1.x) - (p2.x - 2 * c2.x + c1.x),
    b = 2 * (c1.x - p1.x) - 2 * (c2.x - c1.x),
    c = p1.x - c1.x,
    t1 = (-b + Math.sqrt(b * b - 4 * a * c)) / 2 / a,
    t2 = (-b - Math.sqrt(b * b - 4 * a * c)) / 2 / a
    const tvalues: number[]=[];
    Math.abs(t1) > 1e12 && (t1 = 0.5);
    Math.abs(t2) > 1e12 && (t2 = 0.5);
    if (t1 >= 0 && t1 <= 1 && tvalues.indexOf(t1)==-1) tvalues.push(t1)
    if (t2 >= 0 && t2 <= 1 && tvalues.indexOf(t2)==-1) tvalues.push(t2);

    a = (c2.y - 2 * c1.y + p1.y) - (p2.y - 2 * c2.y + c1.y);
    b = 2 * (c1.y - p1.y) - 2 * (c2.y - c1.y);
    c = p1.y - c1.y;
    t1 = (-b + Math.sqrt(b * b - 4 * a * c)) / 2 / a;
    t2 = (-b - Math.sqrt(b * b - 4 * a * c)) / 2 / a;
    Math.abs(t1) > 1e12 && (t1 = 0.5);
    Math.abs(t2) > 1e12 && (t2 = 0.5);
    if (t1 >= 0 && t1 <= 1 && tvalues.indexOf(t1)==-1) tvalues.push(t1);
    if (t2 >= 0 && t2 <= 1 && tvalues.indexOf(t2)==-1) tvalues.push(t2);

    var inflectionpoints = findInflectionPoints(p1, c1, c2, p2);
    if (inflectionpoints[0]) tvalues.push(inflectionpoints[0]);
    if (inflectionpoints[1]) tvalues.push(inflectionpoints[1]);

    tvalues.sort(compareNum);
    return tvalues;
};

class CPoint {
    X: number
    Y: number
    constructor (x: number, y: number) {
        this.X = x
        this.Y = y
    }
}

export function subdivideCubic(
    m_p1: Coordinate,
    m_p2: Coordinate,
    m_p3: Coordinate,
    m_p4: Coordinate,
    t: number)
{
    var arg = arguments;
    if (arg.length!=9) return [];
    var p1p = new CPoint(m_p1.x + (m_p2.x - m_p1.x) * t,
                        m_p1.y + (m_p2.y - m_p1.y) * t);
    var p2p = new CPoint(m_p2.x + (m_p3.x - m_p2.x) * t,
                        m_p2.y + (m_p3.y - m_p2.y) * t);
    var p3p = new CPoint(m_p3.x + (m_p4.x - m_p3.x) * t,
                        m_p3.y + (m_p4.y - m_p3.y) * t);
    var p1d = new CPoint(p1p.X + (p2p.X - p1p.X) * t,
                        p1p.Y + (p2p.Y - p1p.Y) * t);
    var p2d = new CPoint(p2p.X + (p3p.X - p2p.X) * t,
                        p2p.Y + (p3p.Y - p2p.Y) * t);
    var p1t = new CPoint(p1d.X + (p2d.X - p1d.X) * t,
                        p1d.Y + (p2d.Y - p1d.Y) * t);
    return [[m_p1.x, m_p1.y, p1p.X, p1p.Y, p1d.X, p1d.Y, p1t.X, p1t.Y],
            [p1t.X, p1t.Y, p2d.X, p2d.Y, p3p.X, p3p.Y, m_p4.x, m_p4.y]];
}

function bezierMinMax(
    p1: Coordinate,
    p2: Coordinate,
    p3: Coordinate,
    p4: Coordinate
){
    var tvalues = [], xvalues = [], yvalues = [],
        a, b, c, t, t1, t2, b2ac, sqrtb2ac;
    for (var i = 0; i < 2; ++i) {
        if (i == 0) {
            b = 6 * p1.x - 12 * p2.x + 6 * p3.x;
            a = -3 * p1.x + 9 * p2.x - 9 * p3.x + 3 * p4.x;
            c = 3 * p2.x - 3 * p1.x;
        } else {
            b = 6 * p1.y - 12 * p2.y + 6 * p3.y;
            a = -3 * p1.y + 9 * p2.y - 9 * p3.y + 3 * p4.y;
            c = 3 * p2.y - 3 * p1.y;
        }
        if (Math.abs(a) < 1e-12) {
            if (Math.abs(b) < 1e-12) {
                continue;
            }
            t = -c / b;
            if (0 < t && t < 1) {
                tvalues.push(t);
            }
            continue;
        }
        b2ac = b * b - 4 * c * a;
        if (b2ac < 0) {
            if (Math.abs(b2ac) < 1e-12) {
                t = -b / (2 * a);
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
            }
            continue;
        }
        sqrtb2ac = Math.sqrt(b2ac);
        t1 = (-b + sqrtb2ac) / (2 * a);
        if (0 < t1 && t1 < 1) {
            tvalues.push(t1);
        }
        t2 = (-b - sqrtb2ac) / (2 * a);
        if (0 < t2 && t2 < 1) {
            tvalues.push(t2);
        }
    }
  
    var j = tvalues.length, mt;
    while (j--) {
        t = tvalues[j];
        mt = 1 - t;
        xvalues[j] = (mt * mt * mt * p1.x) + (3 * mt * mt * t * p2.x) + (3 * mt * t * t * p3.x) + (t * t * t * p4.x);
        yvalues[j] = (mt * mt * mt * p1.y) + (3 * mt * mt * t * p2.y) + (3 * mt * t * t * p3.y) + (t * t * t * p4.y);
    }
  
    xvalues.push(p1.x,p4.x);
    yvalues.push(p1.y,p4.y);
  
    return {
        min: {x: Math.min.apply(0, xvalues), y: Math.min.apply(0, yvalues)},
        max: {x: Math.max.apply(0, xvalues), y: Math.max.apply(0, yvalues)}
    };
}