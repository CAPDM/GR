/*!
 * qm-normal.js
 * http://www.capdm.com
 *
 * Copyright 2018 Ken Currie, CAPDM Ltd.
 * Released under the GNU license
 * https://github.com/XXX
 */

(function(exports){
    
    "use strict";
    
    const QMCTXT = "SOMETHING UNGUESSABLE";
    
    // Local setters
    function setMean(x) {
	mean = x;
	distribution2 = gaussian(mean, distribution2.variance);
	getData();	getAreaData();
    }
    
    function setSD(sd) {
	variance = sd;
	distribution2 = gaussian(distribution2.mean, sd);
	getData();	getAreaData();
    }
    
    var distribution = gaussian(0, 2);
    var randomScalingFactor = function(x) { return distribution.pdf(x) };
    
    // Confidence interval
    var ci = 2, mean = 20, variance = 2;
    var slices = 100;
    var xstart = 10, xend = 30, yend = 0.6;
    
    var distribution2 = gaussian(mean, variance);
    
    var data = [], areadata = [];  // Line and area to fill to ci level
    
    // (+mean) forces conversion of mean to a number, as it is typically treated
    // as a text value when changed by the sliders...
    function getData() {
	data = [];

	var step = (xend-xstart)/slices;
	for (var i = xstart; i <= xend; i+=step) {
	    var el = { "x" : i, "y" : distribution2.pdf(i) };
	    data.push(el)
	};
    }
    function getAreaData() {
	areadata = [];
	var step = (xend-mean)/slices;
	var end = (+mean)+(2*distribution2.standardDeviation)
	
	for (var i = (+mean); i <= end; i+=step) {
	    var el = { "x" : i, "y" : distribution2.pdf(i) };
	    areadata.push(el)
	};
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
	return (graph.ctx == QMCTXT) ? true : false;
    }

    // Normal model
    // ===========
    var _defaults, _mean, _sd;
    
    var QMNormal = function(cid) {
	this.ctx = QMCTXT;  // Set a content for checking, and any defaults
	_defaults = this.defaults;
	_mean = 20;  _sd = 2;

	this.canvas = grCanvas(cid);  // Create a new canvas

	return this;
    };
    

    // qm class
    var __qm = function () {
	this.qmstyle;  // Style for selected chart type */
    };


    // Some getters
    QMNormal.prototype.getMean = function () {
    // ------------------------
	return mean;
    }

    QMNormal.prototype.getSD = function () {
    // ---------------------
	return sd;
    }

    // ... and setters
    QMNormal.prototype.setMean = function (m) {
    // -----------------------
	_mean = m;	setMean(m);

	this.qmUpdNormalDistribution();  // Call the updater
    }

    QMNormal.prototype.setSD = function (sd) {
    // ---------------------
	_sd = sd;	setSD(sd);

	this.qmUpdNormalDistribution();  // Call the updater
    }

    QMNormal.prototype.setMeanSlider = function (id) {
    // -----------------------------
console.log("MEAN ID is " + id);
	document.getElementById(id).value = mean;
    }

    QMNormal.prototype.setSDSlider = function (id) {
    // ---------------------------
console.log("SD ID is " + id);
	document.getElementById(id).value = variance;
    }

    // Show 
    QMNormal.prototype.showAbout = function () {
    // -------------------------
	alert('Normal Distribution');
    }


    // Now the graphing routines

    QMNormal.prototype.qmUpdNormalDistribution = function() {
    // ---------------------------------------
	var ch = this.canvas.charts;

	this.canvas.grClearGrid(null, 'white');  // Blank canvas
	this.canvas.grHeader('The Normal Distribution', 'steelblue');
	this.canvas.grLegend([["Normal", 'blue'], ["95%", 'red']], 'steelblue');

	this.canvas.grSetMainTitle(ch[0], 'Gaussian');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FMAIN, 0, '');
	this.canvas.grSetSubTitle(ch[0], 'Plot');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FSUB, 0, '');

	// Get the latest data
	getData();  getAreaData();

	this.canvas.grGrid(ch[0], 'black', 1);
	
	this.canvas.grSetXAxisTitle(ch[0], 'Observations');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FX, 0, '');
	this.canvas.grSetYAxisTitle(ch[0], 'Prob.');
	this.canvas.grAnnotate(ch[0], this.canvas.types.labelType.FY, 0, '');

	// Plot the area fill.  Join up to the axis
	this.canvas.grAreaUnderCurve(ch[0], areadata, 'gold');	    

	// Now the 2 SD markers
	this.canvas.grSetLineStyle(2, 1);
	this.canvas.grLine(ch[0], (parseInt(mean) - (2 * parseFloat(distribution2.standardDeviation))), 0, 
			   (parseInt(mean) - (2 * parseFloat(distribution2.standardDeviation))), yend, 'red');
	this.canvas.grLine(ch[0], (parseInt(mean) + (2 * parseFloat(distribution2.standardDeviation))), 0, 
			   (parseInt(mean) + (2 * parseFloat(distribution2.standardDeviation))), yend, 'red');

	this.canvas.grSetLineStyle();  // Restore

	// Plot the data points
	for (var i = 1; i <= slices; i++) {
	    this.canvas.grLine(ch[0], data[i-1].x, data[i-1].y, data[i].x, data[i].y, 'blue');
	};

	return;
    };

    QMNormal.prototype.qmNormalDistribution = function() {
    // ------------------------------------
	if (checkCtxt(this)) {
	    this.canvas.setFont('12px Arial');

	    // Normal Distribution
	    var ch1 = this.canvas.grChart(0, 0, 1, 1);  // Chart is full canvas
	    this.canvas.grSetScale(ch1, xstart, xend, 0, yend);

	    this.qmUpdNormalDistribution();

	    return this;
	};
    };


    //Globally expose the defaults to allow for user updating/changing
    QMNormal.prototype.defaults = {
    };
    
    //Global helpers object for utility methods and classes
    var helpers = QMNormal.helpers = {};
    
    //-- Basic js utility methods
    var each = helpers.each = function(loopable,callback,self){
    };
    
    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    QMNormal.instances = {};
    
    var qmNormal = function(cid){ 
	return new QMNormal(cid); 
    };
    exports(qmNormal);
}
)(typeof(exports) === 'undefined' 
  ? function(f){this['qmNormal'] = f} 
  : function(f){module.exports = f}
 );
