var test = require('tape'),
    Gel = require('../gel.js'),
    gel = new Gel();

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
            // slice off []
            path = path.slice(1,-1);
            var index = path.indexOf("model/");
            if (index >= 0) {
                path = path.substring(index + 6);
            }
            return this[path];
        }
    }
};



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
test('(last (filter [/somthing/empty] {item (= item "foo")}))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), undefined);
  t.end();
});
test('(first (array 1 2 3 "abc"))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1);
  t.end();
});
test('(first (filter [/somthing/empty] {item (= item "foo")}))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), undefined);
  t.end();
});
test('(object "key" "value")', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate(t.name, context), {"key": "value"});
  t.end();
});
test('(date)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context).toString(), new Date().toString());
  t.end();
});
test('(date 123 123 123)', function (t) {
  t.plan(1);
  t.equal(isNaN(gel.evaluate(t.name, context).getTime()), true);
  t.end();
});
test('(date 1355745289462)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context).toString(), "Mon Dec 17 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
  t.end();
});
test('(date.addDays (date 1355745289462) 7)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context).toString(), "Mon Dec 24 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
  t.end();
});
test('(date.addDays (date 1355745289462) -7)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context).toString(), "Mon Dec 10 2012 21:54:49 GMT+1000 (E. Australia Standard Time)");
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
test('[model/array]', function (t) {
  t.plan(1);
  t.deepEqual(gel.evaluate('[model/array]'),[
        1,
        2,
        3
    ]);
  t.end();
});
test('(last [model/array])', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 3);
  t.end();
});
test('(length [model/array])', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 3);
  t.end();
});
test('(length "string")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 6);
  t.end();
});
test('(max [model/prop] 10)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 15);
  t.end();
});
test('(toString 5)', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "5");
  t.end();
});
test('(join "" [model/prop] " good sir")', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), "15 good sir");
  t.end();
});
test('(! (&& [model/prop] [model/prop2]))', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('(/ [model/prop] [model/prop2])', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), 1.5);
  t.end();
});
test('(= 10 [model/prop2])', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), true);
  t.end();
});
test('(= (object) [model/empty])', function (t) {
  t.plan(1);
  t.equal(gel.evaluate(t.name, context), false);
  t.end();
});
test('description', function (t) {
  t.plan(1);
  t.throws(function(){
	gel.evaluate("(= [model/prop])");
  });
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