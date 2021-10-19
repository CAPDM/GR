/*!
 * micro.js
 * http://www.capdm.com
 *
 * Copyright 2018 Ken Currie, CAPDM Ltd.
 * Released under the GNU license
 * https://github.com/XXX
 */

(function(exports){
    
    "use strict";
    
    const VAL = 0, MIN = 1, MAX = 2, STEP = 3;  // Indexes into the inputs
    const MAX_IP = 20;                          // No. of input values
    const KVALHI = 14;                          // Kink point

    const ECCTXT = "SOMETHING UNGUESSABLE";

    var updateType = {
	fQ: 0,           fMP: 1,          fAP: 2,       fMRP: 3,      
        fVC: 4,          fTC: 5,          fAVC: 6,      fATC: 7,      fMC: 8,
	fPerMR: 9,       fTR: 10,         fProfit: 11,  fPrice: 12,   fD: 13,       
        fTotRev: 14,     fMR: 15,         fElast: 16,
	fCalcPrice: 17,  fCalcMR: 18,     fS: 19,       fKDemand: 20, fKTotRev: 21, 
        fKMR: 22,        fCalcKPrice: 23, fCalcKMR: 24, fEndFn: 25
    };

    var upToDate = new Array(updateType.fEndFn).fill(false);  // Keeps a track on currency

    // Inputs
    var Demand_Shift	= [0.0, 0.0, 100.0, 5.0],
	Max_Output 	= [350.0, 100.0, 500.0, 25.0],
	Exp_Factor 	= [0.55, 0.2, 0.8, 0.05],
	Wage_Rate	= [10.0, 5.0, 15.0, 1.0], 	
	Fixed_Cost	= [40.0, 20.0, 60.0, 1.0], 	
	Perf_Price	= [0.7, 0.35, 1.0, 0.05],
	Demand_Max	= [500.0, 250.0, 750.0, 25.0], 	
	Demand_Step	= [25.0, 10.0, 40.0, 1.0], 
	Kink		= [15.0, 1.0, 50.0, 1.0],
	Supply_Min	= [0.0, 0.0, 0.0, 0.0], 	
	Supply_Step	= [25.0, 10.0, 40.0, 1.0], 
	Start_Price	= [1.0, 1.0, 1.0, 0.0],
	Price_Step	= [1.0, 1.0, 10.0, 1.0],	
	K0		= [10.0, 10.0, 10.0, 0.0];

    // Outputs
    var Q = new Array(MAX_IP),         MP = new Array(MAX_IP),        AP = new Array(MAX_IP),
	MRP = new Array(MAX_IP),       VC = new Array(MAX_IP),        TC = new Array(MAX_IP),
	AVC = new Array(MAX_IP),       ATC = new Array(MAX_IP),	      MC = new Array(MAX_IP),
	PerMR = new Array(MAX_IP),     TR = new Array(MAX_IP),        Profit = new Array(MAX_IP),
	Price = new Array(MAX_IP),     D = new Array(MAX_IP),         TotRev = new Array(MAX_IP),
	MR = new Array(MAX_IP),	       Elast = new Array(MAX_IP),     CalcPrice = new Array(MAX_IP),
	CalcMR = new Array(MAX_IP),    S = new Array(MAX_IP),         KDemand = new Array(MAX_IP),
	KMR = new Array(MAX_IP),       KTotRev = new Array(MAX_IP),   CalcKPrice = new Array(MAX_IP),
	CalcKMR = new Array(MAX_IP);

    // A function to check everything up to date
    function functionOf(x) {
//	if (!upToDate[x])
	    switch(x) {
	    case updateType.fQ: 	 upd_Q();	break;
	    case updateType.fMP:	 upd_MP();	break;
	    case updateType.fAP:	 upd_AP();	break;
	    case updateType.fMRP:	 upd_MRP();	break;
	    case updateType.fVC:	 upd_VC();	break;
	    case updateType.fTC:	 upd_TC();	break;
	    case updateType.fAVC:	 upd_AVC();	break;
	    case updateType.fATC:	 upd_ATC();	break;
	    case updateType.fMC:	 upd_MC();	break;
	    case updateType.fPerMR:	 upd_PerMR();	break;
	    case updateType.fTR:	 upd_TR();	break;
	    case updateType.fProfit:	 upd_Profit();	break;
	    case updateType.fPrice:	 upd_Price();	break;
	    case updateType.fD:		 upd_D();	break;
	    case updateType.fTotRev:	 upd_TotRev();	break;
	    case updateType.fMR:	 upd_MR();	break;
	    case updateType.fElast:	 upd_Elast();	break;
	    case updateType.fCalcPrice:	 upd_CalcPrice();break;
	    case updateType.fCalcMR:	 upd_CalcMR();	break;
	    case updateType.fS:		 upd_S();	break;
	    case updateType.fKDemand:	 upd_KDemand();	break;
	    case updateType.fKTotRev:	 upd_KTotRev();	break;
	    case updateType.fKMR:	 upd_KMR();	break;
	    case updateType.fCalcKPrice: upd_CalcKPrice();break;
	    case updateType.fCalcKMR:	 upd_CalcKMR();	break;
	    default:  /* nothing */ 	break;
	    }
    };

    function eAdjust(e) {
    // -------------
	return (-3.0 - e);
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

    // Updater functions
    function upd_Q(){
    // -----------
	K0[VAL] = parseFloat(Max_Output[VAL]) / (1.0 + Math.exp(-(eAdjust(parseFloat(Exp_Factor[VAL])))));

	for (var i=0; i<MAX_IP; i++) 
		Q[i] = -parseFloat(K0[VAL]) + parseFloat(Max_Output[VAL]) /
		       (1.0 + Math.exp(-(eAdjust(parseFloat(Exp_Factor[VAL])) + parseFloat(Exp_Factor[VAL])*i)));

	/* just ensure that Q[0] is zero */
	Q[0] = 0.0;
	
	upToDate[updateType.fQ] = true;
    };

    function upd_MP(){
    // ------------
	functionOf(updateType.fQ);

	MP[0] = 0.0;  // no MP at 0 input
	for (var i=1; i<MAX_IP; i++) MP[i] = Q[i] - Q[i-1];
	upToDate[updateType.fMP] = true;
    };

    function upd_AP(){
    // ------------
	functionOf(updateType.fQ);

	AP[0] = 0.0;
	for (var i=1; i<MAX_IP; i++) AP[i] = Q[i] / i;
	upToDate[updateType.fAP] = true;
    };

    function upd_MRP(){
    // -------------
	functionOf(updateType.fMP);
	
	for (var i=0; i<MAX_IP; i++)  MRP[i] = MP[i] * parseFloat(Perf_Price[VAL]);
	upToDate[updateType.fMRP] = true;
    };

    function upd_VC(){
    // ------------
	for (var i=0; i<MAX_IP; i++)  VC[i] = i * parseFloat(Wage_Rate[VAL]);
	upToDate[updateType.fVC] = true;
    };

    function upd_TC(){
    // ------------
	functionOf(updateType.fVC);

	for (var i=0; i<MAX_IP; i++) TC[i] = parseFloat(Fixed_Cost[VAL]) + VC[i];
	upToDate[updateType.fTC] = true;
    };

    function upd_AVC(){
    // -------------
	functionOf(updateType.fVC);  functionOf(updateType.fQ);

	AVC[0] = 0.0;
	for (var i=1; i<MAX_IP; i++)  AVC[i] = VC[i] / Q[i];
	upToDate[updateType.fAVC] = true;
    };

    function upd_ATC(){
    // -------------
	functionOf(updateType.fVC);  functionOf(updateType.fQ);

	ATC[0] = 0.0;
	for (var i=1; i<MAX_IP; i++)  ATC[i] = (parseFloat(Fixed_Cost[VAL]) + VC[i]) / Q[i];;
	upToDate[updateType.fATC] = true;
    };

    function upd_MC(){
    // ------------
	functionOf(updateType.fVC);   functionOf(updateType.fMP);

	MC[0] = 0.0;
	for (var i=1; i<MAX_IP; i++)  MC[i] = (VC[i] - VC[i-1]) / MP[i];

	upToDate[updateType.fMC] = true;
    };

    function upd_PerMR(){
    // ---------------
	for (var i=0; i<MAX_IP; i++) PerMR[i] = parseFloat(Perf_Price[VAL]);
	upToDate[updateType.fPerMR] = true;
    };

    function upd_TR(){
    // ------------
	functionOf(updateType.fPerMR);   functionOf(updateType.fQ);

	for (var i=0; i<MAX_IP; i++)  TR[i] = Q[i] * parseFloat(Perf_Price[VAL]);
	upToDate[updateType.fTR] = true;
    };

    function upd_Profit(){
    // ----------------
	functionOf(updateType.fTC);  functionOf(updateType.fTR);

	for (var i=0; i<MAX_IP; i++)  Profit[i] = TR[i] - TC[i];
	upToDate[updateType.fProfit] = true;
    };

    function upd_Price(){
    // ---------------
	Price[0] = 0.0;
	for (var i=1; i<MAX_IP; i++)  Price[i] = Price[i-1] + parseFloat(Price_Step[VAL]);
	upToDate[updateType.fPrice] = true;
    };

    function upd_D(){
    // -----------
	functionOf(updateType.fPrice);
	
	for (var i=0; i<MAX_IP; i++)
	    D[i] = parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) 
	    - (parseFloat(Demand_Step[VAL]) * Price[i]);
	upToDate[updateType.fD] = true;
    };

    function upd_TotRev(){
    // ----------------
	functionOf(updateType.fD);

	for (var i=0; i<MAX_IP; i++) TotRev[i] = Price[i] * D[i];
	upToDate[updateType.fTotRev] = true;
    };

    function upd_MR(){
    // ------------
	functionOf(updateType.fD);

	for (var i=0; i<MAX_IP; i++)
	    MR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 2.0 * D[i]) / 
	            parseFloat(Demand_Step[VAL]);
	upToDate[updateType.fMR] = true;
    };

    function upd_Elast(){
    // ---------------
	var denom = 1.0;

	functionOf(updateType.fPrice);

	for (var i=0; i<MAX_IP; i++) {
	    denom = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - (parseFloat(Demand_Step[VAL]) * Price[i]));
	    
	    if (denom != 0.0)
		Elast[i] = -(parseFloat(Demand_Step[VAL]) * Price[i]) / denom;
	    else Elast[i] = -9999.0;  /* a big number */
	}
	
	upToDate[updateType.fElast] = true;
    };

    function upd_CalcPrice(){
    // -------------------
	functionOf(updateType.fQ);

	for (var i=0; i<MAX_IP; i++)
	    CalcPrice[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - Q[i]) / parseFloat(Demand_Step[VAL]);
	upToDate[updateType.fCalcPrice] = true;
    };

    function upd_CalcMR(){
    // ----------------
	functionOf(updateType.fQ);

	for (var i=0; i<MAX_IP; i++)
		CalcMR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - (2.0 * Q[i])) / 
	                    parseFloat(Demand_Step[VAL]);
	upToDate[updateType.fCalcMR] = true;
    };

    function upd_S(){
    // -----------
	functionOf(updateType.fPrice);

	for (var i=0; i<MAX_IP; i++) 
	    S[i] = parseFloat(Supply_Min[VAL]) + parseFloat(Supply_Step[VAL]) * Price[i];
	upToDate[updateType.fS] = true;
    };

    function upd_KDemand(){
    // -----------------
	functionOf(updateType.fPrice);

	for (var i=0; i<KVALHI; i++)  // First part of Kink
		KDemand[i] = parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) -
		    	     (Price[KVALHI] * parseFloat(Kink[VAL])) -
		    	     (parseFloat(Demand_Step[VAL]) - parseFloat(Kink[VAL])) * Price[i];
	for (var i=KVALHI; i<MAX_IP; i++)
		KDemand[i] = parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) -
		 	     parseFloat(Demand_Step[VAL]) * Price[i];
	upToDate[updateType.fKDemand] = true;
    };

    function upd_KTotRev(){
    // -----------------
	functionOf(updateType.fKDemand);

	for (var i=0; i<MAX_IP; i++) KTotRev[i] = Price[i] * KDemand[i];
	upToDate[updateType.fKTotRev] = true;
    };

    function upd_KMR(){
    // -------------
	functionOf(updateType.fKDemand);

	for (var i=0; i<KVALHI; i++)
	    KMR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 
		      (Price[KVALHI] * parseFloat(Kink[VAL])) -
		      2.0 * KDemand[i]) / (parseFloat(Demand_Step[VAL]) - parseFloat(Kink[VAL]));
	for (var i=KVALHI; i<MAX_IP; i++)
	    KMR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 
		      2.0 * KDemand[i]) / parseFloat(Demand_Step[VAL]);
	upToDate[updateType.fKMR] = true;
    };

    function upd_CalcKPrice(){
    // --------------------
	functionOf(updateType.fQ);

	for (var i=0; i<MAX_IP; i++) 
	    CalcKPrice[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - Q[i]) / 
	                    parseFloat(Demand_Step[VAL]);
	for (var i=0; i<MAX_IP; i++) {
	    if (CalcKPrice[i] < Price[KVALHI])
		CalcKPrice[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 
				 Q[i] - Price[KVALHI] * parseFloat(Kink[VAL])) /
		                (parseFloat(Demand_Step[VAL]) - parseFloat(Kink[VAL]));
	}
	upToDate[updateType.fCalcKPrice] = true;
    };

    function upd_CalcKMR(){
    // -----------------
	functionOf(updateType.fQ);  functionOf(updateType.fCalcKPrice);

	for (var i=0; i<MAX_IP; i++)
	    CalcKMR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 2.0 * Q[i]) / 
	       parseFloat(Demand_Step[VAL]);
	for (var i=0; i<MAX_IP; i++) {
	    if (CalcKPrice[i] < Price[KVALHI])
		CalcKMR[i] = (parseFloat(Demand_Max[VAL]) + parseFloat(Demand_Shift[VAL]) - 
			      2.0 * Q[i] - Price[KVALHI] * parseFloat(Kink[VAL])) /
		             (parseFloat(Demand_Step[VAL]) - parseFloat(Kink[VAL]));
	}
	upToDate[updateType.fCalcKMR] = true;
};


    function checkCtxt(graph) {
	return (graph.ctx == ECCTXT) ? true : false;
    }

    function checkChart(chart) {
	return (chart instanceof __chart) ? true : false;
    }

    // Micro model
    // ===========
//    var _defaults, this.canvas;
    var _defaults;

    var ECMicro = function(cid) {
	this.ctx = ECCTXT;  // Set a content for checking, and any defaults
	_defaults = this.defaults;

	this.canvas = grCanvas(cid);  // Create a new canvas

	return this;
    };
    

    // micro class
    var __micro = function () {
	this.microstyle;  // Style for selected chart type */
    };


    // Some getters
    ECMicro.prototype.getMaxOutput = function (ind) {
    // ---------------------------
	if (ind < 0 || ind > 3) return Max_Output[0]  // return the value
	else
	    return Max_Output[ind];
    }

    ECMicro.prototype.getProdFactor = function (ind) {
    // ---------------------
	if (ind < 0 || ind > 3) return Exp_Factor[0]  // return the value
	else
	    return Exp_Factor[ind];
    }

    ECMicro.prototype.getWageRate = function (ind) {
    // ---------------------
	if (ind < 0 || ind > 3) return Wage_Rate[0]  // return the value
	else
	    return Wage_Rate[ind];
    }

    ECMicro.prototype.getFixedCost = function (ind) {
    // ---------------------------
	if (ind < 0 || ind > 3) return Fixed_Cost[0]  // return the value
	else
	    return Fixed_Cost[ind];
    }

    ECMicro.prototype.getPerfPrice = function (ind) {
    // ---------------------------
	if (ind < 0 || ind > 3) return Perf_Price[0]  // return the value
	else
	    return Perf_Price[ind];
    }

    ECMicro.prototype.getDemandMax = function (ind) {
    // ---------------------------
	if (ind < 0 || ind > 3) return Demand_Max[0]  // return the value
	else
	    return Demand_Max[ind];
    }

    ECMicro.prototype.getDemandStep = function (ind) {
    // ----------------------------
	if (ind < 0 || ind > 3) return Demand_Step[0]  // return the value
	else
	    return Demand_Step[ind];
    }

    ECMicro.prototype.getKink = function (ind) {
    // ----------------------
	if (ind < 0 || ind > 3) return Kink[0]  // return the value
	else
	    return Kink[ind];
    }

    ECMicro.prototype.getSupplyMin = function (ind) {
    // ---------------------------
	if (ind < 0 || ind > 3) return Supply_Min[0]  // return the value
	else
	    return Supply_Min[ind];
    }

    ECMicro.prototype.getSupplyStep = function (ind) {
    // ----------------------------
	if (ind < 0 || ind > 3) return Supply_Step[0]  // return the value
	else
	    return Supply_Step[ind];
    }

    ECMicro.prototype.getStartPrice = function (ind) {
    // ----------------------------
	if (ind < 0 || ind > 3) return Supply_Step[0]  // return the value
	else
	    return Supply_Step[ind];
    }

    ECMicro.prototype.getStartPrice = function (ind) {
    // ----------------------------
	if (ind < 0 || ind > 3) return Start_Price[0]  // return the value
	else
	    return Start_Price[ind];
    }

    ECMicro.prototype.getPrice_Step = function (ind) {
    // ----------------------------
	if (ind < 0 || ind > 3) return Price_Step[0]  // return the value
	else
	    return Price_Step[ind];
    }

    ECMicro.prototype.getK0 = function (ind) {
    // --------------------
	if (ind < 0 || ind > 3) return K0[0]  // return the value
	else
	    return K0[ind];
    }

    // ... and setters
    ECMicro.prototype.setMaxOutput = function (v) {
    // ---------------------------
	Max_Output[0] = v;
    }

    ECMicro.prototype.setProdFactor = function (v) {
    // ---------------------
	Exp_Factor[0] = v;
    }

    ECMicro.prototype.setWageRate = function (v) {
    // --------------------------
	Wage_Rate[0] = v;
    }

    ECMicro.prototype.setFixedCost = function (v) {
    // ---------------------------
	Fixed_Cost[0] = v;
    }

    ECMicro.prototype.setPerfPrice = function (v) {
    // ---------------------------
	Perf_Price[0] = v;
    }

    ECMicro.prototype.setDemandMax = function (v) {
    // ---------------------------
	Demand_Max[0] = v;
    }

    ECMicro.prototype.setDemandStep = function (v) {
    // ----------------------------
	Demand_Step[0] = v;
    }

    ECMicro.prototype.setDemandStep = function (v) {
    // ----------------------------
	Demand_Step[0] = v;
    }

    ECMicro.prototype.setKink = function (v) {
    // ----------------------------
	Kink[0] = v;
    }

    ECMicro.prototype.setSupplyMin = function (v) {
    // ----------------------------
	Supply_Min[0] = v;
    }

    ECMicro.prototype.setSupplyStep = function (v) {
    // ----------------------------
	Supply_Step[0] = v;
    }

    ECMicro.prototype.setStartPrice = function (v) {
    // ----------------------------
	Start_Price[0] = v;
    }

    ECMicro.prototype.setPriceStep = function (v) {
    // ---------------------------
	Price_Step[0] = v;
    }

    ECMicro.prototype.setK0 = function (v) {
    // ----------------------------
	K0[0] = v;
    }

    // Now the graphing routines

    // Demand functions
    // ================
    ECMicro.prototype.updDemandMRFn = function() {
    // ----------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'white');  // Blank canvas
	this.canvas.grHeader('Demand Curve', 'steelblue');
	this.canvas.grLegend([["Price", 'orange'], ["MR", 'magenta']], 'steelblue');

	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_D();   upd_Price();   upd_MR();
	
	this.canvas.grSetMainTitle(ch[0], 'Demand & Marginal Rev.');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black', 1);  // Arrow grid

	this.canvas.grSetXAxisTitle(ch[0], 'Demand');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Price ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], MR[j-1], D[j], MR[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], Price[j-1], D[j], Price[j], 'orange');

	return;
};

    ECMicro.prototype.ecDemandMRFn = function() {
    // ---------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_D();   upd_Price();   upd_MR();

	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,big=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, Price[j]); bigy = Math.max(bigy, MR[j]);
		small = Math.min(small, Price[j]); small = Math.min(small, MR[j]);
	    }
	    bigx = rescale(100.0 * (1+Q[MAX_IP-1]/100.0));  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updDemandMRFn();

	    return this;
	}
	else return null;
    };
    
    ECMicro.prototype.updPriceElasFn = function() {
    // -----------------------------
	var ch = this.canvas.charts;
	
	this.canvas.grClearGrid(null, 'thistle');  // Blank canvas
	this.canvas.grHeader('Demand & Elasticity Curve', 'steelblue');
	this.canvas.grLegend([["Price", 'orange'], ["MR", 'magenta'], 
			      ["Elast", 'blue']], 'steelblue');	

	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_D();   upd_Price();   upd_MR();  upd_Elast();
	
	this.canvas.grSetMainTitle(ch[0], 'Price Elasticity');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Demand');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Cost ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], MR[j-1], D[j], MR[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], Price[j-1], D[j], Price[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], Elast[j-1], D[j], Elast[j], 'blue');

	return;
    };
    
    ECMicro.prototype.ecPriceElasFn = function() {
    // ---------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;
	
	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_D();   upd_Price();   upd_MR();  upd_Elast();
	    
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, Price[j]); bigy = Math.max(bigy, MR[j]);
		bigy = Math.max(bigy, Elast[j]);
		small = Math.min(small, Price[j]); small = Math.min(small, MR[j]);
		small = Math.min(small, Elast[j]);
	    }
	    bigx = rescale(100.0 * (1+Q[MAX_IP-1]/100.0));  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updPriceElasFn();

	    return this;
	}
	else return null;
    };

    ECMicro.prototype.updDemandSupplyFn = function() {
    // --------------------------------
	var ch = this.canvas.charts;

	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_D();   upd_S();

	// Where do the lines cross?
	var ind = 0;
	for (ind=1; ind<MAX_IP; ind++) {
	    if (parseFloat(D[ind]) < parseFloat(S[ind])) break;  // demand slopes TL to BR 
	}

	var d_slope =    (parseFloat(Price[ind]) - parseFloat(Price[ind-1])) 
	    / (parseFloat(D[ind]) - parseFloat(D[ind-1]));
	var d_intercept = parseFloat(Price[ind]) - parseFloat(d_slope) * parseFloat(D[ind]);
	var s_slope =    (parseFloat(Price[ind]) - parseFloat(Price[ind-1])) 
	    / (parseFloat(S[ind]) - parseFloat(S[ind-1]));
	var s_intercept = parseFloat(Price[ind]) - parseFloat(s_slope) * parseFloat(S[ind]);
	
	var x_meet = (d_intercept - s_intercept) / (s_slope - d_slope);
	var y_meet = d_slope * x_meet + d_intercept;

	this.canvas.grClearGrid(null, 'thistle');  // Blank canvas
	this.canvas.grHeader('Supply & Demand', 'steelblue');
	this.canvas.grLegend([["Demand", 'orange'], ["Supply", 'magenta'], ["", 'steelblue'],
			      ["Crossover", 'steelblue'], 
			      ["D = " + parseFloat(x_meet).toFixed(2), 'orange'], 
			      ["S = " + parseFloat(y_meet).toFixed(2), 'magenta']], 'steelblue');

	this.canvas.grSetMainTitle(ch[0], 'Demand & Supply');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Demand/Supply');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Price');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], D[j-1], Price[j-1], D[j], Price[j], 'Orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], S[j-1], Price[j-1], S[j], Price[j], 'Magenta');
	
	this.canvas.grDropPerpendiculars(ch[0], x_meet, y_meet, 'green');  // Drop perpendiculars at crossover

	return;
    };

    ECMicro.prototype.ecDemandSupplyFn = function() {
    // ---------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;
	
	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_D();   upd_S();
	
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, D[j]); bigy = Math.max(bigy, S[j]);
	    }
	    bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, small, bigy, Price[0], Price[MAX_IP-1]);

	    this.updDemandSupplyFn();

	    return this;
	}
	else return null;
    };

    ECMicro.prototype.updKinkedDemandFn = function() {
    // --------------------------------
	var ch = this.canvas.charts;
	this.canvas.grClearGrid(null, 'thistle');  // Blank canvas
	this.canvas.grHeader('Kinked Demand Curve', 'steelblue');
	this.canvas.grLegend([["Demand", 'orange'], ["MR", 'magenta']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_KDemand();  upd_KMR();
	
	this.canvas.grSetMainTitle(ch[0], 'Demand & Marginal Rev.');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Demand');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Price ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], KDemand[j-1], KMR[j-1], KDemand[j], KMR[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], KDemand[j-1], Price[j-1], KDemand[j], Price[j], 'orange');

	return;
    };

    ECMicro.prototype.ecKinkedDemandFn = function() {
    // -------------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_KDemand();  upd_KMR();
	    
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,big=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, Price[j]); bigy = Math.max(bigy, KMR[j]);
		small = Math.min(small, Price[j]); small = Math.min(small, KMR[j]);
	    }
	    bigx = rescale(100.0 * (1+Q[MAX_IP-1]/100.0));  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updKinkedDemandFn();

	    return this;
	}
	else return null;
    };

    // ==================
	
    ECMicro.prototype.updKinkFn= function() {
    // ------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'thistle');  // Blank canvas
	this.canvas.grHeader('Kinked Monopolistic Equilibrium', 'steelblue');
	this.canvas.grLegend([["MC", 'red'], ["MR", 'orange'], 
			      ["AR", 'magenta'], ["ATC", 'blue']], 'steelblue');

	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_MC();   upd_KDemand();  upd_KMR();   upd_ATC();
	
	this.canvas.grSetMainTitle(ch[0], 'Costs / Unit Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Cost ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], ATC[j-1], Q[j], ATC[j], 'blue');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], KDemand[j-1], KMR[j-1], KDemand[j], KMR[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], KDemand[j-1], Price[j-1], KDemand[j], Price[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], MC[j-1], Q[j], MC[j], 'red');

	return;
    };

    ECMicro.prototype.ecKinkFn = function() {
    // -----------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_MC();   upd_KDemand();  upd_KMR();   upd_KDemand();  upd_ATC();
	
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, ATC[j]); 
		bigy = Math.max(bigy,  KMR[j]); Math.bigy = Math.max(bigy, Price[j]);
		small = Math.min(small, ATC[j]); small = Math.min(small, MC[j]);
		small = Math.min(small, KMR[j]); small = Math.min(small, Price[j]);
	    }
	    bigx = rescale(100.0 * (1+Q[MAX_IP-1]/100.0));  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);
	
	    this.updKinkFn();
	    return this;
	}
	else return null;
    };
	
    // Production Functions
    // ==================

    ECMicro.prototype.updFixTotCostFn = function() {
    // ------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Fixed & Total Costs', 'steelblue');
	this.canvas.grLegend([["TC", 'orange'], ["FC", 'magenta']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_TC();
	
	this.canvas.grSetMainTitle(ch[0], 'Costs vs Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Costs ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], Fixed_Cost[VAL], Q[j], Fixed_Cost[VAL], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], TC[j-1], Q[j], TC[j], 'orange');

	return;
    };

    ECMicro.prototype.ecFixTotCostFn = function() {
    // -----------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_TC();

	    // MP AP Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, TC[j]);
	    }
	    bigx = rescale(100.0 * (1 + Q[MAX_IP-1] / 100), );  bigy = rescale(bigy);
		
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updFixTotCostFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updMargCostRevFn = function() {
    // --------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Marginal Costs & Revenue', 'steelblue');
	this.canvas.grLegend([["MC", 'orange'], ["MR", 'magenta']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_MC();  upd_PerMR();
	
	this.canvas.grSetMainTitle(ch[0], 'MC & MR');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Costs ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], MC[j-1], Q[j], MC[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], PerMR[j-1], Q[j], PerMR[j], 'magenta');

	return;
    };

    ECMicro.prototype.ecMargCostRevFn = function() {
    // ------------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_MC();  upd_PerMR();

	    // MP AP Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    small = 0.0;	bigy = 2.0 * MC[1];
	    bigx = rescale(100.0 * (1 + Q[MAX_IP-1] / 100));  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updMargCostRevFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updProfitFn = function() {
    // --------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Profit', 'steelblue');
	this.canvas.grLegend([["TR", 'orange'], ["TC", 'magenta'], ["Profit", 'blue']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_TR();   upd_TC();  upd_Profit();
	
	this.canvas.grSetMainTitle(ch[0], 'TC - TR = Profit');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], '$');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], TR[j-1], Q[j], TR[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], TC[j-1], Q[j], TC[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], Profit[j-1], Q[j], Profit[j], 'blue');

	return;
    };

    ECMicro.prototype.ecProfitFn = function() {
    // -------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_TR();   upd_TC();  upd_Profit();

	    // MP AP Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, TC[j]);	bigy = Math.max(bigy, TC[j]);
		bigy = Math.max(bigy, Profit[j]);
		small = Math.min(small, TC[j]);	small = Math.min(small, TC[j]);
		small = Math.min(small, Profit[j]);
	    }
	    bigx = rescale(100 * (1 + Q[MAX_IP-1] / 100));  bigy = rescale(bigy);
	    small = rescale(small);
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updProfitFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updMargProdLabourFn = function() {
    // ----------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Marginal Product Labour', 'steelblue');
	this.canvas.grLegend([["MP", 'orange'], ["Wage Rate", 'magenta']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_MP();
	
	this.canvas.grSetMainTitle(ch[0], 'MP & Wage Rate');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Labour Input');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, Wage_Rate[VAL], j, Wage_Rate[VAL], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, MP[j-1], j, MP[j], 'orange');

	return;
    };

    ECMicro.prototype.ecMargProdLabourFn = function() {
    // ---------------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_MP();

	    // MP Labour Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, MP[j]);
	    }
	    bigy = rescale(bigy);
		
	    this.canvas.grSetScale(ch1, 0.0, MAX_IP, small, bigy);

	    this.updMargProdLabourFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updMargAvCostFn = function() {
    // ------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Marginal & Average Costs', 'steelblue');
	this.canvas.grLegend([["MC", 'orange'], ["AVC", 'magenta'], ["ATC", 'red']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_MC();   upd_AVC();  upd_ATC();
	
	this.canvas.grSetMainTitle(ch[0], 'MC, AVC & ATC');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Cost ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], MC[j-1], Q[j], MC[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], AVC[j-1], Q[j], AVC[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], ATC[j-1], Q[j], ATC[j], 'red');

	return;
    };

    ECMicro.prototype.ecMargAvCostFn = function() {
    // -----------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_MC();   upd_AVC();  upd_ATC();

	    // MP Labour Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    small = 0.0;  bigy = 2.0 * ATC[1];
	    bigx = rescale(100.0 * (1 + Q[MAX_IP-1] / 100));  bigy = rescale(bigy);
		
	    this.canvas.grSetScale(ch1, 0.0, bigx, small, bigy);

	    this.updMargAvCostFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updMAPProdFn = function() {
    // ------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Total Marginal Average Product', 'steelblue');
	this.canvas.grLegend([["MP", 'orange'], ["AP", 'magenta'], ["TP", 'red']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_AP();   upd_MP();
	
	this.canvas.grSetMainTitle(ch[0], 'TP, MP and AP');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Var. Factor Input');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, AP[j-1], j, AP[j], 'magenta');
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, MP[j-1], j, MP[j], 'orange');
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, Q[j-1], j, Q[j], 'red');

	return;
    };

    ECMicro.prototype.ecMAPProdFn = function() {
    // -----------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_AP();   upd_MP();

	    // MP AP Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, Q[j]);
	    }
	    bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, MAX_IP, small, bigy);

	    this.updMAPProdFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updMargAvProdFn = function() {
    // ------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'silver');  // Blank canvas
	this.canvas.grHeader('Marginal Average Productivity', 'steelblue');
	this.canvas.grLegend([["MP", 'orange'], ["AP", 'magenta']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_AP();   upd_MP();
	
	this.canvas.grSetMainTitle(ch[0], 'MP and AP');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');
	
	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Var. Factor Input');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, AP[j-1], j, AP[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, MP[j-1], j, MP[j], 'orange');

	return;
    };

    ECMicro.prototype.ecMargAvProdFn = function() {
    // -----------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_AP();   upd_MP();

	    // MP AP Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,big=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, MP[j]); bigy = Math.max(bigy, AP[j]);
		small = Math.min(small, MP[j]); small = Math.min(small, AP[j]);
	    }
	    bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, MAX_IP, small, bigy);

	    this.updMargAvProdFn();

	    return this;
	}
	else
	    return null;
    };    

    ECMicro.prototype.updEquilFn = function() {
    // -------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'white');  // Blank canvas
	this.canvas.grHeader('Monopolisitc Equilibrium', 'steelblue');
	this.canvas.grLegend([["MC", 'red'], ["MR", 'orange'], 
			      ["AR", 'magenta'], ["ATC", 'blue']], 'steelblue');

	// plots graphs of MC, MR, AR, ATC
	upd_Q();  upd_MC();   upd_CalcMR();   upd_CalcPrice();  upd_ATC();
	
	this.canvas.grSetMainTitle(ch[0], 'Costs / Unit Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Cost ($)');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], ATC[j-1], Q[j], ATC[j], 'blue');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], CalcPrice[j-1], Q[j], CalcPrice[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], CalcMR[j-1], Q[j], CalcMR[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], Q[j-1], MC[j-1], Q[j], MC[j], 'red');

	return;
    };

    ECMicro.prototype.ecEquilFn = function() {
    // ------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // plots graphs of MC, MR, AR, ATC
	    upd_Q();  upd_MC();   upd_CalcMR();   upd_CalcPrice();  upd_ATC();
	
	    // MC/MR/AR/ATC Graph
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, ATC[j]); 
		bigy = Math.max(bigy, CalcMR[j]);    bigy = Math.max(bigy, CalcPrice[j]);
		small = Math.min(small, ATC[j]);     small = Math.min(small, MC[j]);
		small = Math.min(small, CalcMR[j]);  small = Math.min(small, CalcPrice[j]);
	    }
	    small = rescale(small);  bigy = rescale(bigy);
	    this.canvas.grSetScale(ch1, 0.0, 100.0 * rescale(1+Q[MAX_IP-1]/100), small, bigy);

	    this.updEquilFn();

	    return this;
	};
    };

    ECMicro.prototype.updProdFnCost = function() {
    // ----------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'lightblue');  // Blank canvas
	this.canvas.grHeader('Composite Production Function', 'steelblue');
	this.canvas.grLegend([["Average Prod.", 'magenta'], ["Marginal Prod.", 'orange'],
			      ["Output", 'red'], ["Total Cost", 'blue'], ["Fixed Cost", 'darkred'],
			      ["Av. Total Cost", 'green'], ["Av. Variable Cost", 'brown'], 
			      ["Marginal Cost", 'steelblue']], 'steelblue');
	
	// These graphs are dependent on these data arrays.  Update them
	upd_Q();  upd_AP();   upd_MP();  upd_MC();  upd_TC();  upd_ATC();  upd_AVC();
	
	// Refresh structure, but not scale
	this.canvas.grGrid(ch[0], 'black');
	
	this.canvas.grSetXAxisTitle(ch[0], 'Var. Labour Input');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Output');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');
	
	// Output
	this.canvas.grGrid(ch[1], 'black');
	
	this.canvas.grSetXAxisTitle(ch[1], 'Labour Input');
	this.canvas.grAnnotate(ch[1], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[1], 'Output');
	this.canvas.grAnnotate(ch[1], this.canvas.types.labelType.FY, 0, '');
	
	// Total Costs
	this.canvas.grGrid(ch[2], 'black');
	
	this.canvas.grSetXAxisTitle(ch[2], 'Cost ($)');
	this.canvas.grAnnotate(ch[2], this.canvas.types.labelType.FX, 0, '');
	
	// Average Costs
	this.canvas.grGrid(ch[3], 'black');
	
	this.canvas.grSetXAxisTitle(ch[3], 'Cost ($)');
	this.canvas.grAnnotate(ch[3], this.canvas.types.labelType.FX, 0, '');

	// Now the graph lines
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, AP[j-1], j, AP[j], 'magenta');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[0], j-1, MP[j-1], j, MP[j], 'orange');
	
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[1], j-1, Q[j-1], j, Q[j], 'red');
	
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[2], TC[j-1], Q[j-1], TC[j], Q[j], 'blue');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[2], Fixed_Cost[VAL], Q[j-1], Fixed_Cost[VAL], Q[j], 'darkred');
	
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[3], ATC[j-1], Q[j-1], ATC[j], Q[j], 'green');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[3], AVC[j-1], Q[j-1], AVC[j], Q[j], 'orange');
	for (var j=2; j<MAX_IP; j++) 
	    this.canvas.grLine(ch[3], MC[j-1], Q[j-1], MC[j], Q[j], 'steelblue');
	
	// now try to draw the perpendiculars.  Find out the max of MP and AP.
	var big_MP = 0.0, big_AP = 0.0, peak_MP = 1, peak_AP = 1;
	
	for (var j=1; j<MAX_IP; j++) {
	    if (MP[j] > big_MP) { peak_MP = j; big_MP = MP[j]; }
	    if (AP[j] > big_AP) { peak_AP = j; big_AP = AP[j]; }
	}
	
	// now we know the Input values for the peaks
	this.canvas.grSetLineStyle(this.canvas.types.lineType.GRSMALLDOTLINE);
	this.canvas.grLineAbs(this.canvas.grX(ch[0], peak_AP), this.canvas.grY(ch[0], AP[peak_AP]), 
			      this.canvas.grX(ch[1], peak_AP), this.canvas.grY(ch[1], Q[peak_AP]), 'green', 1);
	this.canvas.grLineAbs(this.canvas.grX(ch[1], peak_AP), this.canvas.grY(ch[1], Q[peak_AP]), 
			      this.canvas.grX(ch[3], AVC[peak_AP]), this.canvas.grY(ch[3], Q[peak_AP]), 'green', 1);
	
	this.canvas.grLineAbs(this.canvas.grX(ch[0], peak_MP), this.canvas.grY(ch[0], MP[peak_MP]), 
			      this.canvas.grX(ch[1], peak_MP), this.canvas.grY(ch[1], Q[peak_MP]), 'green', 1);
	this.canvas.grLineAbs(this.canvas.grX(ch[1], peak_MP), this.canvas.grY(ch[1], Q[peak_MP]), 
			      this.canvas.grX(ch[3], MC[peak_MP]), this.canvas.grY(ch[3], Q[peak_MP]), 'green', 1);
	this.canvas.grSetLineStyle(this.canvas.types.lineType.GRDEFAULTLINE);
	
	return;
    };

    ECMicro.prototype.ecProdFnCost = function() {
    // ---------------------------
	var small = 0.0, bigx = 0.0, bigy = 0.0;

	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // These graphs are dependent on these data arrays.  Update them
	    upd_Q();  upd_AP();   upd_MP();  upd_MC();  upd_TC();  upd_ATC();  upd_AVC();

	    // Marginal Productivity
	    var ch1 = this.canvas.grChart(0.5, 0, 1, 0.5);  // TR Quadrant
	    for (var j=1, small=0.0,bigy=0.0; j<MAX_IP; j++) {
		bigy = Math.max(bigy, MP[j]);      bigy = Math.max(bigy, AP[j]);
		small = Math.min(small, MP[j]);  small = Math.min(small, AP[j]);
	    }
	    bigy = rescale(bigy);  // Round
	    this.canvas.grSetScale(ch1, 0.0, MAX_IP, small, bigy);

	    // Output
	    var ch2 = this.canvas.grChart(0.5, 0.5, 1, 1);  // BR quadrant
	    bigy = rescale(100.0 * (1 + Q[MAX_IP-1]/100.0));
	    this.canvas.grSetScale(ch2, 0.0, MAX_IP, 0.0, bigy);

	    // Total Costs
	    var ch3 = this.canvas.grChart(0.25, 0.5, 0.5, 1);  // Inner half of BL quadrant
	    for (var j=1, bigx=0.0; j<MAX_IP; j++) {
		bigx = Math.max(bigx, TC[j]);
	    }
	    bigx = rescale(bigx);
	    this.canvas.grSetScale(ch3, 0.0, bigx, 0.0, bigy);

	    // Average Costs
	    var ch4 = this.canvas.grChart(0, 0.5, 0.25, 1);  // Outer half of BL quadrant
	    bigx = 2.0 * MC[1];  bigx = rescale(bigx);
	    this.canvas.grSetScale(ch4, 0.0, bigx, 0.0, bigy);

	    this.updProdFnCost();  // Update the graph

	    return this;
	}
	else
	    return null;
    };    

    //Globally expose the defaults to allow for user updating/changing
    ECMicro.prototype.defaults = {
	graph : {
	    numplots: 42    // default fill size for Point Plot
	}
    };
    
    
    //Create a dictionary of chart types, to allow for extension of existing types
    ECMicro.prototype.types = {
	microType: {
	    MICRO0: 0, MICRO1: 1, MICRO2: 2
	}
    };
    
    //Global Micro helpers object for utility methods and classes
    var helpers = ECMicro.helpers = {};
    
    //-- Basic js utility methods
    var each = helpers.each = function(loopable,callback,self){
    };
    
    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    ECMicro.instances = {};
    
    var ecMicro = function(cid){ 
	return new ECMicro(cid); 
    };
    exports(ecMicro);
}
)(typeof(exports) === 'undefined' 
  ? function(f){this['ecMicro'] = f} 
  : function(f){module.exports = f}
 );
