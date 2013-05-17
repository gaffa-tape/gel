var test = require('tape');
var Gel = require('../gel.js');


var gel = new Gel();

// Add a custom gel function
gel.scope["demoFunc"] = function() {
    return 123456;
};

gel.scope["throwError"] = function() {
    throw "error";
};

// Add a custom token converter
gel.tokenConverters.push({
    precedence:5,
    tokenise:function(substring){
        if (substring.charAt(0) === '[') {
            var index = 1;
                
            do {
                if (
                    (substring.charAt(index) === '\\' && substring.charAt(index + 1) === '\\') || // escaped escapes
                    (substring.charAt(index) === '\\' && (substring.charAt(index + 1) === '[' || substring.charAt(index + 1) === ']')) //escaped braces
                ) {
                    index++;
                }
                else if(substring.charAt(index) === ']'){                        
                    var original = substring.slice(0, index+1);
                    
                    return new Gel.Token(
                        this,
                        original,
                        original.length
                    );
                }
                index++;
            } while (index < substring.length);
        }
    },
    evaluate: function(){
        this.result = gaffa.model.get(this.original, gaffa.model.get.context, true);
    }
});

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

var gaffa =  {
    model : {
        array : [1, 2, 3],
        prop : 15,
        prop2 : 10,
        empty: {},
        get: function (path) {
            // slice of []
            path = path.slice(1,-1);
            var index = path.indexOf("model/");
            if (index >= 0) {
                path = path.substring(index + 6);
            }
            return this[path];
        }
    }
};



test("1", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("1", context), 1);
});
test("-2", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("-2", context), -2);
});
test("2.4e9", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("2.4e9", context), 2400000000);
});
test("1.0E-3", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("1.0E-3", context), 0.001);
});
test("\"a\"", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"a\"", context), "a");
});
test("'a'", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'a'", context), "a");
});
test("'\"a\"'", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\"a\"'", context), "\"a\"");
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
	gel.evaluate("'''")
  });
});
test("'\\''", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\\''", context), "'");
});
test("\"\\\"\\\"\"", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"\\\"\\\"\"", context), "\"\"");
});
test("\"\\\"Hello\\\" \\\"World\\\"\"", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("\"\\\"Hello\\\" \\\"World\\\"\"", context), "\"Hello\" \"World\"");
});
test("'\"Hello\" \"World\"'", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("'\"Hello\" \"World\"'", context), "\"Hello\" \"World\"");
});
test("true", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("true", context), true);
});
test("false", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("false", context), false);
});
test("null", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("null", context), null);
});
test("undefined", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("undefined", context), undefined);
});
test("(|| trueStartingIdentifier 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| trueStartingIdentifier 2)", context), 2);
});
test("(= 1 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 1 1)", context), true);
});
test("(= 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 1 2)", context), false);
});
test("(! false)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(! false)", context), true);
});
test("(= true true)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= true true)", context), true);
});
test("(= true (! false))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= true (! false))", context), true);
});
test("(|| 2 0 3)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| 2 0 3)", context), 2);
});
test("(|| 0 0 0)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| 0 0 0)", context), 0);
});
test("(|| false 'If this test passes, lazy evaluation has been implemented' (throwError))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(|| false 'If this test passes, lazy evaluation has been implemented' (throwError))", context), 'If this test passes, lazy evaluation has been implemented');
});
test("(| 2 0 3 false true)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(| 2 0 3 false true)", context), true);
});
test("(| 2 0 3 false false)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(| 2 0 3 false false)", context), false);
});
test("(&& 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(&& 1 2)", context), 2);
});
test("(+ 0 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(+ 0 2)", context), 2);
});
test("(+ 1 2 3 -4)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(+ 1 2 3 -4)", context), 3);
});
test("(- 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(- 1 2)", context), -1);
});
test("(- 1 2 8)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(- 1 2 8)", context), -1);
});
test("(/ 4 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ 4 2)", context), 2);
});
test("(/ 0 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ 0 2)", context), 0);
});
test("(== (/ 2 0) Infinity)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 2 0) Infinity)", context), true);
});
test("(== (/ -2 0) -Infinity)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ -2 0) -Infinity)", context), true);
});
 test("(== (/ 0 0) NaN)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 0 0) NaN)", context), false);
});
test("(isNaN NaN)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN NaN)", context), true);
});
test("(isNaN (/ 0 0))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN (/ 0 0))", context), true);
});
test("(isNaN Infinity)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN Infinity)", context), false);
});
test("(isNaN)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN)", context), true);
});
test("(isNaN \"dog\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN \"dog\")", context), true);
});
test("(isNaN \"13\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(isNaN \"13\")", context), false);
});
test("(== (/ 64 8) (/ 4 3))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (/ 64 8) (/ 4 3))", context), false);
});
test("(= null undefined)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= null undefined)", context), true);
});
test("(== null undefined)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== null undefined)", context), false);
});
test("(== true (! false))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== true (! false))", context), true);
});
test("(!= true false)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!= true false)", context), true);
});
test("(!== true (! false))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!== true (! false))", context), false);
});
test("(!= true 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!= true 1)", context), false);
});
test("(!== true 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(!== true 1)", context), true);
});
test("(> 1 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 1)", context), false);
});
test("(> 2 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 2 1)", context), true);
});
test("(> 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 2)", context), false);
});
test("(> 3 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 3 2)", context), true);
});
test("(> 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(> 1 2)", context), false);
});
test("(< 1 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 1)", context), false);
});
test("(< 2 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 2 1)", context), false);
});
test("(< 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 2)", context), true);
});
test("(< 3 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 3 2)", context), false);
});
test("(< 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(< 1 2)", context), true);
});
test("(? true 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? true 1 2)", context), 1);
});
test("(? false 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? false 1 2)", context), 2);
});
test("(? '' 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? '' 1 2)", context), 2);
});
test("(? 'majigger' 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? 'majigger' 1 2)", context), 1);
});
test("(? true 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(? true 1)", context), 1);
});
test("(>= 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 1 2)", context), false);
});
test("(>= 2 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 2)", context), true);
});
test("(>= 2 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 1)", context), true);
});
test("(>= 2 3)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 2 3)", context), false);
});
test("(>= 3 3)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(>= 3 3)", context), true);
});
test("(<= 2 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 1)", context), false);
});
test("(<= 2 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 2)", context), true);
});
test("(<= 1 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 1 2)", context), true);
});
test("(<= 2 1)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 1)", context), false);
});
test("(<= 2 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(<= 2 2)", context), true);
});
test("(array 1 2 3 \"abc\")", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(array 1 2 3 \"abc\")", context), [
        1,
        2,
        3,
        "abc"
    ]);
});
test("(concat \"a\" \"b\" \"c\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(concat \"a\" \"b\" \"c\")", context), "abc");
});
test("(slice 2 7 \"Hello World\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 2 7 \"Hello World\")", context), "llo W");
});
test("(slice 1 \"Hello World\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice 1 \"Hello World\")", context), "ello World");
});
test("(slice \"Hello World\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(slice \"Hello World\")", context), "Hello World");
});
test("(slice 1 2 (array 1 2 3))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(slice 1 2 (array 1 2 3))", context), [2]);
});
test("(slice 1 (array 1 2 3))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(slice 1 (array 1 2 3))", context), [2, 3]);
});
test("(slice (array 1 2 3))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(slice (array 1 2 3))", context), [1, 2, 3]);
});
test("(split 'hello world' ' ')", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(split 'hello world' ' ')", context)[1], "world");
});
test("(format 'hello {0}' 'world')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(format 'hello {0}' 'world')", context), "hello world");
});
test("(format 'hello {0}' undefined)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(format 'hello {0}' undefined)", context), "hello ");
});
test("(filter (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(filter (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})", context), [{"prop":5},{"prop":5}]);
});
test("(findOne (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(findOne (array (object 'prop' 5)(object 'prop' 6)(object 'prop' 5)(object 'prop' 'WAT')) {item (= item.prop 5)})", context), {"prop":5});
});
test("(sort (array 7 2 3 5 6 4) {a b (- a b)})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(sort (array 7 2 3 5 6 4) {a b (- a b)})", context), [2,3,4,5,6,7]);
});
test("(sort (array (object 'prop' 6)(object 'prop' 7)(object 'prop' 5)) {a b (- a.prop b.prop)})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(sort (array (object 'prop' 6)(object 'prop' 7)(object 'prop' 5)) {a b (- a.prop b.prop)})", context), [{"prop":5},{"prop":6},{"prop":7}]);
});
test("(contains 'Hello World' 'WAT')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'WAT')", context), false);
});
test("(contains 'Hello World' 'hello')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'hello')", context), true);
});
test("(contains 'Hello World' 'Hello')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains 'Hello World' 'Hello')", context), true);
});
test("(contains true 'Hello World' 'hello')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains true 'Hello World' 'hello')", context), false);
});
test("(contains false 'Hello World' 'hello')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(contains false 'Hello World' 'hello')", context), true);
});
test("(charAt 'things')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(charAt 'things')", context), 't');
});
test("(charAt 'things' 4)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(charAt 'things' 4)", context), 'g');
});
test("(last (array 1 2 3 \"abc\"))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last (array 1 2 3 \"abc\"))", context), "abc");
});
test("(last (filter [/somthing/empty] {item (= item 'foo')}))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last (filter [/somthing/empty] {item (= item 'foo')}))", context), undefined);
});
test("(object \"key\" \"value\")", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(object \"key\" \"value\")", context), {"key": "value"});
});
test("(date)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date)", context).toString(), new Date().toString());
});
test("(date 123 123 123)", function (t) {
  t.plan(1);
  t.equal(isNaN(gel.evaluate("(date 123 123 123)", context).getTime()), true);
});
test("(date 1355745289462)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date 1355745289462)", context).toString(), "Mon Dec 17 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
});
test("(date.addDays (date 1355745289462) 7)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date.addDays (date 1355745289462) 7)", context).toString(), "Mon Dec 24 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
});
test("(date.addDays (date 1355745289462) -7)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(date.addDays (date 1355745289462) -7)", context).toString(), "Mon Dec 10 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
});
test("(max 1 5 3 4 2)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(max 1 5 3 4 2)", context), 5);
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
	gel.evaluate("()");
  }, "Unclosed single quoted string");
});
test("[model/array]", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("[model/array]"),[
        1,
        2,
        3
    ]);
});
test("(last [model/array])", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(last [model/array])", context), 3);
});
test("(length [model/array])", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(length [model/array])", context), 3);
});
test("(length \"string\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(length \"string\")", context), 6);
});
test("(max [model/prop] 10)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(max [model/prop] 10)", context), 15);
});
test("(toString 5)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(toString 5)", context), "5");
});
test("(concat (toString [model/prop]) \" good sir\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(concat (toString [model/prop]) \" good sir\")", context), "15 good sir");
});
test("(join \"\" [model/prop] \" good sir\")", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(join \"\" [model/prop] \" good sir\")", context), "15 good sir");
});
test("(! (&& [model/prop] [model/prop2]))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(! (&& [model/prop] [model/prop2]))", context), false);
});
test("(/ [model/prop] [model/prop2])", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(/ [model/prop] [model/prop2])", context), 1.5);
});
test("(= 10 [model/prop2])", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= 10 [model/prop2])", context), true);
});
test("(= (object) [model/empty])", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= (object) [model/empty])", context), false);
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
	gel.evaluate("(= [model/prop])")
  });
});
test("(= (+ 10 15.5) (concat \"25\" \".5\"))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(= (+ 10 15.5) (concat \"25\" \".5\"))", context), true);
});
test("(compare (array 1 2 3) (array 1 2 3) =)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 1 2 3) =)", context), true);
});
test("(compare (array 1 5 3) (array 1 5 3) (array 1 5 3) (array 1 5 3) =)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 5 3) (array 1 5 3) (array 1 5 3) (array 1 5 3) =)", context), true);
});
test("(compare (array 4 5 6) (array 1 2 3) =)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 4 5 6) (array 1 2 3) =)", context), false);
});
test("(== (+ 10 15.5) (concat \"25\" \".5\"))", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(== (+ 10 15.5) (concat \"25\" \".5\"))", context), false);
});
test("(refine true (object 'stuff' 1 'things' 2 'majigger' 3) 'stuff' 'things')", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(refine true (object 'stuff' 1 'things' 2 'majigger' 3) 'stuff' 'things')", context), {majigger:3});
});
test("(fromJSON '{\"hello\":[\"world\"]}')", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(fromJSON '{\"hello\":[\"world\"]}')", context), {"hello":["world"]});
});
test("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (< 1 (length(filter item {item (= item 2)})))})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (< 1 (length(filter item {item (= item 2)})))})", context), [[2,2,3]]);
});
test("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (= 1 (length(filter item {item (= item 2)})))})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(filter (array (array 1 2 3)(array 1 4 3)(array 2 2 3)){item (= 1 (length(filter item {item (= item 2)})))})", context), [[1,2,3]]);
});
test("(object 'thing' 5).thing", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(object 'thing' 5).thing", context), 5);
});
test("(filter (array 1 2 3 4 5 4 3 2 1)  {item (= item 2)} )", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(filter (array 1 2 3 4 5 4 3 2 1)  {item (= item 2)} )", context), [2,2]);
});
test("(demoFunc)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(demoFunc)", context), 123456);
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
	gel.evaluate("(demoFunc")
  }, "error");
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("(demoFunc}")
  }, "error");
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("demoFunc}")
  }, "error");
});
test("demoFunc", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("demoFunc", context).toString(), "function () {\r\n    return 123456;\r\n}");
});

test("Zomfg wtf is this shit", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("Zomfg wtf is this shit", context), undefined);
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
    gel.evaluate("\"not a well formed\" string\"")
  }, "error");
});
test("(map anArray (partial concat 'world '))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(map anArray (partial concat 'world '))", context), ["world a","world b","world c"]);
});
test("(map anArray {string (concat 'world ' string)})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(map anArray {string (concat 'world ' string)})", context), ["world a","world b","world c"]);
});
test("(map anArray (compose length (partial concat 'world ')))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(map anArray (compose length (partial concat 'world ')))", context), [7,7,7]);
});
test("(map anArray {item (length (concat 'world ' item))})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(map anArray {item (length (concat 'world ' item))})", context), [7,7,7]);
});
test("(map anArray {item (length (concat item 'world '))})", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(map anArray {item (length (concat item 'world '))})", context), [7,7,7]);
});
test("(pairs (object 'hello' 'world'))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(pairs (object 'hello' 'world'))", context), [['hello','world']]);
});
test("(flatten (pairs (object 'hello' 'world')))", function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate("(flatten (pairs (object 'hello' 'world')))", context), ['hello','world']);
});
test("(fold anOtherArray 0 +)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(fold anOtherArray 0 +)", context), 6);
});
test("(compare (array 1 2 3) (array 2 3 4) <)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 2 3 4) <)", context), true);
});
test("(compare (array 1 2 3) (array 2 3 4) >)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(compare (array 1 2 3) (array 2 3 4) >)", context), false);
});
test("(getValue anArray '1')", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(getValue anArray '1')", context), "b");
});
test("(apply | anArray)", function (t) {
  t.plan(1);
  t.equal(gel.evaluate("(apply | anArray)", context), "c");
});