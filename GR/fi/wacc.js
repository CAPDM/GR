/*!
 * fi-wacc.js
 * http://www.capdm.com
 *
 * Copyright 2018 Ken Currie, CAPDM Ltd.
 * Released under the GNU license
 * https://github.com/XXX
 */

(function(exports){
    
    "use strict";
    
    const FICTXT = "SOMETHING UNGUESSABLE";
    
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
	_NOCF	= [5000, 0, 10000, 500]; 	

    // Working variables
    var t, rf, ku, nocf;

    // The gearing levels
    var G = [0.0, 0.2, 0.4, 0.6, 0.8, 0.99];

    var cellValue = function(o, n) {
    // ----------
	// Strip away any tags and round
	n = n.toFixed(2);	o = o.replace(/<[^>]*>?/g, "");

	if (o == n) return o;  // If no change just return the old value
	else return "<font style='color: red;'>" + n + "</font>";
    }

    var updateWACC = function() {
    // -----------
	Vu = (nocf * (1.0 - t)) / ku;

	for (var i=0; i<_NOOFLEVELS; i++) {
	    kd[i] = rf + (ku - rf) * Math.pow(G[i], _N);
	    ke[i] = (ku * (1.0 - t * G[i]) - G[i] * kd[i] * (1.0 - t)) / (1.0 - G[i]);
	    kf[i] = G[i] * kd[i] + (1.0 - G[i]) * ke[i];
	    
	    Wacc[i] = G[i] * kd[i] * (1.0 - t) + (1.0 - G[i]) * ke[i];
	    
	    V[i] = Vu / (1.0 - t * G[i]);
	    E[i] = V[i] * (1.0 - G[i]);
	    D[i] = V[i] - E[i];
	    VITS[i] = D[i] * t;
	};

	// Need to update the table.
	var old = '';
	for (var i=0; i<_NOOFLEVELS; i++) {
	    old = document.getElementById('kf_' + i).innerHTML; 
	    document.getElementById('kf_' + i).innerHTML   = cellValue(document.getElementById('kf_' + i).innerHTML, (100 * kf[i]));
	    document.getElementById('ke_' + i).innerHTML   = cellValue(document.getElementById('ke_' + i).innerHTML, (100 * ke[i]));
	    document.getElementById('kd_' + i).innerHTML   = cellValue(document.getElementById('kd_' + i).innerHTML, (100 * kd[i]));
	    document.getElementById('wacc_' + i).innerHTML = cellValue(document.getElementById('wacc_' + i).innerHTML, (100 * Wacc[i]));

	    document.getElementById('v_' + i).innerHTML    = cellValue(document.getElementById('v_' + i).innerHTML, (V[i]));
	    document.getElementById('e_' + i).innerHTML    = cellValue(document.getElementById('e_' + i).innerHTML, (E[i]));
	    document.getElementById('d_' + i).innerHTML    = cellValue(document.getElementById('d_' + i).innerHTML, (D[i]));
	    document.getElementById('vits_' + i).innerHTML = cellValue(document.getElementById('vits_' + i).innerHTML, (VITS[i]));
	};

	return true;  // Can't go wrong?
    }

    // Rescale to a round number
    function rescale(big) {
    // -------------
	var r = 0.0, i = 0, l = 0;
	if (!isNaN(big) && Math.abs(big) > 1.0) {
	    i = 0;  r = big * 1.1;                  // Something a bit bigger than 1
	    while (r > 10.0) { r = r / 10.0; i++;}  // How man zeros could we have?
	    if (i > 0) {
		l = (Math.ceil(r) * 10.0);  i--;    // Up it to 2 decimal places
	    }
	    else l = Math.ceil(r);
	    while (i > 0) { l = l * 10;  i--;};
	    
	    return l;
	}
	else return 1;
    };

    function checkCtxt(graph) {
	return (graph.ctx == FICTXT) ? true : false;
    }

    // WACC model
    // ===========
    // Models the WACC
    var WACC = function(cid) {
        this.ctx = FICTXT;  // Set a content for checking, and any defaults
//        _defaults = this.defaults;

        this.canvas = grCanvas(cid);  // Create a new canvas

	// Corp. Tax, Risk Free Rate, Unleveraged Rate, Net Op. Cash Flow
	t = _T[0] / 100.0;  rf = _RF[0] / 100.0;  ku = _KU[0] / 100.0;  nocf = _NOCF[0];

	return updateWACC();
    }

    // Setters
    WACC.prototype.setTS = function(val) {
	t = val / 100.0;	updateWACC();
    }

    WACC.prototype.setKU = function(val) {
	ku = val / 100.0;	updateWACC();
    }

    WACC.prototype.setRF = function(val) {
	rf = val / 100.0;	updateWACC();
    }

    WACC.prototype.setNOCF = function(val) {
	nocf = val;	updateWACC();
    }

    // Getters
    WACC.prototype.getTS = function() {
	return t * 100;
    }

    WACC.prototype.getKU = function() {
	return ku * 100;
    }

    WACC.prototype.getRF = function() {
	return rf * 100;
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

    // fi class
    var __fi = function () {
	this.fistyle;  // Style for selected chart type */
    };


    WACC.prototype.setTSSlider = function (id) {
    // -----------------------------
	document.getElementById(id).value = t * 100;
    }

    WACC.prototype.setRFSlider = function (id) {
    // ---------------------------
	document.getElementById(id).value = rf * 100;
    }

    WACC.prototype.setKUSlider = function (id) {
    // ---------------------------
	document.getElementById(id).value = ku * 100;
    }

    WACC.prototype.setNOCFSlider = function (id) {
    // -------------------------
	document.getElementById(id).value = nocf;
    }

    // Show 
    WACC.prototype.showAbout = function () {
    // -------------------------
	alert('Weighted Average Cost of Capital');
    }

    // Reset 
    WACC.prototype.resetApplet = function () {
    // -------------------------
	this.setTS(_T[0]);  this.setRF(_RF[0]);  this.setKU(_KU[0]);  this.setNOCF(_NOCF[0]);
	
	updateWACC();  // Now update.
	// Tickle the graphs
	this.fiUpdExpectedReturns();  this.fiUpdCompanyValue();
    }


    // Now the graphing routines

    WACC.prototype.fiUpdCompanyValue = function() {
    // ---------------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'white');  // Blank canvas
	this.canvas.grHeader('WACC - Company Value', 'steelblue');
	this.canvas.grLegend([["Value", 'blue'], ["Debt", 'red'], ["Equity", 'green'], ["VITS", 'orange']], 'steelblue');

	this.canvas.grSetMainTitle(ch[0], 'V: 0% Gearing');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'D, E, VITS: 99% Gearing');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Gearing');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Values ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	// Plot the data points
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, V[j-1], G[j]*100, V[j], 'blue');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, D[j-1], G[j]*100, D[j], 'red');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, E[j-1], G[j]*100, E[j], 'green');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, VITS[j-1], G[j]*100, VITS[j], 'orange');

	return;
    };

    WACC.prototype.fiCompanyValue = function() {
    // ------------------------------------
	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // Company value graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    this.canvas.grSetScale(ch1, 0, 100, 0, 25000);

	    this.fiUpdCompanyValue();

	    return this;
	};
    };

    WACC.prototype.fiUpdExpectedReturns = function() {
    // --------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'white');  // Blank canvas
	this.canvas.grHeader('WACC - Expected Returns', 'steelblue');
	this.canvas.grLegend([["ke", 'blue'], ["kd", 'red'], ["kf", 'green'], ["WACC", 'orange']], 'steelblue');

	this.canvas.grSetMainTitle(ch[0], 'Gearing');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], '99%');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Gearing %');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Returns (%)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	// Plot the data points
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, ke[j-1], G[j]*100, ke[j], 'blue');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, kd[j-1], G[j]*100, kd[j], 'red');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, kf[j-1], G[j]*100, kf[j], 'green');
        for (var j=1; j<_NOOFLEVELS; j++) 
            this.canvas.grLine(ch[0], G[j-1]*100, Wacc[j-1], G[j]*100, Wacc[j], 'orange');

	return;
    };

    WACC.prototype.fiExpectedReturns = function() {
    // ------------------------------------
	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // Expected returns graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    this.canvas.grSetScale(ch1, 0, 100, 0, 0.5);

	    this.fiUpdExpectedReturns();

	    return this;
	};
    };


    //Globally expose the defaults to allow for user updating/changing
    WACC.prototype.defaults = {
    };
    
    //Global helpers object for utility methods and classes
    var helpers = WACC.helpers = {};
    
    //-- Basic js utility methods
    var each = helpers.each = function(loopable,callback,self){
    };
    
    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    WACC.instances = {};

    var wacc = function(cid){ 
	return new WACC(cid); 
    };
    exports(wacc);
}
)
(typeof(exports) === 'undefined' 
 ? function(f){this['wacc'] = f} 
 : function(f){module.exports = f}
);
