var test = require('tape');
var gel = require('../gel.js');

test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate($1), $2);
});

test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("1"), 1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("-2"), -2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("2.4e9"), 2400000000);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("1.0E-3"), 0.001);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"a\""), "a");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'a'"), "a");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\"a\"'"), "\"a\"");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'''"), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\\''"), "'");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"\\\"\\\"\""), "\"\"");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"\\\"Hello\\\" \\\"World\\\"\""), "\"Hello\" \"World\"");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\"Hello\" \"World\"'"), "\"Hello\" \"World\"");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("true"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("false"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("null"), null);
});
[
    "undefined"
],
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| trueStartingIdentifier 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 1 1)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 1 2)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(! false)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= true true)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= true (! false))"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| 2 0 3)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| 0 0 0)"), 0);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| false 'If this test passes, lazy evaluation has been implemented' (throwError))"), 'If this test passes, lazy evaluation has been implemented');
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(| 2 0 3 false true)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(| 2 0 3 false false)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(&& 1 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(+ 0 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(+ 1 2 3 -4)"), 3);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(- 1 2)"), -1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(- 1 2 8)"), -1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ 4 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ 0 2)"), 0);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 2 0) Infinity)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ -2 0) -Infinity)"), true);
});
 test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 0 0) NaN)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN NaN)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN (/ 0 0))"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN Infinity)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN \"dog\")"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN \"13\")"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 64 8) (/ 4 3))"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= null undefined)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== null undefined)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== true (! false))"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!= true false)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!== true (! false))"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!= true 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!== true 1)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 2 1)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 2)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 3 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 2)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 2 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 3 2)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? true 1 2)"), 1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? false 1 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? '' 1 2)"), 2);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? 'majigger' 1 2)"), 1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? true 1)"), 1);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 1 2)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 1)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 3)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 3 3)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 1 2)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 1)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 2)"), true);
});
[
    "(array 1 2 3 \"abc\")",
    [
        1,
        2,
        3,
        "abc"
    ]
],
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(concat \"a\" \"b\" \"c\")"), "abc");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 2 7 \"Hello World\")"), "llo W");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 1 \"Hello World\")"), "ello World");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice \"Hello World\")"), "Hello World");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 1 2 (array 1 2 3))"), [2]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 1 (array 1 2 3))"), [2, 3]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice (array 1 2 3))"), [1, 2, 3]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(format 'hello {0}' 'world')"), "hello world");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(filter (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})"), [{"prop":5},{"prop":5}]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(findOne (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})"), {"prop":5});
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(sort (array 7 2 3 5 6 4) {a b (- a b)})"), [2,3,4,5,6,7]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(sort (array (object 'prop' 6)(object 'prop' 7)(object 'prop' 5)) {a b (- a.prop b.prop)})"), [{"prop":5},{"prop":6},{"prop":7}]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'WAT')"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'hello')"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'Hello')"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains true 'Hello World' 'hello')"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains false 'Hello World' 'hello')"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(charAt 'things')"), 't');
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(charAt 'things' 4)"), 'g');
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last (array 1 2 3 \"abc\"))"), "abc");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last (filter [/somthing/empty] {item (= item 'foo')}))"), undefined);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(object \"key\" \"value\")"), {"key": "value"});
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date)"), new Date().toISOString() + ' - Or there about...');
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date 123 123 123)"), null);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date 1355745289462)"), "2012-12-17T11:54:49.462Z");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date.addDays (date 1355745289462) 7)"), "2012-12-24T11:54:49.462Z");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date.addDays (date 1355745289462) -7)"), "2012-12-10T11:54:49.462Z");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(max 1 5 3 4 2)"), 5);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("()"), '[[ERROR]]');
});
[
    "[model/array]",
    [
        1,
        2,
        3
    ]
],
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last [model/array])"), 3);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(length [model/array])"), 3);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(length \"string\")"), 6);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(max [model/prop] 10)"), 15);
});
[
    "(concat [model/prop] \" good sir\")"

],
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(concat (toString [model/prop]) \" good sir\")"), "15 good sir");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(join \"\" [model/prop] \" good sir\")"), "15 good sir");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(! (&& [model/prop] [model/prop2]))"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ [model/prop] [model/prop2])"), 1.5);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 10 [model/prop2])"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= (object) [model/empty])"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= [model/prop])"), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= (+ 10 15.5) (concat \"25\" \".5\"))"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 1 2 3) =)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 5 3) (array 1 5 3) (array 1 5 3) (array 1 5 3) =)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 4 5 6) (array 1 2 3) =)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (+ 10 15.5) (concat \"25\" \".5\"))"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(refine true (object 'stuff' 1 'things' 2 'majigger' 3) 'stuff' 'things')"), {majigger:3});
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(fromJSON '{\"hello\":[\"world\"]}')"), {"hello":["world"]});
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (< 1 (length(filter item {item (= item 2)})))})"), [[2,2,3]]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (= 1 (length(filter item {item (= item 2)})))})"), [[1,2,3]]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(object 'thing' 5).thing"), 5);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(filter (array 1 2 3 4 5 4 3 2 1)  {item (= item 2)} )"), [2,2]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(demoFunc)"), 123456);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(demoFunc"), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(demoFunc}"), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("demoFunc}"), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("demoFunc"), "function () { return 123456; }");
});
[
    "Zomg wtf is this shit"
],
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"not a well formed\" string\""), "[[ERROR]]");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray (partial concat 'world '))"), ["world a","world b","world c"]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray {string (concat 'world ' string)})"), ["world a","world b","world c"]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray (compose length (partial concat 'world ')))"), [7,7,7]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray {item (length (concat 'world ' item))})"), [7,7,7]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray (compose length (partial (flip concat) 'world ')))"), "I honestly don't know");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(map anArray {item (length (concat item 'world '))})"), [7,7,7]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(pairs (object 'hello' 'world'))"), [['hello','world']]);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(flatten (pairs (object 'hello' 'world')))"), ['hello','world']);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(fold anOtherArray 0 +)"), 6);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 2 3 4) <)"), true);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 2 3 4) >)"), false);
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(getValue anArray '1')"), "b");
});
test('description', function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(apply | anArray)"), "c");
});