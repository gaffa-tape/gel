var test = require('tape'),
    Gel = require('../gel.js'),
    gel = new Gel(),
    createSpec = require('spec-js');

// Add a custom gel function
gel.scope["demoFunc"] = function() {
    return 123456;
};

gel.scope["throwError"] = function() {
    throw "error";
};


var context = {
    contextProp:10,
    customFunc: function(item){
        return item < 10;
    },
    console:{
        log: function(){console.log(arguments)}
    },
    anArray: ["a","b","c"],
    anOtherArray: [1,2,3]
}


test('1', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('-2', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), -2);
  t.end();
});
test('2.4e9', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2400000000);
  t.end();
});
test('1.0E-3', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 0.001);
  t.end();
});
test("'a'", function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "a");
  t.end();
});
test('"a"', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "a");
  t.end();
});
test("'''", function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("'''");
  });
  t.end();
});
test("'\\''", function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "'");
  t.end();
});
test('"\\\""', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), '"');
  t.end();
});
test('"\\\"Hello\\\" \\\"World\\\""', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), '"Hello" "World"');
  t.end();
});
test('\'\"Hello\" \"World\"\'', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), '"Hello" "World"');
  t.end();
});
test('true', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('false', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('null', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), null);
  t.end();
});
test('undefined', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), undefined);
  t.end();
});
test('(|| trueStartingIdentifier 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(= 1 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(= 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(! false)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(= true true)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(= true (! false))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(|| 2 0 3)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(|| 0 0 0)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 0);
  t.end();
});
test('(|| false "If this test passes, lazy evaluation has been implemented" (throwError))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 'If this test passes, lazy evaluation has been implemented');
  t.end();
});
test('(| 2 0 3 false true)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(| 2 0 3 false false)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(&& 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(&& (!= 1 2) (!= null 3) (!= null 4) (> 4 3))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(+ 0 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(+ 1 2 3 -4)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 3);
  t.end();
});
test('(- 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), -1);
  t.end();
});
test('(- 1 2 8)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), -1);
  t.end();
});
test('(* 4 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 8);
  t.end();
});
test('(* 0 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 0);
  t.end();
});
test('(/ 4 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(/ 0 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 0);
  t.end();
});
test('(% 4 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 0);
  t.end();
});
test('(% 5 3)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(== (/ 2 0) Infinity)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(== (/ -2 0) -Infinity)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
 test('(== (/ 0 0) NaN)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(isNaN NaN)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(isNaN (/ 0 0))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(isNaN Infinity)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(isNaN)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(isNaN "dog")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(isNaN "13")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(== (/ 64 8) (/ 4 3))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(= null undefined)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(== null undefined)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(== true (! false))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(!= true false)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(!== true (! false))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(!= true 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(!== true 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(> 1 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(> 2 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(> 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(> 3 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(> 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(< 1 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(< 2 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(< 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(< 3 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(< 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(? true 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('(? false 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(? "" 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 2);
  t.end();
});
test('(? "majigger" 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('(? true 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('(>= 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(>= 2 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(>= 2 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(>= 2 3)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(>= 3 3)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(<= 2 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(<= 2 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(<= 1 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(<= 2 1)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(<= 2 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(array 1 2 3 "abc")', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [
        1,
        2,
        3,
        "abc"
    ]);
  t.end();
});
test('(concat (array 1 2 3) (array 4 5 6))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [1,2,3,4,5,6]);
  t.end();
});
test('(slice 2 7 "Hello World")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "llo W");
  t.end();
});
test('(slice 1 "Hello World")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "ello World");
  t.end();
});
test('(slice "Hello World")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "Hello World");
  t.end();
});
test('(slice 1 2 (array 1 2 3))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [2]);
  t.end();
});
test('(slice 1 (array 1 2 3))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [2, 3]);
  t.end();
});
test('(slice (array 1 2 3))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [1, 2, 3]);
  t.end();
});
test('(split "hello world" " ")', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context)[1], "world");
  t.end();
});
test('(format "hello {0}" "world")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "hello world");
  t.end();
});
test('(format "hello {0}" undefined)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "hello ");
  t.end();
});
test('(filter (array (object "prop" 5)(object "prop" 6)(object "prop" 5)(object "prop" "WAT")) {item (= item.prop 5)})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [{"prop":5},{"prop":5}]);
  t.end();
});
test('(findOne (array (object "prop" 5)(object "prop" 6)(object "prop" 5)(object "prop" "WAT")) {item (= item.prop 5)})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {"prop":5});
  t.end();
});
test('(sort (array 7 2 3 5 6 4) {a b (- a b)})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [2,3,4,5,6,7]);
  t.end();
});
test('(sort (array (object "prop" 6)(object "prop" 7)(object "prop" 5)) {a b (- a.prop b.prop)})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [{"prop":5},{"prop":6},{"prop":7}]);
  t.end();
});
test('(sort (array 1 5 33 59 3.7 3.6 3.8 29 43 19 4 9 42 29239 94 94 92 9 929 49 82 893 3 3 239 2742 22 947 427 2 947 792 7924 2 929 474 729 32 59 273 397 72 3) {a b (- a b)})', function (t) {
  t.plan(1);
  t.deepEqual(
    gel.evaluate(t.name, context),
    [1,2,2,3,3,3,3.6,3.7,3.8,4,5,9,9,19,22,29,32,33,42,43,49,59,59,72,82,92,94,94,239,273,397,427,474,729,792,893,929, 929,947,947,2742,7924,29239]
  );
  t.end();
});
test('(contains "Hello World" "WAT")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(contains "Hello World" "hello")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(contains "Hello World" "Hello")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(contains true "Hello World" "hello")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(contains false "Hello World" "hello")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(contains (array 1 2 3) 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(contains (array 1 2 3) 4)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(charAt "things")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 't');
  t.end();
});
test('(charAt "things" 4)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 'g');
  t.end();
});
test('(last (array 1 2 3 "abc"))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "abc");
  t.end();
});
test('(first (array 1 2 3 "abc"))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('(object "key" "value")', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {"key": "value"});
  t.end();
});
test('(date)', function (t) {
  t.plan(1);
  t.ok(gel.evaluate(t.name, context) instanceof Date);
  t.end();
});
test('(date 123 123 123)', function (t) {
  t.plan(1);
  t.equal(isNaN(gel.evaluate(t.name, context).getTime()), true);
  t.end();
});
test('(date 1355745289462)', function (t) {
  t.plan(1);
  t.ok(gel.evaluate(t.name, context).toString().indexOf("Mon Dec 17 2012 21:54:49") === 0);
  t.end();
});
test('(date.addDays (date 1355745289462) 7)', function (t) {
  t.plan(1);
  t.ok(gel.evaluate(t.name, context).toString().indexOf("Mon Dec 24 2012 21:54:49") === 0);
  t.end();
});
test('(date.addDays (date 1355745289462) -7)', function (t) {
  t.plan(1);
  t.ok(gel.evaluate(t.name, context).toString().indexOf("Mon Dec 10 2012 21:54:49") === 0);
  t.end();
});
test('(max 1 5 3 4 2)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 5);
  t.end();
});
test('()', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate('()');
  }, "undefined is not a function");
  t.end();
});
test('(last (array 1 2 3))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 3);
  t.end();
});
test('(length (array 1 2 3))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 3);
  t.end();
});
test('(length "string")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 6);
  t.end();
});
test('(toString 5)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "5");
  t.end();
});
test('(join "" 15 " good sir")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "15 good sir");
  t.end();
});
test('(/ 15 10)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1.5);
  t.end();
});
test('(= 10 10)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(= (object) null)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(= (+ 10 15.5) (join "" "25" ".5"))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(compare (array 1 2 3) (array 1 2 3) =)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(compare (array 1 5 3) (array 1 5 3) (array 1 5 3) (array 1 5 3) =)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(compare (array 4 5 6) (array 1 2 3) =)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(== (+ 10 15.5) (concat "25" ".5"))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(refine true (object "stuff" 1 "things" 2 "majigger" 3) "stuff" "things")', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {majigger:3});
  t.end();
});
test('(fromJSON \'{"hello":["world"]}\')', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {"hello":["world"]});
  t.end();
});
test('(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (< 1 (length(filter item {item (= item 2)})))})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [[2,2,3]]);
  t.end();
});
test('(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (= 1 (length(filter item {item (= item 2)})))})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [[1,2,3]]);
  t.end();
});
test('(object "thing" 5).thing', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 5);
  t.end();
});
test('{"things":"stuff" "whatsits":"majigger"}', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {things: 'stuff', whatsits: 'majigger'});
  t.end();
});
test('{"thing":5}.thing', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 5);
  t.end();
});
test('{"stuff":{"thing":5}.thing}', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {stuff:5});
  t.end();
});
test('{"thing":1}', function (t) {
  t.plan(1);
  var tokens = gel.evaluate(t.name, context, true);
  t.ok(tokens[0].sourcePathInfo);
  t.end();
});
test('{}', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {});
  t.end();
});
test('(filter (array 1 2 3 4 5 4 3 2 1)  {item (= item 2)} )', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [2,2]);
  t.end();
});
test('(demoFunc)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 123456);
  t.end();
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
  gel.evaluate("(demoFunc")
  }, "error");
  t.end();
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("(demoFunc}")
  }, "error");
  t.end();
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("demoFunc}")
  }, "error");
  t.end();
});
test('demoFunc', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), gel.scope.demoFunc);
  t.end();
});

test('Zomfg wtf is this shit', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), undefined);
  t.end();
});
test('"not a well formed" string"', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate('"not a well formed" string"')
  }, "error");
  t.end();
});
test('(map anArray (partial join "" "world "))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), ["world a","world b","world c"]);
  t.end();
});
test('(map anArray {string (join "" "world " string)})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), ["world a","world b","world c"]);
  t.end();
});
test('(map anArray (compose length (partial join "" "world ")))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [7,7,7]);
  t.end();
});
test('(map anArray {item (length (join "" "world " item))})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [7,7,7]);
  t.end();
});
test('(map anArray {item (length (join "" item "world "))})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [7,7,7]);
  t.end();
});
test('(map null {item 1})', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), null);
  t.end();
});
test('(pairs (object "hello" "world"))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), [['hello','world']]);
  t.end();
});
test('(flatten (pairs (object "hello" "world")))', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), ['hello','world']);
  t.end();
});
test('(fold anOtherArray 0 +)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 6);
  t.end();
});
test('(compare (array 1 2 3) (array 2 3 4) <)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(compare (array 1 2 3) (array 2 3 4) >)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(getValue anArray "1")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "b");
  t.end();
});
test('(apply | anArray)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "c");
  t.end();
});
test('(zip (array 1 2 3) (array "a" "b" "c"))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        [1,'a',2,'b',3,'c']
    );
    t.end();
});
test('(zip (array 1 2 3) (array "a" "b" "c")(array "foo" "bar" "meh"))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        [1,'a', 'foo',2,'b','bar',3,'c','meh']
    );
    t.end();
});
test('(array 1 2 3) |> last', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        3
    );
    t.end();
});
test('(array 1 2 3) ~> (partial join " ")', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        "1 2 3"
    );
    t.end();
});
test('123 ~> toString', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        null
    );
    t.end();
});
test('(parseInt 3.2)', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        3
    );
    t.end();
});
test('(parseFloat "1.2")', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        1.2
    );
    t.end();
});
test('(toFixed 2.34567)', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        "2.35"
    );
    t.end();
});
test('(toFixed 2)', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        "2.00"
    );
    t.end();
});
test('(toFixed 2 10)', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        "2.0000000000"
    );
    t.end();
});
test('({obj (keyFor obj.a obj)} (object "a" (object)))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        'a'
    );
    t.end();
});
test('(merge (object "a" 1) (object "b" 2))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        {a:1,b:2}
    );
    t.end();
});
test('(merge (object "a" 1) (object "b" 2) (object "c" 3))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        {a:1,b:2,c:3}
    );
    t.end();
});
test('(regex "(.)" "g")', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        new RegExp('(.)', 'g')
    );
    t.end();
});
test('(match "hello world" (regex "(.ld)" "g"))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        ['rld']
    );
    t.end();
});
test('(match "thing thing" (regex "(thing)" "g"))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        ['thing', 'thing']
    );
    t.end();
});
test('(math.sqrt 1234)', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        35.12833614050059
    );
    t.end();
});
test('1,2,3', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        [1,2,3]
    );
    t.end();
});
test('1,2,', function (t) {
    t.plan(1);
    t.throws(function(){
        gel.evaluate(t.name, context);
    });
    t.end();
});
test(',2,3', function (t) {
    t.plan(1);
    t.throws(function(){
        gel.evaluate(t.name, context);
    });
    t.end();
});
test('1,2,{"a":"b"}.a', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        [1,2,'b']
    );
    t.end();
});
test('1,2,3 ~> (join " " ...)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
       "1 2 3"
    );
    t.end();
});
test('2 |> (+ 1 _)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        3
    );
    t.end();
});
test('2 |> (+ _ 1)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        3
    );
    t.end();
});
test('2,3 ~> (+ _ _)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        5
    );
    t.end();
});
test('1,2,1,2,3,"GO" ~> (join " " "a" _ "and a" _ "and a" ...)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        "a 1 and a 2 and a 1 2 3 GO"
    );
    t.end();
});
test('1,2,3 |> (fold _ 0 +)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        6
    );
    t.end();
});
test('(fold 1,2,3 0 +)', function (t) {
    t.plan(1);
    t.equal(
        gel.evaluate(t.name, context),
        6
    );
    t.end();
});
test.only('(apply merge (array {"foo" : {"stuff" : (array 1 2 3)}} {"bar" : {"thing" : "stuff"}}))', function (t) {
  t.plan(1);
  t.equal(
      gel.evaluate(t.name, context),
      {'bar':{'thing':'stuff'}, 'foo': {'stuff':[1,2,3]}}
  );
  t.end();
});
test('{"a":1},{"a":2},{"a":3} |> (map _ (* 2 _.a))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        [2,4,6]
    );
    t.end();
});
test('(fold "1","2",3 0 (+ _ _|>parseInt))', function (t) {
    t.plan(1);
    t.deepEqual(
        gel.evaluate(t.name, context),
        6
    );
    t.end();
});
