/*!
 * grunit.js
 * http://www.capdm.com
 *
 * Copyright 2018 Ken Currie, CAPDM Ltd.
 * Released under the GNU license
 * https://github.com/XXX
 */

(function(exports){
    
    "use strict";

    const GRVERSION = 'GR 1.1';

    const GRMAXXPIXELS = 1000;	// CANVAS SIZE
    const GRMAXYPIXELS = 1000;	

    const GRMAXWINDOWS = 4;   // max. no. of graph ports per graph window/screen
    const GRMAXPLOTS = 4;     // max. no. of graph variables per port
    const FLT_MAX = 3.402823466e+38;		// max value  

    const GRFONTSIZE = 10;
    const GRFONTFAMILY = 'sans-serif';

    const GRMAXCHARTTYPE = 5;	// Maximum available chart type  
    const GRMAXCHARTSTYLE = 2;	// Maximum chart style  
    const GRTITLELEN = 30;	// Maximum title text length  

    const GRLEFT = 1;	// Positions used for titles and legends  
    const GRCENTER = 2;
    const GRRIGHT = 3;
    const GRBOTTOM = 4;
    const GROVERLAY = 5;

    const GRLINE = 0;
    const GRGRID = 0;  // Plain grid
    const GRAXIS = 1;  // Axis only grid

    const GRLINEARAXIS = 1;	// Used to specify axis types  
    const GRLOGAXIS = 2;

    const GRDECFORMAT = 1;	// Used to specify tic mark label format  
    const GREXPFORMAT = 2;

    const GRBARCHART = 1;	// Charttype for a bar chart  
    const GRCOLUMNCHART = 2;	// Charttype for a column chart  
    const GRPLAINBARS = 1;	// Styles for bar and column charts  
    const GRSTACKEDBARS = 2;
    const GRLINECHART = 3;	// Charttype for a line chart  
    const GRSCATTERCHART = 4;	// Charttype for a scatter chart  

    const GRPOINTANDLINE = 1;	// Styles for line and scatter charts  
    const GRPOINTONLY = 2;
    const GRLINEONLY = 3;

    const GRPIECHART = 5;	// Charttype for pie chart  
    const GRPERCENT = 1;	// Styles for pie charts  
    const GRNOPERCENT = 2;

    const GRTRENDCHART = 6;	// line plus scatter plot
    
    const GRCTXT = "SOMETHING UNGUESSABLE";

    var grLabels = [];  // Axis labels

    var lineType = {
	GRDEFAULTLINE: 0, GRDOTTEDLINE: 1, GRSMALLDOTLINE: 2
    };
    var grdiType = {
	GRGRID: 0, GRAXIS: 1
    };
    var symbolType = {	
	NOSYM: 0, DIAMOND: 1, DCROSS: 2, SQUARE: 3, STAR: 4, VCROSS: 5
    };

    var labelType = {
        FX: 0, FBARX: 1, FY: 2, FMAIN: 3, FSUB: 4, FLEGEND: 5
    };

    var clipType = {
	LEFT: 0, RIGHT: 1, BOTTOM: 2, TOP: 3
    }

    function checkCtxt(canvas) {
	return (canvas.ctx == GRCTXT) ? true : false;
    }

    function checkChart(chart) {
	return (chart instanceof __chart) ? true : false;
    }

    // Model the canvas
    // ================
//    var _defaults, _2d;
    var _defaults;

    var GRUnit = function(cid) {
	this.ctx = GRCTXT;  // Set a content for checking
	this.canvas = document.getElementById(cid);
	this.charts = [];  // Keep pointers to the charts

	_defaults = this.defaults;
	_defaults.canvas.numxpixels = this.canvas.width;  // Set the chartwindow to the canvas size
	_defaults.canvas.numypixels = this.canvas.height;

	if (this.canvas.getContext) {
	    // Get a CanvasRenderingContext2D object for a two-dimensional rendering context.
	    this.gr2d = this.canvas.getContext('2d');
	    this._2d = this.gr2d;
	}
	else {
	    alert("Can't get the 2D context.");
	}

	return this;
    };
    
    // Font class
    var __font = function() {
	this.size = GRFONTS;  // Px
	this.family = GRFONTFAMILY;
    };

    // Title class
    var __title = function() {
	this.title = '';
	this.titlecolour = 'cyan';
	this.justify = true;
    };

    // Axis class
    var __axis = function() {
	this.grid = true;  // TRUE=grid lines drawn
	this.gridstyle = GRGRID;	   // Style number from style pool
	this.axistitle = new __title();
	this.axiscolor = 'green';
	this.labeled = true;     // TRUE=tic marks and titles drawn 
	this.rangetype = GRLINEARAXIS; // or GR_LOGAXIS
	this.logbase = 0.0;      // Base used if log axis
	this.autoscale = true;   // TRUE=next 7 values calculated by system
	this.scalemin = 0.0;     // Minimum value of scale
	this.scalemax = 1.0;     // Maximum value of scale 
	this.scalefactor = 1.0;  // Scale factor for data on this axis
	this.scaletitle = new __title();  // Title for scaling factor
	this.ticinterval = 0.0;    // Distance between tic marks (world coord.)
	this.ticformat = GREXPFORMAT;  // or GR_DECFORMAT
	this.ticdecimals = 0;    // Number of decimals for tic labels (max=9)
    };

    // Window class
    var __window = function() {
	this.x1 = 0;  this.y1 = 0;  // Top Left edge of window in pixels
	this.x2 = _defaults.canvas.numxpixels; // Bottom Right edge of window
	this.y2 = _defaults.canvas.numypixels;
	this.border = true; 
	this.background = 'white';
	this.borderstyle = lineType.GRDEFAULTLINE;
	this.bordercolor = 'black';
    };

    // Legend class
    var __legend = function () {
	this.legend = true;
	this.place = GRRIGHT;  // or GR_BOTTOM, GR_OVERLAY
	this.textcolor = 'cyan';
	this.autosize = true;   // TRUE=system calculates size */
	this.legendwindow = new __window();  // Window for legend
    };

    // Chart class
    var __chart = function () {
	this.charttype = GRLINE;  // or GR_BAR, GR_COLUMN, GR_SCATTER, GR_PIE
	this.chartstyle;  // Style for selected chart type */
	this.chartwindow = new __window();  // Window for overall chart
	this.datawindow = new __window();   // Window for data part of chart
	this.maintitle = new __title();
	this.subtitle = new __title();
	this.xaxis = new __axis();
	this.yaxis = new __axis();
	this.legend = new __legend();
    };

    // datawindow clip region functions
    function clipCode(chart, x, y) {
    // ---------------------------
	var ret = [];

	if (x < chart.datawindow.x1) ret.push(clipType.LEFT)
	else if (x > chart.datawindow.x2) ret.push(clipType.RIGHT);

	if (y < chart.datawindow.y1) ret.push(clipType.TOP)
	else if (y > chart.datawindow.y2) ret.push(clipType.BOTTOM)

	return ret;
    }

    function clip(chart, x1, y1, x2, y2) {
    // ---------------------------------
	var _x1 = x1, _y1 = y1, _x2 = x2, _y2 = y2;  // Working variables 

	var x, y, visible = true;
	var c = [], c1 = clipCode(chart, x1, y1), c2 = clipCode(chart, x2, y2);

	while ((c1.length > 0 || c2.length > 0) && visible) {
	    if (([...c1].filter(x => c2.includes(x)).length != 0)) {  // ... spread operator
		visible = false;  // Set intersection - empty
	    }
	    else {
		c = (c1.length == 0) ? c2 : c1;  // Pick up a non-empty set
//console.log("Does array " + c + " of type " + c.constructor + "  include " + clipType.LEFT);
		if (c.includes(clipType.LEFT)) {  // Crosses left edge; recalc y
		    x = chart.datawindow.x1;
		    y = _y1 + (_y2 - _y1) * (chart.datawindow.x1 - _x2)/(_x2 - _x1);  
		}
		else if (c.includes(clipType.RIGHT)) {  // Crosses Right Edge
		    x = chart.datawindow.x2;
		    y = _y1 + (_y2 - _y1) * (chart.datawindow.x2 - _x1)/(_x2 - _x1);
		}
		else if (c.includes(clipType.BOTTOM)) { // Crosses Bottom
		    y = chart.datawindow.y2;
		    x = _x1 + (_x2 - _x1) * (chart.datawindow.y2 - _y1)/(_y2 - _y1);
		}
		else if (c.includes(clipType.TOP)) {  // Crosses Top
		    y = chart.datawindow.y1;
		    x = _x1 + (_x2 - _x1) * (chart.datawindow.y1 - _y1)/(_y2 - _y1);   
		}
	    }	  

	    // Now check if these are identical arrays
	    if (c.length == c1.length && c.every((e, i) => e === c1[i])) {
		_x1 = x; _y1 = y;  c1 = clipCode(chart, _x1, _y1);
	    }
	    else {
		_x2 = x; _y2 = y; c2 = clipCode(chart, _x2, _y2);
	    }
	}  // C1*C2=[] - the line from (x1,y1) to (x2,y2) is clipped

	if (visible) 
	    return [true, _x1, _y1, _x2, _y2];  // Clipped
	else return [false, 0, 0, 0, 0];
    }

    // Some getters
    GRUnit.prototype.getMaxX = function () {
    // ---------------------
	return this.defaults.canvas.numxpixels;
    }

    GRUnit.prototype.getMaxY = function () {
    // ---------------------
	return this.defaults.canvas.numypixels;
    }

    GRUnit.prototype.getFontWidth = function () {
    // --------------------------
	var w = this._2d.measureText('W');  // W is as good a char as any
	return w.width;
    }

    GRUnit.prototype.getFontHeight = function () {
    // ---------------------------
	var h = this._2d.measureText('W');  // Only Width supported?
	return h.width;
    }

    // ... and setters
    GRUnit.prototype.setFont = function (f) {
    // ---------------------
	this._2d.font = f;
    }

    GRUnit.prototype.grSetLineStyle = function(dash = lineType.GRDEFAULTLINE, width = this.defaults.canvas.linewidth) {
    // --------------------
	switch (dash){
	case lineType.GRDOTTEDLINE:
	    this.defaults.canvas.linedash = [4, 8];  this.defaults.canvas.linewidth = width;
	    break;
	case lineType.GRSMALLDOTLINE:
	    this.defaults.canvas.linedash = [2, 4];  this.defaults.canvas.linewidth = width;
	    break;
	case lineType.GRDEFAULTLINE:
	default:
	    this.defaults.canvas.linedash = [];      this.defaults.canvas.linewidth = width;
	    break;
	}
    };

    GRUnit.prototype.grSetMainTitle = function(chart, s = '', col = this.defaults.maintitle.titlecolor) {
    // ----------------------------
	chart.maintitle.title = s;  chart.maintitle.colour = col;
    }
    
    GRUnit.prototype.grSetSubTitle = function(chart, s = '', col = this.defaults.subtitle.titlecolor) {
    // ---------------------------
	chart.subtitle.title = s;  chart.subtitle.colour = col;
    }
    
    GRUnit.prototype.grSetXAxisTitle = function(chart, s = '', col = this.defaults.xaxis.titlecolor) {
    // -----------------------------
	chart.xaxis.axistitle.title = s;  chart.xaxis.axistitle.colour = col;
    }
    
    GRUnit.prototype.grSetYAxisTitle = function(chart, s = '', col = this.defaults.xaxis.titlecolor) {
    // -----------------------------
	chart.yaxis.axistitle.title = s;  chart.yaxis.axistitle.colour = col;
    }
    
    GRUnit.prototype.grChart = function(xtl = 0, ytl = 0, xbr = 1, ybr = 1) {
    // ---------------------
	// Expressed as a fraction of 1
	if (checkCtxt(this)) {
	    var _xtl = parseFloat(xtl) * this.canvas.width, _xbr = parseFloat(xbr) * this.canvas.width;  
	    var _ytl = parseFloat(ytl) * this.canvas.height, _ybr = parseFloat(ybr) * this.canvas.height;  
	    var c = this.charts.push(new __chart()) - 1;  // New index

	    // Record its canvas coords
	    this.charts[c].chartwindow.x1 = _xtl; this.charts[c].chartwindow.y1 = _ytl;
	    this.charts[c].chartwindow.x2 = _xbr; this.charts[c].chartwindow.y2 = _ybr;
	    
	    // Check to see if we are to use non-defaults
	    if (_xtl >=0 && _xtl <  GRMAXXPIXELS && _ytl >=0 && _ytl <  GRMAXYPIXELS &&
		_xbr > 0 && _xbr <= GRMAXXPIXELS && _ybr > 0 && _ybr <= GRMAXYPIXELS) {
		// Create a DW that is a 1/4 in with space around for annotations
		if (!isNaN(xtl) && _xtl < _xbr) this.charts[c].datawindow.x1 = _xtl + ((_xbr - _xtl)/4.0);
		if (!isNaN(ytl) && _ytl < _ybr) this.charts[c].datawindow.y1 = _ytl + this.getFontHeight()*3;
		if (!isNaN(xbr) && _xbr > _xtl) this.charts[c].datawindow.x2 = _xbr - this.getFontWidth();
		if (!isNaN(ybr) && _ybr > _ytl) this.charts[c].datawindow.y2 = _ybr - this.getFontHeight()*3;
	    }
	    
	    // Now set a default scale
	    this.grSetScale(this, _xtl, _ytl, _xbr, _ybr);

	    return this.charts[c];  // Add a new chart to the array
	}
	else
	    return null;
    };
    
    GRUnit.prototype.grX = function(chart, x) {
    // -----------------
	return (chart.datawindow.x1 + ((x - chart.xaxis.scalemin) / chart.xaxis.scalefactor));
    };

    GRUnit.prototype.grY = function(chart, y) {
    // -----------------
	return (chart.datawindow.y2 - ((y - chart.yaxis.scalemin) / chart.yaxis.scalefactor));
    };

    GRUnit.prototype.grSetScale = function(chart, xmin, xmax, ymin, ymax) {
    // ------------------------
	if (xmin >= xmax || ymin >= ymax) return false;  // Problem

	try {
	    if (checkChart(chart)) {
		chart.xaxis.scalemin = xmin;	chart.xaxis.scalemax = xmax;
		chart.yaxis.scalemin = ymin;	chart.yaxis.scalemax = ymax;
		
		/* now calculate the scale */
		chart.xaxis.scalefactor = (chart.xaxis.scalemax - chart.xaxis.scalemin) /
                    (chart.datawindow.x2 - chart.datawindow.x1);
		chart.yaxis.scalefactor = (chart.yaxis.scalemax - chart.yaxis.scalemin) /
         	    (chart.datawindow.y2 - chart.datawindow.y1);
		
		// Set 10 ticks per axis
		if (chart.xaxis.ticinterval == 0.0)
		    chart.xaxis.ticinterval = (chart.xaxis.scalemax - chart.xaxis.scalemin) / 10.0;
		if (chart.yaxis.ticinterval == 0.0)
		    chart.yaxis.ticinterval = (chart.yaxis.scalemax - chart.yaxis.scalemin) / 10.0;
	    }
	}
	catch(err) {
	    return;
	}	

   	return true;
    };

    GRUnit.prototype.grClip = function(grchart) {
    // --------------------
    };
    
    GRUnit.prototype.grClearGrid = function(chart = null, col = this.defaults.chartwindow.background) {
    // -------------------------
	try {
	    this._2d.fillStyle = col;
	    if (chart == null) {  // Clear whole canvas
		this._2d.fillRect(0, 0, parseInt(this.canvas.width), parseInt(this.canvas.height));
	    }
	    else if (checkChart(chart)) {
		this._2d.fillRect(chart.datawindow.x1, chart.datawindow.y1, 
			     chart.datawindow.x2 - chart.datawindow.x1, chart.datawindow.y2 - chart.datawindow.y1);    
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grGrid = function(chart, col = this.defaults.datawindow.background, style = 0) {
    // --------------------
	try {
	    if (checkChart(chart)) {
		this.grClearGrid(chart, chart.datawindow.background);

		if (style == 1) {  // These are coords
		    this.grDrawArrow(chart, chart.xaxis.scalemin, chart.yaxis.scalemin, 
				     chart.xaxis.scalemax, chart.yaxis.scalemin);
		    this.grDrawArrow(chart, chart.xaxis.scalemin, chart.yaxis.scalemin,
				     chart.xaxis.scalemin, chart.yaxis.scalemax);
		}
		else {  // These are x/y and width/heighth
		    this.grRectangle(chart, chart.xaxis.scalemin, chart.yaxis.scalemin,
				     chart.xaxis.scalemax - chart.xaxis.scalemin, 
				     chart.yaxis.scalemax - chart.yaxis.scalemin, col);
		}
		

		var x_val = 0.0, y_val = 0.0, tics = 1;

		// May need to draw axis other than along the grid
		if (chart.xaxis.scalemin != 0.0 && chart.xaxis.scalemax != 0.0) {
		    if ((chart.xaxis.scalemin < 0.0 && chart.xaxis.scalemax > 0.0) ||
			(chart.xaxis.scalemin > 0.0 && chart.xaxis.scalemax < 0.0))
			x_val = 0.0;
		    else x_val = chart.xaxis.scalemin;
		    this.grLine(chart, x_val, chart.yaxis.scalemax, x_val, chart.yaxis.scalemin, col);
		}
		if (chart.yaxis.scalemin != 0.0 && chart.yaxis.scalemax != 0.0) {
		    if ((chart.yaxis.scalemin < 0.0 && chart.yaxis.scalemax > 0.0) ||
			(chart.yaxis.scalemin > 0.0 && chart.yaxis.scalemax < 0.0))
			y_val = 0.0;
		    else y_val = chart.yaxis.scalemin;
		    this.grLine(chart, chart.xaxis.scalemax, y_val, chart.xaxis.scalemin, y_val, col);
		}
		
		tics = (chart.xaxis.scalemax - chart.xaxis.scalemin) / chart.xaxis.ticinterval;
		for (var i=0; i<=tics-1; i++) {  // Don't put one at the very end
		    this.grLine(chart, parseFloat(chart.xaxis.scalemin + i * chart.xaxis.ticinterval), y_val,
	 			parseFloat(chart.xaxis.scalemin + i * chart.xaxis.ticinterval),
				parseFloat(y_val + Math.abs(chart.yaxis.scalemax - chart.yaxis.scalemin)/50.0), col)
		}
		
		tics = (chart.yaxis.scalemax - chart.yaxis.scalemin) / chart.yaxis.ticinterval;
		for (var i=0; i<=tics-1; i++) {
		    this.grLine(chart, x_val, chart.yaxis.scalemin + i * chart.yaxis.ticinterval, 
	 			x_val + Math.abs(chart.xaxis.scalemax - chart.xaxis.scalemin)/100.0,
				chart.yaxis.scalemin + i * chart.yaxis.ticinterval, col);
		}
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grRestoreGrid = function(chart, col) {
    // ---------------------------
	try {
	    if (checkChart(chart)) {
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grHeader = function(title, col = 'black') {
    // ----------------------
	if (title.length > 0) {
	    this._2d.fillStyle = col;  this._2d.textAlign = 'left';
	    this._2d.fillText(title, this.getFontWidth(), this.getFontHeight());  // One char in and down
        }
    };

    GRUnit.prototype.grLegend = function(labels, col = 'black') {
    // ----------------------
	// Takes an array of pairs - text & col
	this._2d.textAlign = 'left';

	this._2d.fillStyle = col;
	this._2d.fillText('Legend:', this.getFontWidth(), 3 * this.getFontHeight());  // One char in and 3 down

	for (var i=0; i<labels.length; i++) {
	    this._2d.fillStyle = labels[i][1];  // Pick up the colour
	    this._2d.fillText(labels[i][0], this.getFontWidth() * 2, (i+4) * this.getFontHeight());  // One char in, 4 down
	}
    };
    
    GRUnit.prototype.grAnnotate = function(chart, feature, items, labels, col = '') {
    // ------------------------

	var x_left, x_right, y_top, y_bottom;  // Working integers
	var space, i;
	var big = 0.0, small = 0.0;  // To calculate the range
	var gr_x_text = this.getFontWidth(), gr_y_text = this.getFontHeight();  // Font related
	
	switch (feature) {
	case labelType.FX:
	    if (chart.xaxis.axistitle.title.length > 0) {
		x_left = chart.datawindow.x1 / gr_x_text;    x_right  = chart.datawindow.x2 / gr_x_text;
		y_top  = chart.datawindow.y1/ gr_y_text;
 		y_bottom = (chart.datawindow.y2 + gr_y_text + 1) / gr_y_text;
		
		// if there are too many 000s lose some... 
		   big = chart.xaxis.scalemax;  small = chart.xaxis.scalemin;
		   // ... except if integers are demanded 
		if (chart.xaxis.ticdecimals != 0) {
		    if (Math.abs(small) > 1000.0 && Math.abs(big) > 1000.0) {
			small /= 1000.0;   big /= 1000.0;
		    }
		}
		
		this._2d.fillStyle = (col == '') ? chart.xaxis.axistitle.colour : col;  // Set the colour
		this._2d.textAlign = 'right';
		this._2d.fillText(chart.xaxis.axistitle.title, 
			     chart.datawindow.x2, chart.datawindow.y2 + 2 * gr_y_text);
		this._2d.fillStyle = (col == '') ? 'black' : col;  // Set the colour
		this._2d.textAlign = 'left';
		this._2d.fillText(small, chart.datawindow.x1, chart.datawindow.y2 + gr_y_text);
		this._2d.textAlign = 'center';
		this._2d.fillText(small+(big-small)/2, 
				  chart.datawindow.x1 + (chart.datawindow.x2 - chart.datawindow.x1)/2, 
				  chart.datawindow.y2 + gr_y_text);
		this._2d.textAlign = 'right';
		this._2d.fillText(big,   chart.datawindow.x2, chart.datawindow.y2 + gr_y_text);
	    }
	    break;
/*
	case labelType.FBARX:
	    x_left = chart.datawindow.x1 / gr_x_text;    x_right  = chart.datawindow.x2 / gr_x_text;
	    y_top  = chart.datawindow.y1 / gr_y_text;
 	    y_bottom = (chart.datawindow.y2 + gr_y_text - 1) / gr_y_text;
	    
	    space = ((x_right - x_left) / (2*items + 1)) + 1;
	    
	    sc_fore_gnd(HWHITE);
	    for (var i=0; i<items; i++) {
		sc_goto_xy(x_left + ((3+4*i) * space - strlen(*(labels+i))) / 2, y_bottom);
		printf("%s", *(labels+i));
	    }
	    
	    sc_fore_gnd(col);   // set the colour 
	    sc_goto_xy(x_right-strlen(chart.xaxis.axistitle.title), y_bottom+1);
	    printf("%s", chart.xaxis.axistitle.title);
	    break;
*/
	case labelType.FY:
	    if (chart.yaxis.axistitle.title.length > 0) {
		x_left = chart.datawindow.x1 / gr_x_text;    x_right  = chart.datawindow.x2 / gr_x_text;
		y_top  = chart.datawindow.y1 / gr_y_text;    y_bottom = chart.datawindow.y2 / gr_y_text;
		
		// if there are too many 000s lose some... 
		big = chart.yaxis.scalemax;  small = chart.yaxis.scalemin;
		
		// ... except if integers are demanded 
		if (chart.yaxis.ticdecimals != 0) {
		    if (Math.abs(small) > 1000.0 && Math.abs(big) > 1000.0) {
			small /= 1000.0; big /= 1000.0;
		    }
		}
		
		this._2d.textAlign = 'right';  // Everything R aligned
		this._2d.fillStyle = (col == '') ? chart.xaxis.axistitle.colour : col;  // Set the colour
		this._2d.fillText(chart.yaxis.axistitle.title, 
			     chart.datawindow.x1, chart.datawindow.y1 - gr_y_text);  // One line up from the top
		this._2d.fillStyle = (col == '') ? 'black' : col;  // Set the colour
		this._2d.fillText(small, chart.datawindow.x1 - gr_x_text, chart.datawindow.y2);
		var diff = (big - small) / 6, diffy = (chart.datawindow.y2 - chart.datawindow.y1) / 6;
		for (var i=1; i<=5; i++) {  // Draw three in between - five in all (usually 10 tics)
		    this._2d.fillText((big - i * diff).toFixed(1),   
				      chart.datawindow.x1 - gr_x_text, 
				      chart.datawindow.y1 + (i * diffy) + gr_y_text); // One line down		    
		}
		this._2d.fillText(big,   chart.datawindow.x1 - gr_x_text, chart.datawindow.y1 + gr_y_text); // One line down
	    }
	    break;
	case labelType.FMAIN:
	    if (chart.maintitle.title.length > 0) {
		x_left = chart.chartwindow.x1 / gr_x_text;    x_right  = chart.chartwindow.x2 / gr_x_text;
		y_top  = chart.chartwindow.y1 / gr_y_text;    y_bottom = chart.chartwindow.y2 / gr_y_text;
		
		this._2d.fillStyle = (col == '') ? chart.maintitle.colour : col;  // Set the colour
		this._2d.textAlign = 'right';
		this._2d.fillText(chart.maintitle.title, 
			     chart.chartwindow.x2 - gr_x_text, chart.chartwindow.y1 + gr_y_text);
	    }
	    break;
	case labelType.FSUB:
	    if (chart.subtitle.title.length > 0) {
		x_left = chart.chartwindow.x1 / gr_x_text;    x_right  = chart.chartwindow.x2 / gr_x_text;
		y_top  = chart.chartwindow.y1 / gr_y_text;    y_bottom = chart.chartwindow.y2 / gr_y_text;
		
		this._2d.fillStyle = (col == '') ? chart.subtitle.colour : col;  // Set the colour
		this._2d.textAlign = 'right';
		this._2d.fillText(chart.subtitle.title,
			     chart.chartwindow.x2 - gr_x_text, chart.chartwindow.y1 + 2 * gr_y_text);
	    }
	    break;
	default: // do nothing
	    break;
	}
    };
    
    GRUnit.prototype.grPlot = function(chart, x, y, col) {
    // --------------------
	var p = this.defaults.canvas.numfillpixels;

	try {
	    if (checkChart(chart)) {
		this._2d.fillStyle = col;
		this._2d.rect(this.grX(chart, x), this.grY(chart, y), p, p); 
		this._2d.fill();  
	    }
	}
	catch(err) {
	    return;
	}	
    };

    // Draw arrowheads
    GRUnit.prototype.grDrawHead = function(chart, x0, y0, x1, y1, x2, y2, style) {
    // ------------------------
	try {
	    if (checkChart(chart)) {
		// Check parameters
		if (typeof(x0) == 'string') x0 = parseInt(x0);	if (typeof(y0) == 'string') y0 = parseInt(y0);
		if (typeof(x1) == 'string') x1 = parseInt(x1);	if (typeof(y1) == 'string') y1 = parseInt(y1);
		if (typeof(x2) == 'string') x2 = parseInt(x2);	if (typeof(y2) == 'string') y2 = parseInt(y2);
		var radius =3, twoPI = 2 * Math.PI;
		
		// All cases do this.
		this._2d.save();	this._2d.beginPath();   this._2d.fillStyle = 'black';
		this._2d.moveTo(x0, y0);	this._2d.lineTo(x1, y1);	this._2d.lineTo(x2, y2);
		switch(style){
		case 0:
		    // curved filled, add the bottom as an arcTo curve and fill
		    var backdist = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
		    this._2d.arcTo(x1, y1, x0, y0, 0.55*backdist);
		    this._2d.fill();
		    break;
		case 1:
		    // straight filled, add the bottom as a line and fill.
		    this._2d.beginPath();
		    this._2d.moveTo(x0, y0);	    this._2d.lineTo(x1, y1);	    this._2d.lineTo(x2, y2);	    this._2d.lineTo(x0, y0);
		    this._2d.fill();
		    break;
		case 2:
		    // unfilled head, just stroke.
		    this._2d.stroke();
		    break;
		case 3:
		    //filled head, add the bottom as a quadraticCurveTo curve and fill
		    var cpx = (x0 + x1 + x2) / 3, cpy = (y0 + y1 + y2) / 3;
		    this._2d.quadraticCurveTo(cpx, cpy, x0, y0);
		    this._2d.fill();
		    break;
		case 4:
		    //filled head, add the bottom as a bezierCurveTo curve and fill
		    var cp1x, cp1y, cp2x, cp2y, backdist;
		    var shiftamt = 5;
		    if (x2 == x0) {
			// Avoid a divide by zero if x2==x0
			backdist = y2 - y0;
			cp1x = (x1 + x0) / 2;		  cp2x = (x1 + x0) / 2;
			cp1y = y1 + backdist / shiftamt;  cp2y = y1 - backdist / shiftamt;
		    }
		    else {
			backdist = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
			var xback = (x0 + x2) / 2, yback = (y0 + y2) / 2;
			var xmid = (xback + x1) / 2, ymid = (yback + y1) / 2;
			
			var m = (y2 - y0) / (x2 - x0);
			var dx = (backdist / (2 * Math.sqrt(m * m + 1))) / shiftamt, dy = m * dx;
			cp1x = xmid - dx;  cp1y = ymid - dy;  cp2x = xmid + dx;  cp2y = ymid + dy;
		    }
		    
		    this._2d.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x0, y0);
		    this._2d.fill();
		    break;
		}
		
		this._2d.restore();
	    }
	}
	catch(err) {
	    return;
	}	
    };

    GRUnit.prototype.grDrawArrow = function(chart, x1, y1, x2, y2, style, which, angle, d) {
    // -------------------------
	try {
	    if (checkChart(chart)) {
		// Check the parameters
		if (typeof(x1) == 'string') x1 = parseInt(x1);	if (typeof(y1) == 'string') y1 = parseInt(y1);
		if (typeof(x2) == 'string') x2 = parseInt(x2);	if (typeof(y2) == 'string') y2 = parseInt(y2);
		style = typeof(style) != 'undefined' ? style : 3;
		which = typeof(which) != 'undefined' ? which : 1; // end point gets arrow
		angle = typeof(angle) != 'undefined' ? angle : Math.PI/8;
		d     = typeof(d)     != 'undefined' ? d :10;

		// Convert the coords
		x1 = this.grX(chart, x1);  y1 = this.grY(chart, y1);
		x2 = this.grX(chart, x2);  y2 = this.grY(chart, y2);

		// For ends with arrow we actually want to stop before we get to the arrow
		// so that wide lines won't put a flat end on the arrow.
		var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
		var ratio=(dist - d/3) / dist;
		var tox, toy, fromx, fromy;
		if (which & 1) {
		    tox = Math.round(x1 + (x2 - x1) * ratio);   toy = Math.round(y1 + (y2 - y1) * ratio);
		}
		else {
		    tox = x2;    toy = y2;
		}
		if (which & 2) {
		    fromx = x1 + (x2 - x1) * (1 - ratio);    fromy = y1 + (y2 - y1) * (1 - ratio);
		}
		else {
		    fromx = x1;    fromy = y1;
		}
		
		// Draw the shaft of the arrow
		this._2d.beginPath();
		this._2d.moveTo(fromx, fromy);	this._2d.lineTo(tox, toy);
		this._2d.stroke();
		
		// calculate the angle of the line
		var lineangle = Math.atan2(y2 - y1, x2 - x1);
		// h is the line length of a side of the arrow head
		var h = Math.abs(d / Math.cos(angle));
		
		if (which & 1) {	// handle far end arrow head
		    var angle1 = lineangle + Math.PI + angle;
		    var topx = x2 + Math.cos(angle1) * h, topy = y2 + Math.sin(angle1) * h;
		    var angle2 = lineangle + Math.PI - angle;
		    var botx = x2 + Math.cos(angle2) * h,  boty = y2 + Math.sin(angle2) * h;
		    this.grDrawHead(chart, topx, topy, x2, y2, botx, boty, style);
		}
		if (which & 2) { // handle near end arrow head
		    var angle1 = lineangle + angle;
		    var topx = x1 + Math.cos(angle1) * h,  topy = y1 + Math.sin(angle1) * h;
		    var angle2 = lineangle - angle;
		    var botx = x1 + Math.cos(angle2) * h,  boty = y1 + Math.sin(angle2) * h;
		    this.grDrawHead(chart, topx, topy, x1, y1, botx, boty, style);
		}
	    }
	}
	catch(err) {
	    return;
	}	
    }
    
    // grLine uses this._2d coords, translated by grX and grY
    GRUnit.prototype.grLine = function(chart, xf, yf, xt, yt, col, w = this.defaults.canvas.linewidth) {
    // --------------------
	// Check the Clip region.  Returns grX/Y coords.
	var c = clip(chart, 
		     this.grX(chart, xf), this.grY(chart, yf), 
		     this.grX(chart, xt), this.grY(chart, yt));
	if (c[0]) {
	    // Line to be drawn
	    var _xf = c[1], _yf = c[2], _xt = c[3], _yt = c[4];

	    try {
		if (checkChart(chart)) {
		    var oldcol = this._2d.strokeStyle, oldwidth = this._2d.lineWidth;
		    this._2d.strokeStyle = col;  this._2d.lineWidth = w;  // Slightly thicker line
		    this._2d.setLineDash(this.defaults.canvas.linedash);  // Array of numbers
 		    this._2d.beginPath();  // New path, empty 
		    this._2d.moveTo(_xf, _yf);  
		    this._2d.lineTo(_xt, _yt);
		    this._2d.stroke();
		    this._2d.lineWidth = oldwidth;  this._2d.strokeStyle = oldcol;  // ... and restore
		}
	    }
	    catch(err) {
		return;
	    }	
	}
    };
    
    GRUnit.prototype.grLineAbs = function(xf, yf, xt, yt, col, w = this.defaults.canvas.linewidth) {
    // -----------------------
	// Draws a line on the canvas
	try {
	    var oldcol = this._2d.strokeStyle;
	    this._2d.strokeStyle = col;  this._2d.lineWidth = w; 
 	    this._2d.beginPath();  // New path, empty 
	    this._2d.setLineDash(this.defaults.canvas.linedash);  // Array of numbers
	    this._2d.moveTo(xf, yf);  this._2d.lineTo(xt, yt);
	    this._2d.stroke();
	    this._2d.strokeStyle = oldcol;  // ... and restore
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grAreaUnderCurve = function(chart, areadata, col) {
    // ------------------------------
	var oldcol = this._2d.fillStyle;

	this._2d.fillStyle = col;  
 	this._2d.beginPath();  // New path, empty 

	this._2d.moveTo(this.grX(chart, areadata[0].x), this.grY(chart, 0));
	this._2d.lineTo(this.grX(chart, areadata[0].x), this.grY(chart, areadata[0].y));	    
	for (var i=1; i<areadata.length; i++) {
	    this._2d.lineTo(this.grX(chart, areadata[i].x), this.grY(chart, areadata[i].y));	    
	}
	this._2d.lineTo(this.grX(chart, areadata[areadata.length-1].x), this.grY(chart, 0));	    

	this._2d.fill();
	this._2d.fillStyle = oldcol;  // ... and restore
    };
    
    GRUnit.prototype.grRectangle = function(chart, x, y, w, h, col) {
    // -------------------------
	try {
	    if (checkChart(chart)) {  // Plot the path
		var oldcol = this._2d.strokeStyle;
		this._2d.strokeStyle = col;
 		this._2d.beginPath();  // New path, empty old
		this._2d.setLineDash(this.defaults.canvas.linedash);  // Array of numbers
		this._2d.moveTo(this.grX(chart, x),   this.grY(chart, y));  
		this._2d.lineTo(this.grX(chart, x+w), this.grY(chart, y));  
		this._2d.lineTo(this.grX(chart, x+w), this.grY(chart, y+h));  
		this._2d.lineTo(this.grX(chart, x),   this.grY(chart, y+h));  
		this._2d.lineTo(this.grX(chart, x),   this.grY(chart, y));  
		this._2d.stroke();
		this._2d.strokeStyle = oldcol;  // ... and restore
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grSymbol = function(chart, x, y, sym, col) {
    // ----------------------
	try {
	    if (checkChart(chart)) {
		var ss = this.defaults.canvas.numsymbolpixels * chart.xaxis.scalefactor;

		switch (sym) {
		case this.types.symbolType.DCROSS:
		    this.grLine(chart, x-ss, y-ss, x+ss, y+ss, col);
		    this.grLine(chart, x-ss, y+ss, x+ss, y-ss, col);
		    break;
       		case this.types.symbolType.DIAMOND:
		    this.grLine(chart, x-ss, y, x, y-ss, col);   
		    this.grLine(chart, x, y-ss, x+ss, y, col);
		    this.grLine(chart, x+ss, y, x, y+ss, col);  
		    this.grLine(chart, x, y+ss, x-ss, y, col);
		    break;
      		case this.types.symbolType.SQUARE:
		    this.grLine(chart, x+ss, y-ss, x+ss, y+ss, col);  
		    this.grLine(chart, x+ss, y+ss, x-ss, y+ss, col);
		    this.grLine(chart, x-ss, y+ss, x-ss, y-ss, col);
		    this.grLine(chart, x-ss, y-ss, x+ss, y-ss, col);
		    break;
       		case this.types.symbolType.STAR:
		    this.grLine(chart, x-ss, y-ss, x+ss, y+ss, col);
		    this.grLine(chart, x-ss, y+ss, x+ss, y-ss, col);
		    this.grLine(chart, x, y-ss, x, y+ss, col);
		    this.grLine(chart, x-ss, y, x+ss, y, col);
		    break;
       		case this.types.symbolType.VCROSS:
		    this.grLine(chart, x, y-ss, x, y+ss, col);
		    this.grLine(chart, x-ss, y, x+ss, y, col);
		    break;
      		default : /* No Action */ break;
		}
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grCurve = function(chart, interval, col, data) {
    // ---------------------
	try {
	    if (checkChart(chart)) {
		for (var i=1, x=chart.xaxis.scalemin+interval; x<=chart.xaxis.scalemax; x+=interval, i++)  
		    this.grLine(chart,x, data[i-1], x, data[i],	col);
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grBarChart = function(chart, xmin, xmax, n, subn, data) {
    // ------------------------
	var interval = (xmax - xmin) / (n * subn + (n - 1));  // Full range with spaces
	var x = 0.0, index = 0;  // KWC - what should interval be?

	try {
	    if (checkChart(chart)) {
		for (var i=0; i<n; i++) {
		    for (var j=0; j<subn; j++) {
			this.grRectangle(chart, x, 0.0, interval, data[index], 'cyan');
			x += interval;  index++;
		    }

		    x += interval;  // A spacer
		}
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grHistogram = function(chart, xmin, xmax, n, col, data) {
    // -------------------------
	var interval = (xmax - xmin) / n;

	try {
	    if (checkChart(chart)) {
		for (var j=0,i=xmin; i<=xmax && j<n; i+=interval,j++)  {
		    this.grRectangle(chart, i, 0.0, interval, data[j], col);
		}
	    }
	}
	catch(err) {
	    return;
	}	
    };
    
    GRUnit.prototype.grDropPerpendiculars = function(chart, x, y, col) {
    // ----------------------------------
	try {
	    if (checkChart(chart)) {
		this.grSetLineStyle(lineType.GRSMALLDOTLINE);  // Fine dash
		this.grLine(chart, x, 0, x, y, col, 1);  this.grLine(chart, x, y, 0, y, col, 1);  // Thinner lines
		this.grSetLineStyle();
	    }
	}
	catch(err) {
	    return;
	}	
    };

    GRUnit.prototype.grLabel = function(n, str) {  // Label function keys
    // ---------------------
	// Javascript does not support associative arrays.  All indices are numbered
	// Using a string index creates an object
	grLabels[n] = str;  // N is really an integer, but treated as a string.
    };
    
    GRUnit.prototype.grDrawLabels = function(chart, row, tcol, bcol) {
    // --------------------------
    };
    
    GRUnit.prototype.grBlankLabels = function() {
    // ---------------------------
	grLabels = [];  // Just lose any data
    };

    //Globally expose the defaults to allow for user updating/changing
    GRUnit.prototype.defaults = {
	canvas : {
	    numxpixels: GRMAXXPIXELS, numypixels: GRMAXYPIXELS,
	    numtextrows: 24,	    numytextcols: 80,
	    numfillpixels: 2,    // default fill size for Point Plot
	    numsymbolpixels: 2,  // Offset from the centre of a symbol
	    linewidth: 2,
	    linedash: []        // Solid line
	},
	chartwindow: { // Top Left to Bottom Right 
	    xtl: 0,  ytl: 0,
	    xbr: GRMAXXPIXELS,  ybr: GRMAXYPIXELS, // Default to Canvas

	    border: true,  background: 'white',
	    borderstyle: lineType.GRDEFAULTLINE,   bordercolor: 'black',
	    charttype: GRLINE,   chartstyle: GRLINEONLY
	},
	datawindow: {
	    xtl: 10,  ytl: 10,
	    xbr: 770, ybr: 550,
	    border: true,  background: 'white',
	    borderstyle: lineType.GRDEFAULTLINE,   bordercolor: 'green'
	},
	maintitle: {
	    title: '',
	    titlecolor: 'steelblue',  justify: 'left'
	},
	subtitle: {
	    title: '',
	    titlecolor: 'steelblue',  justify: 'left'
	},
	xaxis: {
	    grid: false,  gridstyle: false,
	    title: '',  titlecolor: 'yellow', justify: 'left',
	    axiscolor: 'white',
	    labeled: true,
	    rangetype: GRLINEARAXIS,
	    logbase: 0.9,   autoscale: true,
	    scalemin: 0.0,  scalemax: FLT_MAX,
	    scalefactor: 1.0,  ticinterval: 0.0,
	    ticformat: GRDECFORMAT, ticdecimals: 1,
	    
	    scaletitle: '',
	    scaletitlecolor: 'cyan',  scaletitlejustify: 'left'
	},
	yaxis: {
	    grid: false,  gridstyle: false,
	    title: '',  titlecolor: 'yellow', justify: 'left',
	    axiscolor: 'white',
	    labeled: true,
	    rangetype: GRLINEARAXIS,
	    logbase: 0.9,  autoscale: true,
	    scalemin: 0.0,  scalemax: FLT_MAX,
	    scalefactor: 1.0,  ticinterval: 0.0,
	    ticformat: GRDECFORMAT, ticdecimals: 1,
	    
	    scaletitle: '',
	    scaletitlecolor: 'cyan',  scaletitlejustify: 'left'
	},
	legend: {
	    legend: false,  place: GRBOTTOM,
	    textcolor: 'cyan',
	    autosize: true,
	    x1: 0,  y1: 0,  x2: 0,  y2: 0,
	    border: true,   background: 'black',
	    borderstyle: lineType.GRDEFAULTLINE,  bordercolor: 'white'
	}
    };
    
    
    //Create a dictionary of chart types, to allow for extension of existing types
    GRUnit.prototype.types = {
	lineType: {
	    GRDEFAULTLINE: 0, GRDOTTEDLINE: 1, GRSMALLDOTLINE: 2
	},
	symbolType: {	
	    NOSYM: 0, DIAMOND: 1, DCROSS: 2, SQUARE: 3, STAR: 4, VCROSS: 5
	},
	labelType: {
            FX: 0, FBARX: 1, FY: 2, FMAIN: 3, FSUB: 4, FLEGEND: 5
	},
	clipType: {
	    LEFT: 0, RIGHT: 1, BOTTOM: 2, TOP: 3
	}
    };
    
    //Global GRUnit helpers object for utility methods and classes
    var helpers = GRUnit.helpers = {};
    
    //-- Basic js utility methods
    var each = helpers.each = function(loopable,callback,self){
    };
    
    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    GRUnit.instances = {};
    
    var grCanvas = function(cid){ 
	return new GRUnit(cid); 
    };
    exports(grCanvas);
}
)(typeof(exports) === 'undefined' 
  ? function(f){this['grCanvas'] = f} 
  : function(f){module.exports = f}
 );
