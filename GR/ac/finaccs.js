/*!
 * finaccs.js
 * http://www.capdm.com
 *
 * Copyright 2020 Ken Currie, CAPDM Ltd.
 * Released under the GNU license
 * https://github.com/XXX
 */

(function(exports){
    
    "use strict";

    // Host Server
    const AE_WWW_ROOT = ""; 

    // Some numeric constants
    const MAX_CF       = 10;
    const MAX_EXPENSES = 15;
    const MAX_F_ASSET  = 10;
    const MAX_INTANG   = 10;
    const MAX_REP      = 6;
    const MAX_INVEST   = 2;
    const MAX_C_ASSET  = 3;
    const MAX_C_LIAB   = 2;
    
    const AE_ST_DEPTH  = 16;
    
    const AE_SOURCES   = 0;
    const AE_USES      = 1;
    const AE_OP        = 0;
    const AE_NON_OP    = 1;

    const I_OP      = 0;  // Cash types
    const I_NON_OP  = 1;
    const I_SOURCES = 0;  // Cash flows
    const I_USES    = 1;

    // Some key indexes
    const IA_AMOUNT = 2;  // The action amount
    const IA_OE     = 3;  // OE Keyword index
    const IA_LEAF   = 4;  // The action leaf
    const IA_CASH   = 6;

    // Some string constants
    const AE_CTXT = "SOMETHING UNGUESSABLE";
    const AE_LOCALE = "en-GB";
    const AE_CURRENCY = "GBP";
    const AE_COMPLETE = "Have you completed all your transactions?";
    const AE_CURRENT_TRANSACTION = "CURRENT TRANSACTION: ";
    const AE_RESTART = "Restart at Transaction: ";
    const AE_TERRORS = "You have errors in your Transaction Actions.";
    const AE_NUM_TRANSACTIONS = "Inccrrect number of Transaction Actions.  You have created too ";
    const AE_CORRECT = "All Transaction Actions are correct. Proceeding to next Transaction";
    const AE_AUTOACCEPT = "You have errors in your transactions.\r\n\r\nYou have a CHOICE. Do you want to auto-accept the right answers? This will automatically tick over to the next Transaction, filling in the right answers for you.\r\nAlternatively you can learn more from revising your actions.";
    const AE_INVALIDSTRUCURE = "The following <structure> elements are invalid:\n";
    const AE_XMLPARSEERROR = "Question XML does not parse.  Check with Schema at https://www.freeformatter.com/xml-validator-xsd.html";
    const AE_FINISHED = "You have finished all the transactions. End of question.";
    const AE_FILEENDING = "Expected a file name ending with _ae.xml";
    const AE_NOVALUE = "You have not supplied a value!";
    const AE_NOATTEMPT = "You have not attempted any action yet.\r\n\r\nDo you want to continue?";
    const AE_THISTRANSACTION = "Transacton: ";
    const AE_RESTART_CLICK = "Double Click to restart at Transaction ";
    const AE_EMPTY = "No Transactions to report";

    const BS_INVEST  = "Investments";
    const BS_INTANG  = "Intangibles";
    const BS_C_ASSET = "Current Assets";	
    const BS_C_LIAB  = "Current Liabilties";
    const BS_NETA    = "Net Assets of the Company";
    const BS_REP_BY  = "Represented by: ";
    const BS_LESS    = "less:";

    const PL_SALES  = "SALES";
    const PL_LESS   = "less:";
    const PL_COGS   = "Cost of Goods Sold";
    const PL_GROSSP = "GROSS PROFIT";
    const PL_EXPENSE = "Expenses";
    const PL_NETPFOP = "Net Profit from Operation";
    const PL_NETP    = "Net Profit";

    const CF_CLOSE   = "Closing Balance";
    const CF_USE     = "Use of Cash";
    const CF_SOURCES = "Sources of Cash";

    var fa_question = '', fa_xml = null, fa_parsed_OK = true, fa_qs = null;  // Global scope
    var fa_num_transactions = 0, fa_current_transaction = 0, fa_num_actions = 0, fa_current_action = 0;
    var fa_leaves = [];
    var fa_check_ans = [], fa_check_message = '';

    function fa_keyword(l, id, n, s) {
	this.leaf = l;  // Leaf no.
	this.id = id;
	this.name = n;
	this.structure = s;
    }

    function fa_action(t, o, a, p, s) {
	this.type = t;
	this.order = o;
	this.amount = 0;
	this.preamble = p;
	this.structure = {"type" : t}.concat(s);  // Add the type (asset, etc.) to the front of the struture
    }

    function fa_transaction(o, s, a, f) {
	this.order = o;
	this.statement = s;
	this.actions = a;
	this.footnote = f;
	this.answer = [];  // Build up the user answers here.
    }

    function fa_transactions(p, t) {
	this.preamble = p;
	this.transaction = t;
    }

    // Question structure
    var fa_q = {
	title: '',
	keywords: {},
	transactions: null
    }

    // Statement structures
/*
enum eResources { _BOGUS, _QUESTION, _KW1, _POLICY, _CASH, _OEQUITY  };

enum eKW1 {_FA, _ST, _OE, _DE, _IA, _CA, _SI, _AC, _CR, _LTL};
	Fixed Assets, STocks/inventories, Owners Equity, DEbtors,
  	Intangible Assets, CAsh, Subsidiary Inv., Assoc. Company,
  	CReditors, Long Term Loan


enum eOE {_SA, _CO, _EX, _TP, _DP, _CI, _RR, DR};
	SAles, COgs, EXpenses, Taxes Paid, Dividend Payment,
	Capital Introduced, Revaluation Reserve, DRawings
*/
    var bs = {
	balance: parseFloat(0.0),
	lines: parseInt(0),
	f_asset_desc: '',
	intangible_desc: '',
	// Descriptor arrays
	f_asset:     [],
        investment:  [],
   	intangible:  [],
        c_asset:     [],
        c_liability: [],
	rep_by:      []
    }

    var pl = {
	desc: '',  // "Owner's Equity"
	sales: [],
        after_profit: [],
	ex_item: [],
	expenses: {
	    desc: '',
	    expense_item: [],
	    value: parseFloat(0.0)
	},
	profit: parseFloat(0.0),
	lines: parseInt(0)
    }
    
    var cf = {
	desc: '',	// "Cash"
	items: [],	// op/non-op and source/use
	cfclass: [],
	ccf: [[], []],
	balance: parseFloat(0.0),  // Closing balance
	lines: parseInt(0)
    }



    // Now the support Functions

    function questionParses(q) 
    // -----------------------
    {
	var xmlDoc = false;
	try {
	    xmlDoc = $.parseXML(q);
// console.log("Q Parse");	    console.log(xmlDoc);
	}
	catch(err) {
	    console.log(err.message);
	    return xmlDoc;
	}

	return xmlDoc;  // Document is OK
    }

    function structureParses(xml)
    // --------------------------
    {
// console.log("Structure");
	var err = '';

	$(xml).find('structure').each(function() {           
// console.log("READ: " + $(this).text());
	    if ($(this).text() != '' ) {
		try {
		    var a = JSON.parse($(this).text());
		}
		catch(e) {
		    err += $(this).text(); // Log the offendign line
		    return;  // Within each() fn, this is continue
		}
	    }
// console.log(a);
	});

	if (err != '') {
	    alert(AE_INVALIDSTRUCURE + err);
	    return false;
	}
	
	return true;
    }

    function buildStructure(cats) {
    // ----------------------------
	var n = null, nn = null, ret = [];  // Returning an array of keywords

	cats.each(function() {
	    ret.push(new fa_keyword(null, $(this).attr('id'),
				 $(this).find('name:first').text(),
				 buildStructure($(this).find('category3')))); 
	});

	return ret;
    }

    function keywordLookup(kw) 
    // -----------------------
    {
	var kws = fa_q.keywords, kws2, kws3;  // Depth first search

	// Return the string for this keyword code.  Note top level starts at index 0
	for (var i=1; i<kws.length; i++) {
	    if (kws[i].id == kw) {
		return kws[i].name;  // Found it at the top level
	    }

	    kws2 = kws[i].structure;
	    for (var j=0; j<kws2.length; j++) {
		if (kws2[j].id == kw) {
		    return kws2[j].name;  // Found it at level 2
		}	    

		kws3 = kws2[j].structure;
		for (var k=0; k<kws3.length; k++) {
		    if (kws3[k].id == kw) {
			return kws3[k].name;  // Found it at level 3
		    }	    
		}
	    }
	}
	   
	return '???';  // Didn't find it for some reason
    }

    function buildKeywords(xml) 
    // ------------------------
    {
	$(xml).find('category').each(function() {
//console.log("BuildStructure: ");	console.log($(this));
	    fa_q.keywords.push(new fa_keyword(null, $(this).attr('id'), // Don't know the leaf no. at this stage
					      $(this).find('name:first').text(),
					      buildStructure($(this).find('category2'))));  // Go down at least one level
	});
//console.log("Keywords top level:"); console.log(fa_q.keywords);

	// Now build the keywords tree from this
	var tree = '', leafcount = 0;  // Use fa_leaves to bind event handlers

	for (var i=1; i<fa_q.keywords.length; i++) {
//console.log("Keywords level: " + i + ", Name = "); console.log(fa_q.keywords[i].name);
	    if (fa_q.keywords[i].structure[0]) {  // Is there a structure below this?
		tree += "<li><span class='fa-key-caret' data-id='" + fa_q.keywords[i].id  + "'><b>" + fa_q.keywords[i].name + "</b></span>";  
		tree += "<ul class='fa-key-nested'>";

		var ei = fa_q.keywords[i].structure;
		for (var j=0; j<ei.length; j++) {
//console.log("EI[j]: " + i + ", Name = "); console.log(ei[j]);
		    if (ei[j].structure[0]) {
			tree += "<li><span class='fa-key-caret' data-id='" + ei[j].id  + "'><b>" + ei[j].name + "</b></span>";  // A next level to come
			tree += "<ul class='fa-key-nested'>";
			
			var ej = ei[j].structure;  // Is there a third level?
//console.log("EJ: " + i + ", Name = "); console.log(ej);
			if (ej[0]) {  // Is there a third level?
			    for (var k=0; k<ej.length; k++) {
				fa_q.keywords[i].leaf = leafcount;  // We can now number this leaf
				fa_leaves.push([fa_q.keywords[i], ei[j], ej[k]]);
				tree += "<li><span>&#x2500; </span><span id='fa-leaf-" + leafcount++ + "'  data-id=" + ej[k].id  + " draggable='true' class='fa-key-leaf'>" + 
				    ej[k].name + "</span></li>";  // Final level
			    }
			}
			else {
			    fa_q.keywords[i].leaf = leafcount;  // We can now number this leaf
			    fa_leaves.push([fa_q.keywords[i].structure[0], ei[j]]);  // Bottoms out after two levels
			}
			tree += "</ul>";
			tree += "</li>";
		    }
		    else {
			fa_q.keywords[i].leaf = leafcount;  // Number the leaf
			fa_leaves.push([fa_q.keywords[i], ei[j]]);
			tree += "<li><span>&#x2500; </span><span id='fa-leaf-" + leafcount++ 
			    + "' draggable='true' class='fa-key-leaf' data-id='" + ei[j].id   + "'>" 
			    + ei[j].name + "</span></li>";  // Just add this leaf
		    }
		}
		tree += "</ul>";
	    }
	    else {
		fa_q.keywords[i].leaf = leafcount;  // Number the leaf
		fa_leaves.push([fa_q.keywords[i]]);
		tree += "<li><span>&#x2500; </span><span id='fa-leaf-" + leafcount++ + "' data-id='" + fa_q.keywords[i].id  + "' draggable='true' class='fa-key-leaf'>" + 
		    fa_q.keywords[i].name + "</span></li>";  // Structure[0] is leaf
	    }
	    
	    tree += "</li>";  // Close off this list item
	}
    
//console.log("Tree:"); console.log(tree);
//console.log("Leaves:"); console.log(fa_leaves);

	// Now add it as the keywords tree.
	$('#fa-keywords-tree').append(tree);
	for (var l=0; l<fa_leaves.length; l++) {
	    $('#fa-leaf-' + l).on('dragstart', function(e) {
//		e.preventDefault();
//console.log("Dragged leaf");  console.log(e.currentTarget.id);
		e.originalEvent.dataTransfer.setData("text/plain", e.currentTarget.id);  // Need to set the data (Keyword) being dragged
	    });
	}

	// Now set up listener
	var toggler = document.getElementsByClassName("fa-key-caret");

	for (var i = 0; i < toggler.length; i++) {
	    toggler[i].addEventListener("click", function() {
		this.parentElement.querySelector(".fa-key-nested").classList.toggle("fa-key-active");
		this.classList.toggle("fa-key-caret-down");
	    });
	}
    }

    function buildAction(cat, xml) 
    // ---------------------------
    {
	var act = [cat];

//console.log("Action input: " + cat); console.log(xml);
	// The children are the categories 2 & 3
	$(xml).children().each(function() {
	    if ($(xml).find('category2')) {
		act.push($(xml).find('category2').attr('catid'));
	    }

	    $(this).children().each(function() {
		if ($(xml).find('category3')) {
		    act.push($(xml).find('category3').attr('catid'));
		}
	    });
	});

//console.log("Action result: "); console.log(act);
	return act;
    }

    function buildActions(xml) 
    // -----------------------
    {
	var acts = [];

	// The children are the equity/asset/liability nodes
	$(xml).children().each(function() {
	    acts.push([$(this).get(0).tagName,  // Get the type
		      $(this).attr('order'), $(this).attr('amount'), 
		      $(this).find('preamble').text(), 
		      buildAction($(this).attr('linkend'), $(this).find('action'))]);
	});

	return acts;
    }

    function buildTransaction(xml) 
    // ---------------------------
    {
	var ts = [];  // Build up list of transactions

	$(xml).find('transaction').each(function() {
//console.log("TRANSACTION NUMBER = " + fa_num_transactions);
//console.log("  Order = " + $(this).attr('order'));
//console.log("  actions = "); console.log($(this).find('actions'));
//console.log("  Statement = " + $(this).find('statement').text().trim());
//console.log("  Footnote = " + $(this).find('footnote').text().trim());
	    ts.push(new fa_transaction($(this).attr('order'), 
				       $(this).find('statement').text().trim(), 
				       buildActions($(this).find('actions')),
				       $(this).find('footnote').text().trim()));
	    fa_num_transactions++;  // Keep a tally
	});

//console.log("Found " + fa_num_transactions + " transactions");
//console.log(ts);
	return ts;
    }

    function buildTransactions(xml) 
    // ----------------------------
    {
	fa_num_transactions = 0;  // Keep a count
	fa_q.transactions = new fa_transactions($(xml).find('transactions preamble:first').text(), buildTransaction(xml));
console.log("Transactions built: ");  console.log(fa_q.transactions);
    }

    function createQuestionStructure(xml)
    // ---------------------------------
    {
	// Rip through the structure.  There is a title, some keywords and the transactions - one of each.
	fa_q.title = $(xml).find('title').text();
	fa_q.keywords = $(xml).find('keywords');  // Returns a jquery object
//console.log("Build keywords");
	buildKeywords(fa_q.keywords);
console.log("Build keywords - DONE");
console.log(fa_q.keywords);
	// Now build up the list of transactions
	fa_q.transactions = $(xml).find('transactions');
	buildTransactions(fa_q.transactions);

	fa_current_transaction = 0;  // Reset to start
	$('#fa-current-transaction').html('<p class="fa-this-transaction">' + AE_THISTRANSACTION 
					  + (fa_current_transaction+1) + ' (of ' + fa_q.transactions.transaction.length + ')'
					  + '</p><p>' + fa_q.transactions.transaction[fa_current_transaction].statement + '</p>');

//console.log(fa_q.transactions);
	// Show the question in the Question tab
	var q = '<table class="fa-height">';
	q += '<tr class="fa-q-statement"><td><p class="fa-q-preamble">' + fa_q.transactions.preamble + '</p></td></tr>';  // Preamble first
	q += '<tr><td style="overflow-y: auto"><div class="fa-yscroll">';
	for (var i=0 ; i<fa_q.transactions.transaction.length; i++) {
	    q += '<p><button type="button" id="fa-btn-restart-' + i + '" class="fa-restart" data-start="' + i + '" title="' + AE_RESTART_CLICK + (i+1)
		+ '"><i class="fas fa-play"></i></button> ' + (i+1) + ': ' + fa_q.transactions.transaction[i].statement + '</p>';
	}
	q += '</div></td></tr></table>';

	$('#fa_question').html(q);  // Overwrite the first tab

	// Prepare for the statements
	initialiseStatements();

	// Now set up listeners for the restart buttons
	var restarts = document.getElementsByClassName("fa-restart");

	for (var i = 0; i < restarts.length; i++) {
	    restarts[i].addEventListener("dblclick", function() {
//console.log("DBLCLICK: current transaction = " + fa_current_transaction);

		if (confirm(AE_RESTART + (parseInt($(this).attr('data-start'))+1) + "?")) {
		    $('#fa_balance_sheet').html(AE_EMPTY);  // Empty the Sheets
		    $('#fa_profit_loss').html(AE_EMPTY);
		    $('#fa_cash_flow').html(AE_EMPTY);

		    // Initialise the statements for a new start
		    initialiseStatements();

		    fa_current_transaction = $(this).attr('data-start') - 1;  // 
//console.log("          current transaction now = " + fa_current_transaction);
		    setupNextTransaction();  // Also updates statements
		    
		    // Now put the focus on the Transaction tab
		    $("#finaccs-tabs").tabs({active: 1});
		}
	    });
	}
    }
    
    function getQuestions() {
    // --------------------
	var qs = null, _uri = AE_WWW_ROOT + "/GR/ac/get_questions.php";
	
        jQuery.ajax(
	    {
                url: _uri,
                type: "GET",  // Should be POST?
		dataType: "json",
                // headers: {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},
		
	    }).done(function(q) {
//console.log("Done");  console.log(q);		

		fa_qs = q;  // Update the questions list, and the screen
		var n = "";
		fa_qs.forEach(function(q, i) {
		    n = q.replace("_ae.xml", "");
		    // Attaching click event on new list item
		    $('#fa-q-list').append("<button id='fa-q-button-" + i + "' class='fa-btn' type='button' data-name='" + n + "'>" + 
					   n.charAt(0).toUpperCase() + n.slice(1) +					   
					   "</button>")
			.on('click', '#fa-q-button-' + i, function(){
			    n = $(this).attr('data-name');  // Plug the question name
console.log("Click: " + n);
			    // Go fetch that question
			    jQuery.ajax(
				{
				    url: AE_WWW_ROOT + "/GR/ac/finaccs_ae/" + n + "_ae.xml",
				    type: "GET",  // Should be POST?
				    dataType: "text",  // Although it is actually XML returned.
				    // headers: {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},
				    
				}).done(function(q) {
console.log("Selected question");  console.log(q);

				    // See if it parses.  It should as it's shold have been checked
				    var xmlDoc;
				    if ((xmlDoc = questionParses(q)) != false) {
//console.log("ParsesOK");
					// Have a quick check of the array <structure> elements
					if (structureParses(xmlDoc) == false) {
//console.log("Internal <structure> elements invalid>");
					    fa_parsed_OK = false;  // Problems
					}
				    }
				    else {
					alert(AE_XMLPARSEERROR);
					fa_parsed_OK = false;  // Problems
				    }

				    if (fa_parsed_OK) {
//console.log("Parse and structure Check OK");
//console.log(reader.result);
					createQuestionStructure(xmlDoc);
				    }
				}).fail(function(ex) {
				    console.log("Fail B");  console.log(ex);
				});
			});
		})
	    }).fail(function(ex) {
		console.log("Fail A");  console.log(ex);
	    });
    }

    function postTransactionExplanation(transaction) 
    // ---------------------------------------------
    {
	// Show the explation of the transactions. Build from the bottom.
	var tr = fa_q.transactions.transaction;
	var te= '';

	te += '<div class="fa-yscroll"  style="overflow-y: auto">';
	te += '<table class="fa-height">'; 

	for (var i=transaction; i>=0; i--) {
	    te += '<tr class="fa-explanation-preamble"><td><p class="fa-q-preamble"><span style="text-decoration: underline;">Transaction ' 
		+ (i+1) + '</span>: ' + tr[i].statement + '</p></td></tr>';  // Preamble first
	    te += '<tr><td><table width="100%">';
	    for (var j=0; j<tr[i].actions.length; j++) {
		te += '<tr class="fa-action-explained"><td class="fa-action" width="20%">Action</td><td class="fa-action" width="80%">';
		te += '<p class="fa-q-preamble">' + tr[i].actions[j][3].trim() + '</p>';
		te += '<p class="fa-q-detail">' + tr[i].actions[j][0].trim().toUpperCase() + 
		    ': Amount = ' + parseInt(tr[i].actions[j][IA_AMOUNT]).toLocaleString(AE_LOCALE, {style: 'currency', currency: AE_CURRENCY})  + '</p>';
		te += '<p class="fa-q-detail">';
		for (var k=0; k<tr[i].actions[j][IA_LEAF].length ; k++) {
		    if (k != 0) te += ' | ';
		    te += keywordLookup(tr[i].actions[j][IA_LEAF][k]);
		}
		te += '</p></td></tr>';
	    }

	    if (tr[i].footnote) {
		te += '<tr><td>Footnote</td><td><p class="fa_q_footnote">' + tr[i].footnote + '</p></td></tr>';  // Any footnote
	    }
	    te += '</td></tr></table>';
	}
	te += '</table></div>';

//console.log("TE is: "); console.log(te);
	$('#fa-transaction-explained').html(te);  // Latest on top
    }

    function checkTransaction() 
    // ------------------------
    {
	// Lots of work to do here
//	if (confirm(AE_COMPLETE)) {
	    var actnum = 0, ansnum = 0, acts, ans;

	    // We might return a message.  Label the Transaction
	    fa_check_message = AE_CURRENT_TRANSACTION + 
		(fa_current_transaction + 1) + '\r\n\r\n';  

	    ans = fa_q.transactions.transaction[fa_current_transaction].answer;
	    ansnum = ans.length;
	    acts = fa_q.transactions.transaction[fa_current_transaction].actions;
	    actnum = acts.length;

//console.log("Checking Transactions:");
//console.log(fa_q.transactions.transaction[fa_current_transaction]);
	    if (ansnum != actnum) {
		fa_check_message += AE_NUM_TRANSACTIONS + ((ansnum > actnum) ? "many!" : "few!");
		return false;
	    }

	    // Check that there is an action for every answer
	    var eql = true;
	    for (var j=0; j<acts.length; j++) {  // Loop over all actions ...
		for (var i=0; i<ans.length; i++) {  // ... and make sure there is an answer for every action.
		    eql = acts[j][IA_LEAF].every(function (element) {
			return ans[i][3].includes(element);
		    })
		    
		    if (eql) break; // Go to the next answer
		}

		if (!eql) {  // Couldn't find a match 
		    return false;  // A problem somewhere
		}
	    }

	    return true;
//	}

//	return false;
    }

    function setupNextTransaction() 
    // ----------------------------
    {
	postTransactionExplanation(fa_current_transaction);  // Update the history
	fa_current_transaction++;

	if (fa_current_transaction != 0)  { //No action at the start (zero based array)
	    updateProfitLoss();  writeProfitLoss();  // Other statements to follow.  BS needs P&L	
	    updateBalanceSheet();  	writeBalanceSheet();
	    updateCashFlow();  	writeCashFlow();
	}

	// Have we finished?
//console.log("Current transaction is: " + fa_current_transaction + ", total no is: " + fa_q.transactions.transaction.length);
	if (fa_current_transaction > fa_q.transactions.transaction.length-1) {  // -1 as the count is 0 based
	    alert(AE_FINISHED);

	    // Now put the focus on the Explanations tab
	    $("#finaccs-tabs").tabs({active: 2});
}
	else {
	    $('#fa-current-transaction').html('<p class="fa-this-transaction">' + AE_THISTRANSACTION 
					      + (fa_current_transaction+1) + ' ( of ' + fa_q.transactions.transaction.length + ')'
					      + '</p><p>' + fa_q.transactions.transaction[fa_current_transaction].statement + '</p>');
	    
	    // Remove all the existing action entries
	    $('[id^=fa-equity-item]').remove();	 $('[id^=fa-asset-item]').remove();
	    fa_num_actions = 0;  // An set count to 0
	}
    }

    function initialiseStatements()
    // ****************************
    {
	initialiseProfitLoss();	 initialiseBalanceSheet();  initialiseCashFlow();
    }

    function initialiseProfitLoss()
    // ****************************
    {
	var items;
	
	// now the P&L
	pl.profit = parseFloat(0.0);  pl.lines = parseInt(0);
	pl.desc = '';  // "Owner's Equity"
	pl.sales = [];  pl.after_profit = [];  pl.ex_item = [];
	pl.expenses.expense_item = [];
	pl.ex_item.push({desc: '', value: parseFloat(0.0)});
	pl.after_profit.push({desc: '', value: parseFloat(0.0)});

	for (var i=0; i<2; i++) {
	    pl.sales.push({desc: '', value: parseFloat(0.0)});
	    pl.after_profit.push({desc: '', value: parseFloat(0.0)});
	}
	for (var i=0; i<MAX_EXPENSES; i++) {
		pl.expenses.expense_item.push({desc: '', value: parseFloat(0.0)});	
	}

	// The first 6 OE items are P&L items
	items = fa_q.keywords[IA_OE].structure;  // Owner's Equity
	for (var i=0; i<6; i++) {  // Six main items in P&L (1 based, note)
	    switch (i) {		
	    case 0: case 1:  //Sales/COGS
		pl.sales[i].desc = items[i].name;
		pl.sales[i].value = parseFloat(0.0);
		break;
	    case 2: // Expenses - ignore, fill in later 
		pl.expenses.desc = items[i].name;
		break;
	    case 3: case 4:  // Taxes Paid/Dividend Payment
		pl.after_profit[i-3].desc = items[i].name;
		pl.after_profit[i-3].value = parseFloat(0.0);
		break;
	    case 5:  // Extraordinary Investments
		pl.ex_item[0].desc = items[i].name;
		pl.ex_item[0].value = parseFloat(0.0);
		break;
	    }
	}

	// Now the classes of Owners Equity
 	var oe = fa_q.keywords[3].structure[2];  // OE is keyword 3, Expenses 2
	if (oe.id != 'AE-OE-EX') {
	    console.log("Error: not Owner's Equity & Expenses");
	}
	for (var i=0; i<oe.structure.length; i++) {
	    pl.expenses.expense_item[i].desc = oe.structure[i].name;
	    pl.expenses.expense_item[i].value= parseFloat(0.0);
	}
//console.log("PL initialised:");  console.log(pl);
    }
    
    function updateExpenses(s, amount)
    // *******************************
    {
	for (var i=0; i<MAX_EXPENSES; i++) {
	    if (keywordLookup(s) == pl.expenses.expense_item[i].desc) {
		pl.expenses.expense_item[i].value += amount;  
		break;
	    }			
	}	

	return;
    }

    function updateProfitLoss()
    // ************************
    {
	var amount = parseFloat(0.0), acts;
	var s = '', ss = '';

	// This recalculates from the start to the last transaction
	initialiseProfitLoss();  // Safe to do this

	for (var i=0; i<fa_current_transaction; i++) {
//console.log("PL TRANSACTION: " + (i+1));
	    // Work through the transaction solutions totting up the amounts
	    acts = fa_q.transactions.transaction[i].actions;
	    for (var j=0; j<acts.length; j++) {
		// Get its keyword value
		s = keywordLookup(acts[j][IA_LEAF][0]);  // Top level
		amount = parseFloat(acts[j][IA_AMOUNT]);
//console.log("PL: action: " + s + ", amount = " + amount + ", Action: ");
//console.log(acts[j]);

		// get the first line - is it Owners Equity?
		if (acts[j][IA_LEAF][0] == 'AE-OE') {
		    ss = keywordLookup(acts[j][IA_LEAF][1]);  // Level 2
//console.log("--- PL: action: " + ss + ", amount = " + amount);
		    
		    if (ss == pl.sales[0].desc) {  // Sales 
			pl.sales[0].value += amount;
		    }
		    else if (ss == pl.sales[1].desc) {  // COGS 
			pl.sales[1].value += amount;
		    }
		    else if (ss == pl.expenses.desc) {  // Expenses
			updateExpenses(acts[j][IA_LEAF][2], amount);  // Level 3
		    }
		    else if (ss == pl.after_profit[0].desc) {  // Taxes
			pl.after_profit[0].value += amount;
		    }
		    else if (ss == pl.after_profit[1].desc) {  // Dividend
			pl.after_profit[1].value += amount;
		    }
		    else if (ss == pl.ex_item[0].desc) {  // ExtraO Profit
			pl.ex_item[0].value += amount;
		    }
		    else {  // Not a P&L entry
		    }
		}
	    }
	}

     	// Now calculate totals 
	pl.expenses.value = parseFloat(0.0);
     	for (var i=0; i<MAX_EXPENSES; i++) {
     	    pl.expenses.value += parseFloat(pl.expenses.expense_item[i].value);
	}

     	pl.profit = parseFloat(pl.sales[0].value) + 
	    parseFloat(pl.sales[1].value) -
     	    Math.abs(pl.expenses.value) +
     	    parseFloat(pl.after_profit[0].value) + 
	    parseFloat(pl.after_profit[1].value) +
	    parseFloat(pl.ex_item[0].value);
//console.log("PL UPdated");  
//console.log(pl);  
	return;
    }
    
    function writeProfitLoss()
    // ***********************
    {
	var last_used_expense = parseInt(0);
	var p = {html: '', nta: parseFloat(0.0), rep: parseFloat(0.0)};  // Reference object

	p.html  = "<table width='100%' class='fa-st-height fa-statement-pl'>";
	p.html += "<thead>";
	p.html += "<th style='width: 5%; text-align: left;'></th>";
	p.html += "<th style='width: 45%; text-align: left;'></th>";
	p.html += "<th style='width: 20%; text-align: right;'></th>";
	p.html += "<th style='width: 20%; text-align: right;'></th>";
	p.html += "</thead>";

	p.html += "<tbody style='overflow-y: auto;'>";

	p.html += "<tr><td colspan='2'>" + PL_SALES + "</td><td></td><td style='text-align: right;'>" + parseFloat(pl.sales[0].value).toLocaleString() + "</td></tr>";
	p.html += "<tr><td></td><td colspan='3'>" + PL_LESS + "</td></tr>";

	p.html += "<tr><td colspan='2'>" + PL_COGS + "</td><td class='fa-single-under' style='text-align: right;'>" + Math.abs(pl.sales[1].value).toLocaleString() + "</td><td class='fa-single-under' style='text-align: right;'>" + Math.abs(pl.sales[1].value).toLocaleString() + "</td></tr>";
	p.html += "<tr><td></td><td></td><td class='fa-single-over'></td><td class='fa-single-over'></td></tr>";
	p.html += "<tr><td colspan='4'>&nbsp;</td></tr>";


	p.html += "<tr><td colspan='2'>" + PL_GROSSP + "</td><td></td><td style='text-align: right;'>" + (parseFloat(pl.sales[0].value) - Math.abs(pl.sales[1].value)).toLocaleString() + "</td></tr>";
	p.html += "<tr><td></td><td colspan='3'>" + PL_LESS + "</td></tr>";
	p.html += "<tr><td></td><td colspan='3'>" + PL_EXPENSE + "</td></tr>";
	// Find out how many expenses are actually used

	for (var i=0; i<MAX_EXPENSES; i++) {
	    if (Math.abs(pl.expenses.expense_item[i].value) > 0.0)
		last_used_expense = i;
	}
	
	// It now gets a bit hairy
	for (var i=0; i<MAX_EXPENSES; i++) {
	    if (Math.abs(pl.expenses.expense_item[i].value) > 0.0) {
		p.html += "<tr><td></td><td>" + pl.expenses.expense_item[i].desc +"</td><td>" + Math.abs(pl.sales[1].value).toLocaleString() + "</td><td>" + Math.abs(pl.expenses.expense_item[i].value).toLocaleString() + "</td></tr>";
		// ABS as it is held as a negative, but printed positive
		
	    	if (i == last_used_expense) {
		    p.html += "<tr><td></td><td></td><td></td><td class='fa-single-under'>" + Math.abs(pl.expenses.value) + "</td></tr>";
		}
	    }
	}
	p.html += "<tr><td></td><td></td><td class='fa-single-over'></td><td class='fa-single-over'></td></tr>";
	p.html += "<tr><td colspan='4'>&nbsp;</td></tr>";

	p.html += "<tr><td colspan='2'>" + PL_NETPFOP + "</td><td></td><td style='text-align: right;'>" + (parseFloat(pl.sales[0].value) - Math.abs(pl.sales[1].value) - Math.abs(pl.expenses.value)).toLocaleString() + "</td></tr>";
	
	if (parseFloat(pl.ex_item[0].value) != parseFloat(0.0)) {	
	    p.html += "<tr><td></td><td>" + pl.ex_item[0].desc + "</td><td></td><td>" + parseFloat(pl.ex_item[0].value).toLocaleString() + "</td></tr>";
	    p.html += "<tr><td colspan='4'>&nbsp;</td></tr>";
	}
	
	p.html += "<tr><td></td><td colspan='3'>" + PL_LESS + "</td></tr>";
	p.html += "<tr><td></td><td>" + pl.after_profit[0].desc + "</td><td>" + Math.abs(pl.after_profit[0].value).toLocaleString() + "</td><td></td></tr>";
	p.html += "<tr><td></td><td>" + pl.after_profit[1].desc + "</td><td class='fa-single-under'>" + Math.abs(pl.after_profit[1].value) + "</td><td class='fa-single-under'>" + Math.abs(pl.after_profit[0].value + pl.after_profit[1].value) + "</td></tr>";
	
	p.html += "<tr><td></td><td>" + PL_NETP + "</td><td></td><td class='fa-dbl-under'>" + parseFloat(pl.profit).toLocaleString() + "</td></tr>";

	$('#fa_profit_loss').html(p.html);  // Write it
    }

    function initialiseBalanceSheet()
    // ******************************
    {
	var i, j, items, p;
	
//console.log("BS:"); console.log(bs);
	bs.balance = parseFloat(0.0);    bs.lines = parseInt(0);
	bs.f_asset_desc =  '';  bs.intangible_desc = '';

	bs.f_asset = [];  bs.investment = [];  bs.intangible = [];
        bs.c_asset = [];  bs.c_liability = []; bs.rep_by = [];

	for (i=0; i<MAX_F_ASSET; i++) {
	    bs.f_asset.push({desc: '', value: parseFloat(0.0)});
	}
	for (i=0; i<MAX_INVEST; i++) {
	    bs.investment.push({desc: '', value: parseFloat(0.0)});
	}
	for (i=0; i<MAX_C_LIAB; i++) {
	    bs.c_liability.push({desc: '', value: parseFloat(0.0)});
	}
	for (i=0; i<MAX_INTANG; i++) {
	    bs.intangible.push({desc: '', value: parseFloat(0.0)});
	}
	for (i=0; i<MAX_C_ASSET; i++) {
	    bs.c_asset.push({desc: '', value: parseFloat(0.0)});
	}
	for (i=0; i<MAX_REP; i++) {
	    bs.rep_by.push({desc: '', value: parseFloat(0.0)});
	}
	
//console.log("BS initialised:");  console.log(bs);

	// Populate the top level items
	for (i=1; i<fa_q.keywords.length; i++) {  // 1 based
	    switch (i) {
	    case 1: bs.f_asset_desc = fa_q.keywords[i].name;  // Fixed Assets 
		break;
	    case 2: bs.c_asset[0].desc = fa_q.keywords[i].name;  // Stocks Invent.
		break;
	    case 3: bs.rep_by[4].desc = fa_q.keywords[i].name;  // Owners Equity
		break;
	    case 4: bs.c_asset[1].desc = fa_q.keywords[i].name;  // Debtors
		break;
	    case 5: bs.intangible_desc = fa_q.keywords[i].name;  // Intangibles
		break;
	    case 6: bs.c_asset[2].desc = fa_q.keywords[i].name;  // Cash
		break;
	    case 7: bs.investment[0].desc = fa_q.keywords[i].name;  // Subsid. Inv.
 		break;
	    case 8: bs.investment[1].desc = fa_q.keywords[i].name;  // Assoc. Comp.
 		break;
	    case 9: bs.c_liability[0].desc = fa_q.keywords[i].name;  // Creditors
		break;
	    case 10: bs.rep_by[5].desc = fa_q.keywords[i].name;  // Long Term Loan
		break;
	    default: console.log("BS: Unexpected Keyword.");
		break;
	    }
	}

	// Now the classes of Owners Equity
 	var oe = fa_q.keywords[3];  // OE is keyword 3
	if (oe.id != 'AE-OE') {
	    console.log("Error: not Owner's Equity");
	}
	for (i=0; i<oe.structure.length; i++) {  // 0 based
	    switch (i) {
	    case 0: case 1: case 2: case 3: case 4: case 5: break;
	    case 6: bs.rep_by[0].desc = oe.structure[i].name;  // Capital Introduced
	    break;
	    case 7: bs.rep_by[2].desc = oe.structure[i].name;  // Revaluation Reserve
		break;
	    case 8: bs.rep_by[3].desc = oe.structure[i].name;  // Drawings
		break;
	    }
	}
  	bs.rep_by[1].desc = 'Profit';  // Don't forget profit
 

	// Now the classes of fixed asset
 	var fixa = fa_q.keywords[1];  // FIXA is keyword 1
	if (fixa.id != 'AE-FA') {
	    console.log("Error: not Fixed Assets");
	}
//console.log(fa_q.keywords[1].name + ", length is " + fixa.structure.length)
	for (i=0; i<fixa.structure.length; i++) {
	    bs.f_asset[i].desc = fixa.structure[i].name;  
	}
 
	// Now the classes of intangible asset
 	var inta = fa_q.keywords[5];  // INTA is keyword 1
	if (inta.id != 'AE-IA') {
	    console.log("Error: not Intangible Assets - " + inta.id);
	}

	for (i=0; i<inta.structure.length; i++) {
	    bs.intangible[i].desc = inta.structure[i].name;  
	}
    }

    function updateFixedAssets(f, amount)
    // **********************************
    {
	var s = keywordLookup(f);  // Which FA is it?

	for (var i=0; i<MAX_F_ASSET; i++) {
	    if (s == bs.f_asset[i].desc) {
		bs.f_asset[i].value += parseFloat(amount);  break;
	    }			
	}	
    }

    function updateIntangibles(inta, amount)
    // *************************************
    {
	var s = keywordLookup(inta);  // Which INTA is it?
	
	for (var i=0; i<MAX_INTANG; i++) {
	    if (s == bs.intangible[i].desc) {
		bs.intangible[i].value += amount;  break;;
	    }			
	}
    }

    function updateBalanceSheet()
    // **************************
    {
	var amount = parseFloat(0.0), acts;
	var s = '', ss = '';

	// This recalculates from the start to the last transaction
	initialiseBalanceSheet();  // Safe to do this

//console.log("BS: Transactions built: ");  console.log(fa_q.transactions);
	for (var i=0; i<fa_current_transaction; i++) {
	    // Work through the transaction solutions totting up the amounts
	    acts = fa_q.transactions.transaction[i].actions;
//console.log("--- TRANSACTION: " + (i+1) + ", Actions:"); 
//console.log(acts);
	    for (var j=0; j<acts.length; j++) {
		// Get its keyword value
		amount = parseFloat(acts[j][IA_AMOUNT]);
		s = keywordLookup(acts[j][IA_LEAF][0]);
//console.log("BS: action: " + s + ", amount = " + amount + ", j = " + j + ", Action:");
//console.log(acts[j]);

		if (s == bs.rep_by[IA_LEAF].desc) {   // Owners Equity
		    ss = keywordLookup(acts[j][IA_LEAF][1]);  // OE next level

		    if (ss == bs.rep_by[0].desc) 
			bs.rep_by[0].value += amount;  // the value
		    else if (s == bs.rep_by[2].desc) 
			bs.rep_by[2].value += amount;
		    else if (ss == bs.rep_by[3].desc) 
			bs.rep_by[3].value += amount;
		}
		else if (s == bs.f_asset_desc) {
		    updateFixedAssets(acts[j][IA_LEAF][1], amount);  // 4 = actions
		}
		else if (s ==  bs.intangible_desc) {
		    updateIntangibles(acts[j][IA_LEAF][1], amount);  // 4 = actions
		}
		else if (s == bs.c_asset[0].desc) {  // Stocks
		    bs.c_asset[0].value += amount;
		}
		else if (s == bs.c_asset[1].desc) { // Debtors
		    bs.c_asset[1].value += amount;
		}
		else if (s ==  bs.c_asset[2].desc) { // Cash 
		    bs.c_asset[2].value += amount;
		}
		else if (s == bs.investment[0].desc) { // Subs. Inv
		    bs.investment[0].value += amount;
		}
		else if (s == bs.investment[1].desc) { // Assoc. Co.
		    bs.investment[1].value += amount;
		}
		else if (s == bs.c_liability[0].desc) { // Creditors
		    bs.c_liability[0].value += amount;
		}
		else if (s == bs.rep_by[5].desc) {  // LTL
		    bs.rep_by[5].value += amount;
		}
		else {
		    console.log("BS Update: item not reconised - ");
		}
	    }
	}

	// Don't forget the profit
	bs.rep_by[1].value = parseFloat(pl.profit);
//console.log("BS: Updated"); console.log(bs);
    }

    function BSSection(b, header, p, count)
    // ************************************
    {
	var runtot = parseFloat(0.0);

	// Are there any elements to include?
	var include = false;
	for (var i=0; i<count; i++) {
	    if (parseFloat(p[i].value) != parseFloat(0.0)) {
		include = true;  break;
	    }
	} 
   	if (include) {
	    b.html += "<tr><td colspan='4'>" + header + "</td></tr>";
	    for (var i=0; i<count; i++) {
		if (parseFloat(p[i].value) != parseFloat(0)) {
		    b.nta += parseFloat(p[i].value);
		    runtot += parseFloat(p[i].value);

		    if (parseFloat(p[i].value) < parseFloat(0.0)) {
			b.html += "<tr><td></td><td>" + p[i].desc + "</td><td>(" + Math.abs(p[i].value).toLocaleString() + ")</td><td></td></tr>";
		    }
		    else {
			b.html += "<tr><td></td><td>" + p[i].desc + "</td><td>" + p[i].value.toLocaleString() + "</td><td></td></tr>";
		    }
   		}	
	    }

	    // Fill in the total
	    if (runtot < parseFloat(0.0)) {
		b.html += "<tr><td colspan='2'></td><td class='fa-single-over'></td><td style='text-align: right;'>(" + Math.abs(runtot).toLocaleString() + ")</td></tr>";
	    }
	    else {
		b.html += "<tr><td colspan='2'></td><td class='fa-single-over'></td><td style='text-align: right;'>" + runtot.toLocaleString() + "</td></tr>";
	    }
	    b.html += "<tr><td colspan='4'>&nbsp;</td></tr>";
   	}
	
   	return;
    }

    function bsRepBySection(b, header, p, count)
    // *****************************************
    {
	b.rep = parseFloat(0.0);  // Add up the Rep By values

	// Are there any elements to include
	var include = false;
	for (var i=0; i<count; i++)
	    if (parseFloat(p[i].value) != parseFloat(0.0)) {
		include = true;  break;
	    }
	
   	if (include) {
	    b.html += "<tr><td colspan='4'>" + header + "</td></tr>";
	    
	    // Get at CAP INTRO, PROFIT, REVAL RESERVE
	    for (var i=0; i<3; i++)  {
		if (parseFloat(p[i].value) != parseFloat(0.0)) {
		    b.rep += parseFloat(p[i].value);
		    if (parseFloat(p[i].value) < parseFloat(0.0)) {
			b.html += "<tr><td></td><td>" + p[i].desc + "</td><td>(" + Math.abs(p[i].value).toLocaleString() + ")</td><td></td></tr>";
   		    }	
		    else {
			b.html += "<tr><td></td><td>" + p[i].desc + "</td><td>" + p[i].value.toLocaleString() + "</td><td></td></tr>";
		    }
		}
	    }
	    
	    // Drawings? 
	    if (parseFloat(p[3].value) != parseFloat(0.0)) {
		b.html += "<tr><td>" + BS_LESS + "</td><td>" + p[3].desc + "</td><td class='fa-single-under'>" + p[3].value.toLocaleString() + "</td><td></td></tr>";
		b.html += "<tr><td colspan='4'>&nbsp;</td></tr>";
		b.rep += parseFloat(p[3].value);  // Held as a negative
	    }
	    
	    
	    // Owners Equity is the b.rep so far
	    b.html += "<tr><td></td><td>" + p[4].desc + "</td><td class='fa-single-over'>" + b.rep.toLocaleString() + "</td><td></td></tr>";
	    
	    // Get at LTL, the OE is calculated
	    for (var i=5; i<MAX_REP; i++) {
		if (parseFloat(p[i].value) != parseFloat(0.0)) {
		    b.rep += parseFloat(p[i].value);
		    b.html += "<tr><td></td><td>" + p[i].desc + "</td><td>" + p[i].value.toLocaleString() + "</td><td></td></tr>";
   		}	
	    }

	    b.html += "<tr><td></td><td></td><td></td><td class='fa-dbl-under'>" + b.rep.toLocaleString() + "</td></tr>";
   	}
	
   	return;
}

    function writeBalanceSheet()
    // *************************
    {
	var b = {html: '', nta: parseFloat(0.0), rep: parseFloat(0.0)};  // Reference object

	b.html  = "<table width='100%' class='fa-st-height fa-statement-bs'>";
	b.html += "<thead>";
	b.html += "<th style='width: 5%; text-align: left;'></th>";
	b.html += "<th style='width: 45%; text-align: left;'></th>";
	b.html += "<th style='width: 20%; text-align: right;'></th>";
	b.html += "<th style='width: 20%; text-align: right;'></th>";
	b.html += "</thead>";

	b.html += "<tbody style='overflow-y: auto;'>";

	// Are there any fixed assets
	BSSection(b, bs.f_asset_desc, bs.f_asset, MAX_F_ASSET);

	// Any investments
	BSSection(b, BS_INVEST, bs.investment, MAX_INVEST);
   	
	// Are there any intangible assets
	BSSection(b, BS_INTANG, bs.intangible, MAX_INTANG);

	// Are there any current assets 
	BSSection(b, BS_C_ASSET, bs.c_asset, MAX_C_ASSET);

	b.html += "<tr><td></td><td colspan='3'>" + BS_LESS + "</td></tr>";
	b.html += "<tr><td colspan='4'>&nbsp;</td></tr>";
	
	BSSection(b, BS_C_LIAB, bs.c_liability, MAX_C_LIAB);  // Subtract

	// The net assets of the company
	b.html += "<tr><td colspan='2'>" + BS_NETA + "</td><td></td><td class='fa-dbl-under' style='text-align: right;'>" + b.nta.toLocaleString() + "</td></tr>";
	b.html += "<tr><td colspan='4'>&nbsp;</td></tr>";
	
	bsRepBySection(b, BS_REP_BY, bs.rep_by, MAX_REP);

	b.html += "</tbody>";
	b.html += "</table>";
//console.log("BS HTML");
//console.log(b.html);
	$('#fa_balance_sheet').html(b.html);  // Write it
    }

    function initialiseCashFlow()
    // **************************
    {
	cf.desc = fa_q.keywords[6].name;  // Use the proper Cash name 
	cf.balance = parseFloat(0.0);
	cf.items = [];	// Op/Non-op and Source/Use
	cf.cfclass = [];  cf.ccf = [[], []];
	
	// Cash flows
	for (var i=0; i<2; i++) {
	    cf.items.push([parseInt(0), parseInt(0)]);
	}
	
	for (var i=0; i<fa_q.keywords[IA_CASH].structure.length; i++) {
	    cf.cfclass.push(fa_q.keywords[IA_CASH].structure[i].name);  // Op and non-Op
	}
	
	for (var i=0; i<MAX_CF; i++) {  // Two categories
	    cf.ccf[0].push({value: parseFloat(0.0), desc: ''});
	    cf.ccf[1].push({value: parseFloat(0.0), desc: ''});
	}
	
	var s = fa_q.keywords[IA_CASH].structure;
	for (var i=0; i<2; i++) {
	    for (var j=0; j<s[i].structure.length; j++) {  // Level 3
	  	cf.ccf[i][j].desc = s[i].structure[j].name;
		cf.ccf[i][j].value = parseFloat(0.0);
	    }
	}
//console.log("CF Initialised");
//console.log(cf);
    }
    
    function updateCashFlow()
    // **********************
    {
	var amount = parseFloat(0.0), op = 0, acts;
	var s = '', ss = '';

	// This recalculates from the start to the last transaction
	initialiseCashFlow();  // Safe to do this

	cf.balance = parseFloat(0.0);
	for (var i=0; i<2; i++) {
	    for (var j=0; j<2; j++) cf.items[i][j] = parseInt(0);
	}

	for (var i=0; i<fa_current_transaction; i++) {
//console.log("CF TRANSACTION: " + (i+1) + " of " + fa_current_transaction);
	    // Work through the transaction solutions totting up the amounts
	    acts = fa_q.transactions.transaction[i].actions;

	    for (var j=0; j<acts.length; j++) {
		s = keywordLookup(acts[j][IA_LEAF][0]);  // Top level
		amount = parseFloat(acts[j][IA_AMOUNT]);
//console.log("CF: action: " + s + ", amount = " + amount + ", j = " + j + ", Action:");
//console.log(acts[j]);

		if (s == cf.desc) {  // A Cash entry
		    ss = keywordLookup(acts[j][IA_LEAF][1]);  // Level 2
//console.log("--- CF: action: " + ss);
		    if (ss == cf.cfclass[0]) op = I_OP;
		    else if (ss == cf.cfclass[1]) op = I_NON_OP;
		    else {
			console.log("CF: Unknown CASH CLASS: " + s);  continue;
		    }

		    ss = keywordLookup(acts[j][IA_LEAF][2]);  // Level 3
		    for (var k=0; k<MAX_CF; k++) {
			if (ss == cf.ccf[op][k].desc) {
			    cf.ccf[op][k].value += amount;			    
			}
		    }
		}
	    }
	}

	// Work out the way the cash is being used.
	for (var i=0; i<2; i++) {
	    for (var j=0; j<MAX_CF; j++) {
		if (parseFloat(cf.ccf[i][j].value) > parseFloat(0.0)) {
		    cf.items[i][I_SOURCES]++;
		}
		else if (parseFloat(cf.ccf[i][j].value) < parseFloat(0.0)) {
		    cf.items[i][I_USES]++;
		}
		else {  // Not set
		}
	    }
	}
	
	// Finally, tot up the balance
	for (var i=0; i<2; i++) {
	    for (var j=0; j<MAX_CF; j++) {
     		cf.balance += cf.ccf[i][j].value;
	    }
	}

//console.log("CF UPDATED");
//console.log(cf);
	return;
    }
    
    function cfLine(c, op, inn)
    // ************************
    {
	var v = parseFloat(0.0);
	
	if (op == -2) { // KWC && cf.items[op][inn] != 0) {  // Sub-totals
//	    c.html += "<tr><td></td><td></td><td class='fa-single-over'></td><td></td></tr>";
	}
	else if (op == -1) {  // Totals DON'T NEED THIS OR THE ONE ABOVE???
//	    c.html += "<tr><td></td><td></td><td class='fa-single-over'></td><td class='fa-single-over'></td></tr>";

	    if (inn == I_SOURCES) {
		for (var i=0; i<2; i++) {
		    for (var j=0; j<MAX_CF; j++) {
			if (parseFloat(cf.ccf[i][j].value) > parseFloat(0.0))
  			    v += parseFloat(cf.ccf[i][j].value);
		    }
		}
	    }
	    else {
		for (var i=0; i<2; i++) {
		    for (var j=0; j<MAX_CF; j++) {
			if (parseFloat(cf.ccf[i][j].value) < parseFloat(0.0))
			    v += parseFloat(cf.ccf[i][j].value);
		    }
		}
	    }
	    c.html += "<tr><td colspan='2'></td><td></td><td class='fa-single-over' style='text-align: right;'>" + Math.abs(v).toLocaleString() + "</td></tr>";
	}
	else {
	    var ind = parseInt(0);

	    for (var i=0; i<MAX_CF; i++) { 
		if (parseFloat(cf.ccf[op][i].value) != parseFloat(0.0)) {
		    if (inn == I_SOURCES) {
			if (parseFloat(cf.ccf[op][i].value) > parseFloat(0.0)) {
			    c.html += "<tr><td></td><td>" + cf.ccf[op][i].desc + "</td><td>" + Math.abs(cf.ccf[op][i].value).toLocaleString() + "</td><td></td></tr>";
			    ind++;			
			}
		    }
		    else {
			if (parseFloat(cf.ccf[op][i].value) < parseFloat(0.0)) {
			    c.html += "<tr><td></td><td>" + cf.ccf[op][i].desc + "</td><td>" + Math.abs(cf.ccf[op][i].value).toLocaleString() + "</td><td></td></tr>";
			    ind++; 
			}
		    }
		    
		    // Check for a total, i.e. index ind at max value
		    if (ind == parseInt(cf.items[op][inn]) && parseInt(cf.items[op][inn]) != parseInt(0)) {
			v = parseFloat(0.0);
			
			if (inn == I_SOURCES) {
			    for (var j=0; j<MAX_CF; j++)
			        if (parseFloat(cf.ccf[op][j].value) > parseFloat(0.0)) 
				    v+= parseFloat(cf.ccf[op][j].value);
			}
			else {
			    for (var j=0; j<MAX_CF; j++)
			        if (parseFloat(cf.ccf[op][j].value) < parseFloat(0.0)) 
				    v+= parseFloat(cf.ccf[op][j].value);
			}
			
			c.html += "<tr><td></td><td></td><td class='fa-single-over'></td><td class='fa-single-under'>" + Math.abs(v).toLocaleString() + "</td></tr>";

			break;  // Reached the limit of entries for this category
		    }
		}
	    }
	}
    }
    
    function writeCashFlow()
    // *********************
    {
	var c = {html: '', nta: parseFloat(0.0), rep: parseFloat(0.0)};  // Reference object

	c.html  = "<table width='100%' class='fa-st-height fa-statement-cf'>";
	c.html += "<thead>";
	c.html += "<th style='width: 5%; text-align: left;'></th>";
	c.html += "<th style='width: 45%; text-align: left;'></th>";
	c.html += "<th style='width: 20%; text-align: right;'></th>";
	c.html += "<th style='width: 20%; text-align: right;'></th>";
	c.html += "</thead>";

	c.html += "<tbody style='overflow-y: auto;'>";

	if ((parseInt(cf.items[I_OP][I_SOURCES]) + parseInt(cf.items[I_NON_OP][I_SOURCES])) > parseInt(0)) {
	    c.html += "<tr><td colspan='2'>" + CF_SOURCES + "</td><td></td><td></td></tr>";
	    cfLine(c, I_OP, I_SOURCES);      cfLine(c, -2, I_SOURCES);
	    cfLine(c, I_NON_OP, I_SOURCES);  cfLine(c, -1, I_SOURCES);   // Totals
	}
	
	if ((parseInt(cf.items[I_OP][I_USES]) + parseInt(cf.items[I_NON_OP][I_USES])) > parseInt(0)) {
	    c.html += "<tr><td colspan='2'>" + CF_USE + "</td><td></td><td></td></tr>";
	    
	    cfLine(c, I_OP, I_USES);      cfLine(c, -2, I_USES);
	    cfLine(c, I_NON_OP, I_USES);  cfLine(c, -1, I_USES);   // Totals
	}
	
	c.html += "<tr><td colspan='4'></td></tr>";
	c.html += "<tr><td colspan='2'>" + CF_CLOSE + "</td><td></td><td style='text-align: right;'>" + cf.balance.toLocaleString() + "</td></tr>";
	c.html += "<tr><td></td><td></td><td></td><td class='fa-dbl-over'></td></tr>";

	c.html += "</tbody>";
	c.html += "</table>";
//console.log("CF HTML");
//console.log(c.html);
	$('#fa_cash_flow').html(c.html);  // Write it
    }


    // ONREADY
    $(document).ready(function()
    // -------------------------
    {
	$(window).on('beforeunload', function(e){
	    return "Leave?";  // This could be any string.
	});

	// On ready, fetch the server side list of questions
	getQuestions();

/*
	$(".fa_key_leaf").draggable ({  // Leaf keywords are dragable
            helper : "clone"  
	});
*/
	// Fetch selected question
	$("button[id^='fa-q-button']").on("click", function(e) {
            e.stopPropagation();
	});

	// Fetch selected question
	$(".fa-q-button").on("click", function(e) {
            e.stopPropagation();
	});

	// Now allow file to be selected
        $("#fa-question-selector").on("change", function(e) {
            e.stopPropagation();
	    var fileList = e.target.files;

	    for (const file of fileList) {
		// Not supported in Safari for iOS.
		const name = file.name ? file.name : 'NOT SUPPORTED';
		// Not supported in Firefox for Android or Opera for Android.
		const type = file.type ? file.type : 'NOT SUPPORTED';
		// Unknown cross-browser support.
		const size = file.size ? file.size : 'NOT SUPPORTED';

                var reader = new FileReader();
                reader.onload = function(e) {
		    fa_question = reader.result;
                    $("#fa-question").text(reader.result);

		    // See if it parses
		    if ((fa_xml = questionParses(fa_question)) != false) {

			// Have a quick check of the array <structure> elements
			if (structureParses(fa_xml) == false) {
			    fa_parsed_OK = false;  // Problems
			}
		    }
		    else {
			alert(AE_XMLPARSEERROR);
			fa_parsed_OK = false;  // Problems
		    }

		    if (fa_parsed_OK) {
			createQuestionStructure(fa_xml);
		    }
                }

                reader.readAsText(file); // Now fire up the onload event
		fa_current_action = 0;  // Count the actions of the user
	    }
	});

	$(".fa-key-leaf").on('click', (e) => {
	    e.stopPropagation();
	    e.preventDefault();
	});

	$(".fa-question-drag-area").on('dragover', (e) => {
	    e.stopPropagation();
	    e.preventDefault();
	    // Style the drag-and-drop as a "copy file" operation.
	    e.dataTransfer.dropEffect = 'copy';
	});

	$(".fa-question-drop-area").on('drop', (e) => {
	    const fileList = e.originalEvent.dataTransfer.files;
	    if (!(fileList[0].name).endsWith("_ae.xml")) {
		e.stopPropagation();
		e.preventDefault();
		alert(AE_FILEENDING);
	    }
	});

	// DnDs for Actions

	$("#fa-asset-drop-area").on('dragover', function(e) {
	    e.preventDefault();
// console.log("Asset Dragover:");  console.log(e);
//	    var data = e.dataTransfer.getData("text/plain");
	    return false;
	});

	$("#fa-asset-drop-area").on('dragenter', function(e) {
	    e.preventDefault();
	    $(this).css('background-color','aliceblue');
//	    var data = e.dataTransfer.getData("text/plain");
	    return false;
	});

	$("#fa-asset-drop-area").on('dragleave', function(e) {
	    e.preventDefault();
	    $(this).css('background-color','inherit');
// console.log("OE Dragenter:");  console.log(e);
	});

	$("#fa-asset-drop-area").on('drop', function(e) {
//console.log("Asset Drop:");  console.log(e);
	    var data = e.originalEvent.dataTransfer.getData("text/plain");
// console.log("Asset Drop Data = ");console.log(data);
	    // Data is of the form fa-leaf-XX so get the XX
	    var leafy = data.split('-');  // An array of length 3
//console.log("Dropped leaf: " + leafy[2]); console.log(leafy); console.log(fa_leaves[leafy[2]]);
	    var leaf = leafy[2];  // Leaf number

	    // Activate the modal popup to get the amount
	    // First adjust the text to reflect the Keywords
	    var v = '<ul>', vbar = '</ul>';  // Open at least one list
	    for (var i=0; i<fa_leaves[leaf].length; i++) {
		// Build up and record this answer
		fa_check_ans.push(fa_leaves[leaf][i].id)

		if (i > 0) {
		    v += '<ul>';  vbar += '</ul>';  // Open and close another list
		}
		v += '<li>' + fa_leaves[leaf][i].name + ((i==0) ? ' (£££)' : '') + '</li>';    // The keyword at level i, plus an amount marker
	    }
	    v += vbar;  // Close up

	    $('#fa-modal-action-type').val('ASSET');  $('#fa-modal-action-leaf').val(leaf);        // Record the leaf number
	    $('#fa-modal-keyword').html(v);
	    $('#fa-modal-action-amount').show();  // Pop up action amount modal. Hide when closed
	    $('#fa-action-amount').focus();       // Put the focus on the input
	});

	$("#fa-equity-drop-area").on('dragover', function(e) {
	    e.preventDefault();
	});

	$("#fa-equity-drop-area").on('dragenter', function(e) {
	    e.preventDefault();
	    $(this).css('background-color', 'aliceblue');
// console.log("OE Dragenter:");  console.log(e);
	});

	$("#fa-equity-drop-area").on('dragleave', function(e) {
	    e.preventDefault();
	    $(this).css('background-color','inherit');
// console.log("OE Dragenter:");  console.log(e);
	});

	$("#fa-equity-drop-area").on('drop', function(e) {
	    e.preventDefault();
//console.log("OE Drop:");  console.log(e);
	    var data = e.originalEvent.dataTransfer.getData("text/plain");
//console.log("OE Drop: data = ");console.log(data);

	    var leafy = data.split('-');  // An array of length 3
//console.log("Dropped leaf: " + leafy[2]); console.log(leafy); console.log(fa_leaves[leafy[2]]);
	    var leaf = leafy[2];  // Leaf number

	    // Activate the modal popup to get the amount
	    // First adjust the text to reflect the Keywords
	    var v = '<ul>', vbar = '</ul>';  // Open at least one list
	    for (var i=0; i<fa_leaves[leaf].length; i++) {
		fa_check_ans.push(fa_leaves[leaf][i].id)

		if (i > 0) {
		    v += '<ul>';  vbar += '</ul>';  // Open and close another list
		}
		v += '<li>' + fa_leaves[leaf][i].name + ((i==0) ? ' (£££)' : '') + '</li>';    // The keyword at level i, plus an amount marker
	    }
	    v += vbar;  // Close up

	    // Activate the modal popup to get the amount
	    $('#fa-modal-action-type').val('OE');        // Record which side this goes on
	    $('#fa-modal-action-leaf').val(leaf);        // Record the leaf number
	    $('#fa-modal-keyword').html(v);
	    $('#fa-modal-action-amount').show();  // Pop up action amount modal. Hide when closed
	    $('#fa-action-amount').focus();       // Put the focus on the input
	});

	$("#fa-action-accept").on('click', function(e) { 
	    e.preventDefault();

	    if ($('#fa-action-amount').val()) {
//console.log("Action accept:");  console.log($('#fa-action-amount').val());

		$('#fa-modal-action-amount').hide();  // Got an amount.  Hide the modal

		// Add to the OE List?
		var ae_side = 'equity', leaf = $('#fa-modal-action-leaf').val();
		if ($('#fa-modal-action-type').val() != 'OE') {
		    ae_side = 'asset';
		}

		fa_num_actions++;  // New action to include.  Give it an id the same as the <tr> entry
		fa_q.transactions.transaction[fa_current_transaction].answer.push(['fa-' + ae_side + '-item-' + fa_num_actions, 
										   $('#fa-action-amount').val(), 
										   ae_side, 
										   fa_check_ans]);

		// Is this answer right?
		var ae_class = 'ae-wrong', eql = false, tran = fa_q.transactions.transaction[fa_current_transaction];
		for (var i=0; i<tran.actions.length; i++) {  // Loop over all actions ...
		    eql = tran.actions[i][IA_LEAF].every(function (element) {
			return fa_check_ans.includes(element);
		    })
			
		    if (eql) {
			console.log("Arrays are equal");
			// Are the sides and amounts the same?
			if (tran.actions[i][0] != ae_side) {
			    eql = false;
			    console.log("Sides are wrong");
			}
			if (tran.actions[i][IA_AMOUNT] != $('#fa-action-amount').val()) {
			    eql = false;
			    console.log("Values are wrong");
			}
		    }
		    
		    if (eql) {
			ae_class = 'ae-correct';  // Highlight the outcome
			break;  // We have a match
		    }
		}

		fa_check_ans = [];  // clear for next action

		var s = $('#fa-modal-keyword').html();  // Substitute £££ for the actual amount
		// Add in this new row
		$('#fa-' + ae_side + '-list').append("<tr id='fa-" + ae_side + "-item-" + fa_num_actions + 
						     "' class='" + ae_class  + "'><td class='fa-item' data-leaf='" + leaf + 
						     "' title='Double click to delete.'>&times;</td><td>" + 
						     s.replace('(£££)', '<span class=\"fa-amount\">(&pound;' + 
							       $('#fa-action-amount').val() + '</span>)') + 
						     "</td></tr>");
		
		// Attach an event handler to this entry to pick up a potential delete
		var evh = document.getElementById('fa-' + ae_side + '-item-' + fa_num_actions);  // Get the <tr> node
		evh.addEventListener("dblclick", function() {
		    if (confirm("Delete this entry?")) {
			// Find this entry in the answers
			for (var i=0; i<fa_q.transactions.transaction[fa_current_transaction].answer.length; i++) {
			  if (fa_q.transactions.transaction[fa_current_transaction].answer[i][0] == $(this).attr('id')) {
			      fa_q.transactions.transaction[fa_current_transaction].answer.splice(i, 1);  // Remove this element
			      break;
			  }
			}
			$(this).remove();  // Remove the <tr> 
		    }
		});

		// Reset inputs to undefined
		$('#fa-action-amount').val(undefined); $('#fa-modal-action-type').val('');
	    }
	    else {
		alert(AE_NOVALUE);  // No value, so leave modal up.
		return false;
	    }
	});

	$(".fa-item").on('dblclick', function(e) {
	    e.preventDefault();
//console.log("DBL Click");  console.log(e);  
	});

	$("#fa-transaction-complete").on('click', function(e) { 
	    e.preventDefault();
	    if (fa_num_actions == 0) {
		if (!confirm(AE_NOATTEMPT))
		    return false;
	    }

	    // Now work out what has been done
//console.log("Assets");
//console.log($("#fa-asset-list").find("td.fa-item"));
	    $("#fa-asset-list").find("td.fa-item").each(function() {
		console.log($(this).data("leaf"));
	    });
//console.log("OE");
//console.log($("#fa-equity-list").find("td.fa-item"));

	    // Now do the checking
	    if (checkTransaction()) {
		alert(AE_CORRECT);
		setupNextTransaction();  // Proceed
	    }
	    else {
//		alert(AE_TERRORS);  // Not quite right
		if (fa_check_message != '') fa_check_message += '\r\n\r\n' + AE_AUTOACCEPT;
		else fa_check_message = AE_AUTOACCEPT;

		if (confirm(fa_check_message)) {
		    setupNextTransaction();
		}
	    }
	});
    });

    // FinAccs model
    // ===========
    var _defaults;
    
    var FinAccs = function(cid) {
	this.ctx = AE_CTXT;  // Set a content for checking, and any defaults
	_defaults = this.defaults;

//	this.canvas = grCanvas(cid);  // Create a new canvas

	return this;
    };
    

    // fa class
    var __fa = function () {
	this.fastyle;  // Style for selected chart type */
    };


    // Some getters
    FinAccs.prototype.getQuestion = function () {
    // --------------------------
	return fa_question;
    }

    // ... and setters
    FinAccs.prototype.setQuestion = function (q) {
    // -----------------------
	fa_question = q;
    }

    // Show 
    FinAccs.prototype.showAbout = function () {
    // -------------------------
	alert('FinAccs: the Accounting Equation Applet');
    }



    //Globally expose the defaults to allow for user updating/changing
    FinAccs.prototype.defaults = {
    };
    
    //Global helpers object for utility methods and classes
    var helpers = FinAccs.helpers = {};
    
    //-- Basic js utility methods
    var each = helpers.each = function(loopable,callback,self){
    };
    
    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    FinAccs.instances = {};
    
    var finaccs = function(cid){ 
	return new FinAccs(cid); 
    };
    exports(finaccs);
}
)(typeof(exports) === 'undefined' 
  ? function(f){this['finacss'] = f} 
  : function(f){module.exports = f}
 );
