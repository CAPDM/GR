(function(exports){
    
    const  _NOOFLEVELS = 6;  // There are only 6 gearing levels
    const  _N = 3;           // a power in the equation

    var Vu = 0.0;    // Ungeared value

    var V    = new Array(_NOOFLEVELS).fill(0.0);
    var D    = new Array(_NOOFLEVELS).fill(0.0);
    var E    = new Array(_NOOFLEVELS).fill(0.0);
    var Wacc = new Array(_NOOFLEVELS).fill(0.0);
    var VITS = new Array(_NOOFLEVELS).fill(0.0);
    var I    = new Array(_NOOFLEVELS).fill(0.0);
    var ITS  = new Array(_NOOFLEVELS).fill(0.0);
    var DIV  = new Array(_NOOFLEVELS).fill(0.0);
    var ke   = new Array(_NOOFLEVELS).fill(0.0);
    var kd   = new Array(_NOOFLEVELS).fill(0.0);
    var kf   = new Array(_NOOFLEVELS).fill(0.0);

    // The independent variables (Corp Tax, Risk Free Rate, Unleveraged Rate, Net Op Cash Flow)
    var _T	= [40, 0, 90, 1],  // Start, min, max, step
	_RF 	= [7, 0, 49, 1],
	_KU 	= [20, 0, 90, 1],
	_NOCF	= [500, 0, 10000, 500]; 	

    // The gearing levels
    var G = [0.0, 0.2, 0.4, 0.6, 0.8, 0.99];

    var updateWACC = function() {
    // -----------
	Vu = (this.nocf * (1.0 - this.t))/this.ku;

	for (var int i=0; i<_NOOFLEVELS; i++) {
	    kd[i] = this.rf + (this.ku - this.rf) * Math.pow(G[i], _N);
	    ke[i] = (this.ku * (1.0 - this.t * G[i]) - G[i] * kd[i] * (1.0 - this.t)) / (1.0 - G[i]);
	    kf[i] = G[i] * kd[i] + (1.0 - G[i]) * ke[i];
	    
	    Wacc[i] = G[i] * kd[i] * (1.0 - this.t) + (1.0 - G[i]) * ke[i];
	    
	    V[i] = Vu / (1.0 - this.t * G[i]);
	    E[i] = V[i] * (1.0 - G[i]);
	    D[i] = V[i] - E[i];
	    VITS[i] = D[i] * this.t;
	}

	return true;  // Can't go wrong?
    }

    
    // Models the WACC
    var WACC = function() {
	// Corp. Tax, Risk Free Rate, Unleveraged Rate, Net Op. Cash Flow
	this.t = _T[0];  this.rf = _RF[0];  this.ku = _KU[0];  this.nocf = _NOCF[0];

	return updateWACC();
    }

    // Setters
    WACC.prototype.setT = function(t) {
	this.t = t;
    }

    WACC.prototype.setKU = function(ku) {
	this.ku = ku;
    }

    WACC.prototype.setRF = function(rf) {
	this.rf = rf;
    }

    WACC.prototype.setNOCF = function(nocf) {
	this.nocf = nocf;
    }

    // Getters
    WACC.prototype.getT = function() {
	return t;
    }

    WACC.prototype.getKU = function() {
	return ku;
    }

    WACC.prototype.getRF = function() {
	return rf;
    }

    WACC.prototype.getNOCF = function() {
	return nocf;
    }

    WACC.prototype.getV    = function() {
	return V;
    }
    WACC.prototype.getD    = function() {
	return D;
    }
    WACC.prototype.getE    = function() {
	return E;
    }
    WACC.prototype.getWACC = function() {
	return Wacc;
    }
    WACC.prototype.getVITS = function() {
	return VITS;
    }
    WACC.prototype.getI    = function() {
	return I;
    }
    WACC.prototype.getITS  = function() {
	return ITS;
    }
    WACC.prototype.getDIV  = function() {
	return DIV;
    }
    WACC.prototype.getKE   = function() {
	return ke;
    }
    WACC.prototype.getKD   = function() {
	return kd;
    }
    WACC.prototype.getkf   = function() {
	return kf;
    }

    // Update function
    WACC.prototype.update = function() {
	return updateWACC();
    };

    var wacc = function(){ 
	return new WACC(); 
    };
    exports(wacc);
}
)
(typeof(exports) === 'undefined' 
 ? function(f){this['wacc'] = f} 
 : function(f){module.exports = f}
);
