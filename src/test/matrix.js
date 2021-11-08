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
