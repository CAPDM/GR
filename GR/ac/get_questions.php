<?php

/* ***********
 *
 * Fetch a list of AE questions
 *
 * ***********/


$ret = array();  // Return an array of names

if ($handle = opendir('./finaccs_ae')) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry == "." || $entry == "..") {
	   // Ignore
        }
	else if (substr_compare($entry, '_ae.xml', -strlen('_ae.xml')) === 0) {
	     array_push($ret, $entry);	
	}
	else {
	     // Also ignore anything else
	}
    }
}

// Set up some headers for the reply
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT" );
header("Last-Modified: " . gmdate( "D, d M Y H:i:s" ) . "GMT" );
header("Cache-Control: no-cache, must-revalidate" );
header("Pragma: no-cache" );
header("Content-Type: text/xml; charset=utf-8");

/*
  The most important header is the "Expires" header. Set it to a date that has already passed as IE tends to cache the response regardless of the other headers.
  Content-Type?  We're sending plain text (JSON)
*/

echo json_encode($ret);

?>