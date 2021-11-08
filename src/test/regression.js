// Lower Upper Solver
function lusolve(A, b, update) {
	var lu = ludcmp(A, update)
	if (lu === undefined) return // Singular Matrix!
	return lubksb(lu, b, update)
}
 
// Lower Upper Decomposition
function ludcmp(A, update) {
	// A is a matrix that we want to decompose into Lower and Upper matrices.
	var d = true
	var n = A.length
	var idx = new Array(n) // Output vector with row permutations from partial pivoting
	var vv = new Array(n)  // Scaling information
 
	for (var i=0; i<n; i++) {
		var max = 0
		for (var j=0; j<n; j++) {
			var temp = Math.abs(A[i][j])
			if (temp > max) max = temp
		}
		if (max == 0) return // Singular Matrix!
		vv[i] = 1 / max // Scaling
	}
 
	if (!update) { // make a copy of A 
		var Acpy = new Array(n)
		for (var i=0; i<n; i++) {		
			var Ai = A[i] 
			Acpyi = new Array(Ai.length)
			for (j=0; j<Ai.length; j+=1) Acpyi[j] = Ai[j]
			Acpy[i] = Acpyi
		}
		A = Acpy
	}
 
	var tiny = 1e-20 // in case pivot element is zero
	for (var i=0; ; i++) {
		for (var j=0; j<i; j++) {
			var sum = A[j][i]
			for (var k=0; k<j; k++) sum -= A[j][k] * A[k][i];
			A[j][i] = sum
		}
		var jmax = 0
		var max = 0;
		for (var j=i; j<n; j++) {
			var sum = A[j][i]
			for (var k=0; k<i; k++) sum -= A[j][k] * A[k][i];
			A[j][i] = sum
			var temp = vv[j] * Math.abs(sum)
			if (temp >= max) {
				max = temp
				jmax = j
			}
		}
		if (i <= jmax) {
			for (var j=0; j<n; j++) {
				var temp = A[jmax][j]
				A[jmax][j] = A[i][j]
				A[i][j] = temp
			}
			d = !d;
			vv[jmax] = vv[i]
		}
		idx[i] = jmax;
		if (i == n-1) break;
		var temp = A[i][i]
		if (temp == 0) A[i][i] = temp = tiny
		temp = 1 / temp
		for (var j=i+1; j<n; j++) A[j][i] *= temp
	}
	return {A:A, idx:idx, d:d}
}
 
// Lower Upper Back Substitution
function lubksb(lu, b, update) {
	// solves the set of n linear equations A*x = b.
	// lu is the object containing A, idx and d as determined by the routine ludcmp.
	var A = lu.A
	var idx = lu.idx
	var n = idx.length
 
	if (!update) { // make a copy of b
		var bcpy = new Array(n) 
		for (var i=0; i<b.length; i+=1) bcpy[i] = b[i]
		b = bcpy
	}
 
	for (var ii=-1, i=0; i<n; i++) {
		var ix = idx[i]
		var sum = b[ix]
		b[ix] = b[i]
		if (ii > -1)
			for (var j=ii; j<i; j++) sum -= A[i][j] * b[j]
		else if (sum)
			ii = i
		b[i] = sum
	}
	for (var i=n-1; i>=0; i--) {
		var sum = b[i]
		for (var j=i+1; j<n; j++) sum -= A[i][j] * b[j]
		b[i] = sum / A[i][i]
	}
	return b // solution vector x
}

var Matrix = /** @class */ (function () {
    function Matrix(ary) {
        this.mtx = ary;
        this.height = ary.length;
        this.width = ary[0].length;
    }
    Matrix.prototype.toReducedRowEchelonForm = function () {
        var lead = 0;
        for (var r = 0; r < this.height; r++) {
            if (this.width <= lead) {
                return;
            }
            var i = r;
            while (this.mtx[i][lead] == 0) {
                i++;
                if (this.height == i) {
                    i = r;
                    lead++;
                    if (this.width == lead) {
                        return;
                    }
                }
            }
            var tmp = this.mtx[i];
            this.mtx[i] = this.mtx[r];
            this.mtx[r] = tmp;
            var val = this.mtx[r][lead];
            for (var j = 0; j < this.width; j++) {
                this.mtx[r][j] /= val;
            }
            for (var i_1 = 0; i_1 < this.height; i_1++) {
                if (i_1 == r)
                    continue;
                val = this.mtx[i_1][lead];
                for (var j = 0; j < this.width; j++) {
                    this.mtx[i_1][j] -= val * this.mtx[r][j];
                }
            }
            lead++;
        }
        return this;
    };
    return Matrix;
}());

var x_1 = [1, 2, 3, 2, 0];
var y_1 = [-2, -1, 1, 3, 4];
var variables = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];
var varNames = ["a", "b", "c", "d", "f"];
for (var i = 0; i < x_1.length; i++) {
    var v = [Math.pow(x_1[i], 2), Math.pow(y_1[i], 2), x_1[i], y_1[i], 1];
    for (var j = 0; j < 5; j++) {
        for (var k = 0; k < 5; k++) {
            variables[j][k] += 2 * v[k] * v[j];
        }
    }
}
console.log(variables);
for (var j = 0; j < 5; j++) {
    const a = []
    for (var k = 0; k < 5; k++) {
        a.push(`${variables[j][k]}${varNames[k]}`);
    }
    console.log(`${a.join('+')}=0,`)
}

function reducedRowEchelonForm(matrix) {
    var knownPivotColumns = []; // this is our one piece of iffy state-keeping :(
  
    // Copy the input matrix (reusing the variable name) so we have a local copy to work on
    matrix = matrix.map(function (row) { return row.slice() });
  
    // Now, go through the matrix and do the reduction.
    // We're using forEach here, because we want to update the matrix
    // in-place, whereas `map()` will work on a separate instance
    matrix.forEach(function (row, rowIndex) {
  
      // Find the row's pivot
      // This is wrapped in an IIFE just for structure
      var pivot = (function () {
        // using a regular for-loop, since we may want to break out of it early
        for(var i = 0, l = row.length ; i < l ; i++ ) {
          if(!row[i] || knownPivotColumns[i]) { continue } // skip column if it's zero or its index is taken
          knownPivotColumns[i] = true;                     // "reserve" the column
          return { index: i, value: row[i] };              // return the pivot data
        }
        return null; // no pivot found
      }());
  
      // if there's no pivot, there's nothing else to do for this row
      if(!pivot) { return }
  
      // scale the row, if necessary
      if(pivot.value !== 1) {
        // using forEach as a "map in place" here
        row.forEach(function (_, i) { row[i] /= pivot.value });
      }
  
      // now reduce the other rows (calling them "siblings" here)
      matrix.forEach(function (sibling) {
        var siblingPivotValue = sibling[pivot.index];
  
        if(sibling === row || siblingPivotValue === 0) { return } // skip if possible
  
        // subtract the sibling-pivot-scaled row from the sibling
        // (another "forEach as map-in-place")
        sibling.forEach(function (_, i) { sibling[i] -= row[i] * siblingPivotValue });
      });
    });
  
    return matrix;
  }

const matrix = new Matrix(variables)
console.log(reducedRowEchelonForm(matrix.mtx))

