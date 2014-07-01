
// The Jenkins 96 bit mix function:
// http://www.concentric.net/~Ttwang/tech/inthash.htm
// stolen from Google Chromium's bloom filter
// http://www.google.com/codesearch/p#OAMlx_jo-ck/src/chrome/browser/safe_browsing/bloom_filter.cc&exact_package=chromium
// thanks dudes!
// NOTE: chromium no longer has a bloom filter! Now you can see the ideas for
// this code here: http://www.burtleburtle.net/bob/hash/doobs.html
var seed1 = Math.floor(Math.random() * 2e32);
var seed2 = Math.floor(Math.random() * 2e32);
function hashMix(hash_key) {
	var a = seed1;
	var b = seed2;
	var c = hash_key;
	console.log(a, b, c);
	a -= (b + c); a ^= (c >> 13);
	b -= (c + a); b ^= (a << 8);
	c -= (a + b); c ^= (b >> 13);
	a -= (b + c); a ^= (c >> 12);
	b -= (c + a); b ^= (a << 16);
	c -= (a + b); c ^= (b >> 5);
	a -= (b + c); a ^= (c >> 3);
	b -= (c + a); b ^= (a << 10);
	c -= (a + b); c ^= (b >> 15);
	//XXX: can this even be negative? It was designed to run with uints. Javascript is dumb.
	return Math.abs(c);
}
// thanks Borgar!
// http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string/1242596#1242596
function stringToBytes(str) {
	var ch, st, re = [];
	for (var i = 0; i < str.length; i++) {
		ch = str.charCodeAt(i); // get char
		st = []; // set up "stack"
		do {
			st.push( ch & 0xFF ); // push byte to stack
			ch = ch >> 8; // shift value down by 1 byte
		}
		while ( ch );
		// add stack contents to result
		// done because chars have "wrong" endianness
		re = re.concat( st.reverse() );
	}
	// return an array of bytes
	return re;
}

var FNVPRIME = 0x01000193;
var FNVINIT = 0x811c9dc5;
function fnv1s(str) {
	var bytes = stringToBytes(str);
	var hash = FNVINIT;
	for (var i=0; i < bytes.length; i++) {
		hash *= FNVPRIME;
		hash ^= bytes[i];
	}
	return Math.abs(hash);
}

nboxes = 15;
strings = [];
function bloom(s) {
	$(".bloomactive").attr("class", "set");
	strings.push(s);
	$("#yourset").html(strings.join(", "));
	//clear the text input box
	$("#addtoset").val("");
	var a = fnv1s(s) % nboxes;
	var b = murmur(s) % nboxes;
	$(".bit[i='" + a + "']").attr("class", "bloomactive");
	$(".bit[i='" + b + "']").attr("class", "bloomactive");
	//the probability of a false positive is the number of 1s in the bit vector
	//divided by the number of bits in the vector to the power of k, the number
	//of index functions you're using
	var p = Math.round((Math.pow($(".set, .bloomactive").length / nboxes, 2)) * 100);
	$("#false_pos_prob").html(p + "%");
}
function testMembership(evt) {
	//clear out "bloomactive" cells
	$(".bloomactive").attr("class", "set");
	var s = $("#membership").val();
	var a = fnv1s(s) % nboxes;
	var b = murmur(s) % nboxes;
	if ($("#bit[i='" + a + "']").attr("class") == "set" &&
			$("#bit[i='" + b + "']").attr("class") == "set") {
				$("#ismember").html("maybe!");
			} else {
				$("#ismember").html("no");
			}
	$("#memfnv").html(a)
		$("#memmurmur").html(b)
}

$(function() {
	//add the table cells which represent our bloom filter bit array
	for (var i=0; i<nboxes; i++) {
		$(".bits").append('<td class="bit" i="' + i + '" width=20>&nbsp;</td>');
		$(".labels").append('<td class="label" i="' + i + '" align="center">' + i + '</td>');
	}
	//handle a click on the "add to bloom filter" button
	$("#hash").click(function() {
		var s = $("#addtoset").val();
		$("#fnv").html(fnv1s(s) % nboxes)
		$("#murmur").html(murmur(s) % nboxes)
		bloom(s);
	});
	// handle enter key on "add to bloom filter" form
	$('#addtoset').keydown(function (event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			$('#hash').click();
		}
	});
	$("#membership").keyup(testMembership);
}); 
