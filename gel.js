//Copyright (C) 2012 Anthony Truskinger & Kory Nunn 

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(function(undefined) {
    "use strict";

    // Global Object instantiation
    var gel = window.gel = window.gel || newGel(),
		console = window.console || function(){};

    function newGel() {

        function Gel() {
            
            

            /**   GENERAL HELPER FUNCTIONS   **/
            
            function arrayWhere(array, predicate) {
                var results = [],
                    len = array.length,
                    i = 0;
                
                while (i < len) {
                    var item = array[i++];
                    predicate(item, i - 1, array) && results.push(item);
                }
                
                return results;
            };
            
            function itemsEach(args, callback) {
                    for (var i = 0; i < args.length; i++) {
                        if (callback(args[i], i, args)) break;
                    }
                    return args;
            };
            
            function first(args, callback) {
                    var value;
                    for (var i = 0; i < args.length; i++) {
                        value = callback(args[i], i, args);
                        if (value !== undefined) break;
                    }
                    return value;
            };
            
            

            /**    INTERNALS   **/
            
            var strings = {
                UnknownFunction: "Function is undefined in  given expression: {0}. (add it to the gel.functions object)",
                UnparseableToken: "Unable to determine next token in expression: ",
                BadNesting: "Invalid nesting. Un-opened {1} encountered at character:{0}.",//:{0}, {1} {2},
                BadStringTerminals: "Unmatched string terminals (the \" things)",
                UnknownIdentifier: "An unknown identifier ({0}) has been encountered (it did not resolve to a function or variable). If it is meant to be a function add it to the gel.functions object."

            };
            
            var reservedkeywords = ["true", "false", "NaN", "-NaN", "Infinity", "-Infinity", "null", "undefined"];
            
            var knownTokens = {
                subExpression: "subExpression",
                empty: "void",
                delimitter: "delimitter",
                identifier: "identifier",
                period: "period"
                
            };

            function tokenResult(value, index, type, callback) {
                    return {
                        value: value,
                        index: index,
                        type: type,
                        callback: callback
                    };
                }
                
            function nestedTokenResult(value, index, type, nestStarted, nestEnded, name) {
                    var result = tokenResult(value, index, type);
                    result.nestStarted = nestStarted;
                    result.nestEnded = nestEnded;
                    result.subExpressionType = name;
                    return result;
                }
                
            function nestingToken(expression, openNest, closeNest, name) {
                    // optimise for empty nest
                    var emptyNest = openNest + closeNest;
                    if (expression.slice(0, emptyNest.length) === emptyNest) {
                        return tokenResult(undefined, emptyNest.length, knownTokens.empty);
                    }

                    // case for opening
                    if (expression.slice(0, openNest.length) === openNest) {
                        var startResult = nestedTokenResult(openNest, openNest.length, knownTokens.subExpression, true, undefined, name);
                        return startResult;
                    }

                    // case for closing
                    if (expression.slice(0, closeNest.length) === closeNest) {
                        var endResult = nestedTokenResult(closeNest, closeNest.length, knownTokens.subExpression, undefined, true, name);
                        return endResult;
                    }
                }
                
            function detectString(expression, stringTerminal, stringType) {
                if (expression.charAt(0) === stringTerminal) {
                    var index = 0,
                    escapes = 0;
                           
                    while (expression.charAt(++index) !== stringTerminal)
                    {
                           if(index >= expression.length){
                                   throw "Unclosed "+ stringType + " string";
                           }
                           if (expression.charAt(index) === '\\' && expression.charAt(index+1) === stringTerminal) {
                                   expression = expression.slice(0, index) + expression.slice(index + 1);
                                   escapes++;
                           }
                    } 

                    return {
                           value: expression.slice(1, index),
                           index: index + escapes + 1
                    };
                }
            }
              
            function getProperty(object, propertiesString) {
                var properties = propertiesString.split(".").reverse();
                while (properties.length) {
                    var nextProp = properties.pop();
                    if (object[nextProp] !== undefined && object[nextProp] !== null) {
                        object = object[nextProp];
                    } else {
                        return;
                    }
                }
                return object;
            }
              
              
                

            /**    EXPORTS   **/
			
            this.tokenResult = tokenResult;
            
            this.tokenConverters = {
                nests: {
                    "parentheses": function convertParenthesisToken(substring) {
                        return nestingToken(substring, "(", ")", "parantheses");
                    },
                    "function": function convertBracesToken(substring) {
                        return nestingToken(substring, "{", "}", "function");
                    }
                },
                primitives: {
                    "delimitter": function convertDelimitterToken(substring) {
                        var i = 0;
                        while (i < substring.length && substring.charAt(i).trim() === "") {
                            i++;
                        }
                
                        if (i) return tokenResult(substring.slice(0, i), i, knownTokens.delimitter);
                    },
                    "string": function convertStringToken(expression) {
                        return detectString(expression, '"', "double quoted");
                    },
                    "singleQuoteString": function convertStringToken(expression) {
                        return detectString(expression, "'", "single quoted");
                    },
                    "number": function convertNumberToken(expression) {
                        var specials = {
                            "NaN": Number.NaN,
                            "-NaN": Number.NaN,
                            "Infinity": Infinity,
                            "-Infinity": -Infinity
                        };
                        for (var key in specials) {
                            if (expression.slice(0, key.length) === key) {
                                return tokenResult(specials[key], key.length);
                            }
                        }
                
                        var valids = "0123456789-.Eex",
                            index = 0;
                            
                        while (valids.indexOf(expression.charAt(index)||null) >= 0 && ++index) {}
                
                        if (index > 0) {
                            var result = parseFloat(expression.slice(0, index));
                            if(isNaN(result)){
                                return;
                            }
                            return tokenResult(result, index);
                        }
                
                        return;
                
                    },
                
                    "boolean": function convertBooleanToken(expression) {
                        if (expression.slice(0, 4) === "true") {
                            return tokenResult(true, 4);
                        }
                        else if (expression.slice(0, 5) === "false") {
                            return tokenResult(false, 5);
                        }
                
                        return;
                    },
                    "null": function convertNullToken(expression) {
                        var nullConst = "null";
                        if (expression.slice(0, nullConst.length) === nullConst) return tokenResult(null, nullConst.length);
                        return;
                    },
                    "undefined": function convertUndefinedToken(expression) {
                        var undefinedConst = "undefined";
                        if (expression.slice(0, undefinedConst.length) === undefinedConst) return tokenResult(undefined, undefinedConst.length);
                        return;
                    }
                
                },
                others: {
                    "identifier": function convertIndentifierToken(expression) {
                        // searches for valid identifiers or operators
                        //operators
                        var operators = "!=<>/&|*%-^?+\\",
                            index = 0;
                            
                        while (operators.indexOf(expression.charAt(index)||null) >= 0 && ++index) {}
                
                        if (index > 0) {
                            return tokenResult(expression.slice(0, index), index, knownTokens.identifier);
                        }
                
                        // identifiers (ascii only)
                        //http://www.geekality.net/2011/08/03/valid-javascript-identifier/
                        //https://github.com/mathiasbynens/mothereff.in/tree/master/js-variables
                        var valid = /^[$A-Z_][0-9A-Z_$]*/i;
                
                        var possibleidentifier = valid.exec(expression);
                        if (possibleidentifier && possibleidentifier.index === 0) {
                            var match = possibleidentifier[0];
                
                            if (reservedkeywords.indexOf(match) >= 0) {
                                return;
                            }
                
                            return tokenResult(match, match.length, knownTokens.identifier);
                        }
                    },
                    "period": function convertPeriodToken(expression) {
                        var periodConst = ".";
                        if (expression.charAt(0) === periodConst) return tokenResult(".", periodConst.length, knownTokens.period);
                        return;
                    }
                }
            // end token converters
            };
            
            
            this.functions = {
                "=": function equals() {
                    // test equality (args:2+)
                    // (supports truthy/falsey)
                    var argsLength = arguments.length;
                    if (argsLength <= 1) throw "equals function needs more than one argument";
                    for (var i = 1; i < argsLength; i++) {
                        if (arguments[i] != arguments[i - 1]) return false;
                    }
                    return true;
                },
                "==": function equalsStrict() {
                    // test strict equality (args:2+)
                    var argsLength = arguments.length;
                    if (argsLength <= 1) throw "equals function needs more than one argument";
                    for (var i = 1; i < argsLength; i++) {
                        if (arguments[i] !== arguments[i - 1]) return false;
                    }
                    return true;
                },
                "!": function not() {
                    // test not inequality
                    // (supports truthy/falsey, and single or n-length arguments)
                    var argsLength = arguments.length;
                    if (argsLength > 1) {
                        for (var i = 1; i < argsLength; i++) {
                            if (arguments[i] == arguments[i - 1]) return false;
                        }
                        return true;
                    }
                    else {
                        return !(arguments[0]);
                    }
                },
                "!=": function notEquals() {
                    // test truthy inequality (args:2+)
                    var argsLength = arguments.length;
                    if (argsLength <= 1) throw "equals function needs more than one argument";
                    for (var i = 1; i < argsLength; i++) {
                        if (arguments[i] == arguments[i - 1]) return false;
                    }
                    return true;
                },
                "!==": function notEqualsStrict() {
                    // test strict inequality (args:2+)
                    var argsLength = arguments.length;
                    if (argsLength <= 1) throw "equals function needs more than one argument";
                    for (var i = 1; i < argsLength; i++) {
                        if (arguments[i] === arguments[i - 1]) return false;
                    }
                    return true;
                },
                ">": function greaterThen() {
                    // test strict inequality (args:2+)
                    var argsLength = arguments.length,
                        result = false;
                    if (argsLength <= 1) throw "greater than function needs more than one argument";
                    for (var i = 0; i < argsLength-1; i++) {
                        result = arguments[i] > arguments[i+1];
                        if(!result){
                            break;
                        }
                    }
                    return result;
                },
                "<": function lessThen() {
                    // test strict inequality (args:2+)
                    var argsLength = arguments.length,
                        result = false;
                    if (argsLength <= 1) throw "greater than function needs more than one argument";
                    for (var i = 0; i < argsLength-1; i++) {
                        result = arguments[i] < arguments[i+1];
                        if(!result){
                            break;
                        }
                    }
                    return result;
                },
                "&": function andStrict() {
                    // does a strict "and", only accept true/false values
                    var argsLength = arguments.length;
                    if (argsLength > 1) {
                        for (var i = 1; i < argsLength; i++) {
                            if (!(arguments[i] === true && arguments[i - 1] === true)) return false;
                        }
                        return true;
                    }
                    else {
                        return argsLength === true;
                    }
                },
                "&&": function andTruthy() {
                    // does a truthy "and", like the JS "&&"
                    var argsLength = arguments.length;
                    for (var i = 1; i < argsLength; i++) {
                        if (!(arguments[i] && arguments[i - 1])) return false;
                    }
                    return arguments[argsLength - 1];
                },
                "|": function orStrict() {
                    // does a strict "or", only accept true/false values
                    var argsLength = arguments.length;
                    if (argsLength > 1) {
                        for (var i = 1; i < argsLength; i++) {
                            if (!(arguments[i] === true || arguments[i - 1] === true)) return false;
                        }
                        return true;
                    }
                    else {
                        return argsLength === true;
                    }
                },
                "||": function orTruthy() {
                    // does a truthy "or", like the JS "||"
                    var argsLength = arguments.length,
                        last = arguments[0];
                        
                    if(argsLength){
                        for (var i = 0; i < argsLength - 1; i++) {
                            last = arguments[i] || arguments[i + 1];
                        }
                    }
                    return last;
                },
                "+": function add() {
                    // add all arguments (force numbers) (args:0+)
                    var sum = 0;
                    itemsEach(arguments, function(value) {
                        sum += !isNaN(value) && parseFloat(value);
                    });

                    return sum;
                },
                "*": function product() {
                    // multiply all arguments (force numbers) (args:0+)
                    var total = 1;
                    itemsEach(arguments, function(value) {
                        total *= !isNaN(value) && parseFloat(value);
                    });

                    return total;
                },
                "/": function quotient() {
                    // divide all arguments (force numbers) (args:0+)
                    var total;
                    itemsEach(arguments, function(value) {
                        var number = !isNaN(value) && parseFloat(value);
                        if (total === undefined) {
                            total = number;
                        }
                        else {
                            total = total / number;
                        }
                    });

                    return total;
                },
                "isNaN": function testNaN(){
                    // tests if all input values are NaN (args:0+)
                    var argsLength = arguments.length;
                    switch (argsLength) {
                        case 0: return true;
                        case 1: return isNaN(arguments[0]);
                        default:
                            for (var i = 0; i < argsLength; i++) {
                            if (! isNaN(arguments[i])) return false;
                        }
                        return true;
                    }
                },                
                "concat": function concat() {
                    // concat all arguments (force strings) (args:0+)
                    var result = "";
                    itemsEach(arguments, function(value) {
                        result = result.concat(value);
                    });
                    return result;
                },
                "array": function makeArray() {
                    // turn arguments into proper array (args:0+)
                    var result = [];
                    for (var index = 0; index < arguments.length; index++) {
                        result[index] = arguments[index];
                    }
                    return result;
                },
                "remove": function remove() {
                    // remove arguments (args[0..last-1]) from supplied array (args[last])
                    // uses truthy equality
                    var argsLength = arguments.length,
                        outerArgs = arguments;
                    var old = arguments[argsLength - 1];

                    old = old.filter(function(value) {
                        for (var index = 0; index < argsLength - 1; index++) {
                            var argN = outerArgs[index];
                            if (argN == value) return false;
                        }

                        return true;
                    });

                    return old;
                },
                "slice": function slice() {
                    // does a slice
                    var argsLength = arguments.length;
                    if (argsLength > 3 || argsLength === 0) throw "Slice function recieved wrong number of arguments. Excpected [1,3] given:" + arguments;

                    var item, start, end;
                    switch (argsLength) {
                    case 3:
                        item = arguments[2];
                        end = arguments[1];
                        start = arguments[0];
                        break;
                    case 2:
                        item = arguments[1];
                        start = arguments[0];
                        break;
                    case 1:
                        item = arguments[0];
                        break;
                    }

                    if (item === undefined) return;

                    return item.slice(start, end);

                },
                "last": function last() {
                    // get the last argument from the array (args:==1)
                    // will work on any item that defines ".length"

                    if (arguments.length > 1) {
                        throw "last function does not support more than one argument";
                    }

                    var firstArg = arguments[0];
                    if (arguments.length && typeof firstArg === "object" || typeof firstArg === "string") {
                        return firstArg[firstArg.length - 1];
                    }
                    else {
                        throw "parameter was not an object";
                    }
                },
                "filterKeys": function filterKeys() {
                    var args = Array.prototype.slice.call(arguments),
                        filteredObject;
                    if (args.length < 2) {
                        return args;
                    }
                    
                    var objectToFilter = args[0];
                    var functionToCompare = args[1];                    
                    
                    if (objectToFilter && typeof objectToFilter === "object") {
                        if(Array.isArray(objectToFilter)){
                            filteredObject = [];
                        }else{
                            if(objectToFilter.prototype){
                                filteredObject = new objectToFilter.prototype.constructor();
                            }else{
                                filteredObject = {};
                            }
                        }
                    
                        for(var key in objectToFilter){
                            var item = objectToFilter[key];
                            if(Array.isArray(objectToFilter) && isNaN(key)){
                                continue;
                            }
                            if(typeof functionToCompare === "function"){
                                if(functionToCompare.call(this, item)){
                                    filteredObject[key] = item;
                                }
                            }else{
                                if(item === functionToCompare && item){
                                    filteredObject[key] = item;
                                }
                            }
                        }
                            
                        return filteredObject;
                    
                    }else {
                        return;
                    }
                },
                "filter": function filter() {
                    var args = Array.prototype.slice.call(arguments),
                        filteredList = [];
                    if (args.length < 2) {
                        return args;
                    }
                    
                    var array = args[0];
                    var functionToCompare = args[1];
                    
                    if (Array.isArray(array)) {
                        
                        itemsEach(array, function(item){
                            if(typeof functionToCompare === "function"){
                                functionToCompare.call(this, item) && filteredList.push(item);
                            }else{
                                item === functionToCompare && filteredList.push(item);
                            }
                        });
                            
                        return filteredList;
                    
                    }else {
                        return;
                    }
                },
                "sort": function sort() {
                    var args = Array.prototype.slice.call(arguments),
                        sortedList = [];
                    if (args.length < 2) {
                        return args;
                    }
                    
                    sortedList = args[0];
                    
                    var functionToCompare = args[1];
                    
                    if (Array.isArray(sortedList)) {
                    
                        sortedList = sortedList.slice();
                        
                        return sortedList.sort(functionToCompare);
                    
                    }else {
                        return;
                    }
                },
                "length": function length() {
                    // get the length of the first argument (args:==1)
                    // will work on any item that defines ".length"

                    if (arguments.length > 1) {
                        throw "length function does not support more than one argument";
                    }

                    var firstArg = arguments[0];
                    if (arguments.length && typeof firstArg === "object" || typeof firstArg === "string") {
                        return firstArg.length;
                    }
                    else {
                        throw "parameter was not an object";
                    }
                },
                "arrayEquals": function arrayEquals() {
                    // tests if all input items are equal (args:0+, type:array)
                    // note, does not do a reference equality check on given arrays
                    // does structural equality on the array,
                    // for each array item, JS truthy equality done (while compare references for objects)
                    if (arguments.length < 2) {
                        throw "arrayEquals did not recieve enough arguments, #args=" + arguments.length;
                    }

                    var firstLength;
                    var notequal = first(arguments, function(value) {
                        if (!value) {
                            return false;
                        }

                        if (!Array.isArray(value)) {
                            throw "Invalid argument given to arrayEquals:" + value.toString();
                        }

                        if (firstLength === undefined) {
                            firstLength = value.length;
                            return;
                        }
                        if (value.length !== firstLength) return false;
                    });
                    if (notequal === false) return false;

                    for (var arrayIndex = 0; arrayIndex < firstLength; arrayIndex++) {
                        var item = arguments[0][arrayIndex];
                        for (var argumentIndex = 1; argumentIndex < arguments.length; argumentIndex++) {
                            var itemN2 = arguments[argumentIndex][arrayIndex];

                            if (item != itemN2) {
                                return false;
                            }
                        }

                    }

                    return true;
                },
                "format": function format() {
                    var args = Array.prototype.slice.call(arguments);
                    
                    return (args.shift()).format(args);
                },
                "contains": function contains() {
                    var args = Array.prototype.slice.call(arguments),
                        target = args.shift(),
                        success = true,
                        strict = false;
                        
                    if(target == null){
                        return;
                    }
                        
                    if(typeof target === 'boolean'){
                        strict = target;
                        target = args.shift();
                    }
                    
                    if(!strict && typeof target === "string"){
                        target = target.toLowerCase();
                    }
                        
                    itemsEach(args, function(arg){
                        
                        if(!strict && typeof arg === "string"){
                            arg = arg.toLowerCase();
                        }
                        if(target.indexOf(arg)<0){
                            success = false;
                            return true;
                        }
                    });
                    return success;
                },				
                "replace": function format() {
                    var item = arguments[0],
						replaceTarget = arguments[1],
						replaceWith = arguments[2],
						lastIndex = -1,
						startIndex = item.indexOf(replaceTarget);
						
						
						while(startIndex>lastIndex){
							lastIndex = startIndex;
							item = item.slice(0, startIndex) + replaceWith + item.slice(startIndex + replaceTarget.length);
							startIndex = item.indexOf(replaceTarget);
						}
                    
                    return item;
                },
                "max": function max() {
                    // get the maximum value of the input items
                    // works on truthy, assumes primitive values
                    var result = arguments[0];
                    itemsEach(arguments, function(value) {
                        if (value > result) {
                            result = value;
                        }
                    });
                    return result;
                },
                "object": function makeObject() {
                    // make an object (args:0+)
                    var result = {};
                    var argsLength = arguments.length;
                    if ((argsLength % 2) !== 0) throw "object function needs an even number of arguments";

                    for (var i = 0; i < argsLength; i += 2) {
                        result[arguments[i]] = arguments[i+1];
                    }

                    return result;
                },
                "getValue": function getValue() {
                    var argsLength = arguments.length;
                    if (argsLength !== 2) throw "getValue function needs 2 arguments";

                    return arguments[0][arguments[1]];
                },
                "date": function() {
                    return Date();
                },
                "demoFunc": function() {
                    return 123456;
                },
                "fromJSON": function makeLambda() {
                    return JSON.parse(arguments[0]);
                },
                "toJSON": function makeLambda() {
                    return JSON.stringify(arguments[0]);
                }

            };
            
            // aliases
            // WARN: overwriting object equals func? possible major poo poo
            this.functions["equals"] = this.functions["="];
            this.functions["and"] = this.functions["&&"];
            this.functions["or"] = this.functions["||"];
            this.functions["not"] = this.functions["!"];
            
			

            /**    MAIN    **/
            
            var memoisedTokens = {};

            function tokenise(expression, inRecursion, typeOfNest) {
                var memoiseKey = expression;
                if(memoisedTokens[expression]){
                    return memoisedTokens[expression];
                }
                if(!expression){
                    return [];
                }
                // split expression parts into tokens, assumes no wrapping ( ) are included
                var originalExpression = expression;

                var tokens = [];
                var totalCharsProcessed = 0;
                var knownTokenConverters = [gel.tokenConverters.nests, gel.tokenConverters.primitives, gel.tokenConverters.others];
                

                do {
                    var previousLength = expression.length;
                    // for each registered token converter, see if we can get a real value
                    for (var tokenTypeIndex = 0; tokenTypeIndex < knownTokenConverters.length; tokenTypeIndex++) {
                        
                        var tokenConverterGroup = knownTokenConverters[tokenTypeIndex];
                        for (var tokenConverterKey in tokenConverterGroup) {
                            var result = tokenConverterGroup[tokenConverterKey](expression);
                            if (result) {
                                // TODO: maybe have exclude prop here? if(!result.exclude){
                                
                                if (result.nestEnded) {
                                    if (result.subExpressionType !== typeOfNest) {
                                        throw strings.BadNesting.format(totalCharsProcessed + 1, result.subExpressionType, typeOfNest);
                                    }
                    
                                    // [base case]
                                    return {
                                        value: tokens,
                                        index: totalCharsProcessed + result.index
                                    };
                                }
                    
                                if (result.nestStarted) {
                                    totalCharsProcessed += result.index;
                                    expression = expression.slice(result.index);
                                    // [recurse]
                                    var tokensFromSubExpression = tokenise(expression, true, result.subExpressionType);
                    
                                    result = {
                                        value: tokensFromSubExpression.value,
                                        index: tokensFromSubExpression.index,
                                        type: result.type
                                    };
                                }
                                
                                //Add the token name to the token.
                                result.tokenName = tokenConverterKey;
                                                                
                                //Add the original string to the token.
                                result.originalString = expression.slice(0, result.index);
                                
                                result.absoluteIndex = totalCharsProcessed;
                    
                                expression = expression.slice(result.index);
                                totalCharsProcessed += result.index;
                                
                                tokens.push(result);
                                
                                // exit both loops
                                tokenTypeIndex = knownTokenConverters.length;
                                break;
                            }
                        }
                    }

                    if (expression.length == previousLength) {
                        throw strings.UnparseableToken + expression;
                    }
                } while (expression);

                // This in an invalid way to exit this method. Recursion cases should only
                // exit through the nestEnded baseCase. This indicates one of the token 
                // converters has not reported the number of characters it processed correctly
                if (inRecursion) {
                    throw "Invalid nesting in " + originalExpression;
                }
                
                memoisedTokens[memoiseKey] = tokens;
                
                return tokens;
            }
            
            //strip delimiters, we won't ever care about them...
            // poor delimiters... no one loves them :(
            function stripDelimiters(tokens){
                return arrayWhere(tokens, function(item) {
                    return item.type !== knownTokens.delimitter;
                });
            }
			
			
			
			function evaluateSubExpressionToken(token, tokens, partIndex, scopedVariables){
				// [recursion] - evaluate nesting
				if(token.tokenName === "function"){
				
					token.value = stripDelimiters(token.value);
				
					//do not modify token.value as it is used for each itteration.
					var functionToRun = token.value[token.value.length-1];
					
					var argumentsToPassAsVariables;
					
					argumentsToPassAsVariables = token.value.slice(0, token.value.length-1);
					
					if(functionToRun.type !== knownTokens.subExpression && functionToRun.type !== knownTokens.identifier){
						throw "Last parameter in function definition was not a sub-expression or identifier";
					}
					
					tokens[partIndex] = function(){
						var args = Array.prototype.slice.call(arguments),
							namedArguments = {}; 

						itemsEach(argumentsToPassAsVariables, function(innerToken, index){
							if(index < args.length){
								namedArguments[innerToken.value] = args[index];
							}
						});   
						
						for(var key in scopedVariables){
							if(namedArguments[key] !== undefined){
								console.warn("internal scoped variable " + key + "hides value from outer scope");
							}else{
								namedArguments[key] = scopedVariables[key];                                        
							}
						}                             

						//(filter (array 1 2 3 4 5 4 3 2 1) {item (= item 2) } )
														
						return evaluateTokens(functionToRun.value, true, namedArguments);
					};
					
				}else{
					tokens[partIndex] = evaluateTokens(token.value, true, scopedVariables);
				}
			}
			
			function evaluateIdentifierToken(token, tokens, partIndex, scopedVariables){
				// evaluate identifier.
				// note: variables are evaluted (TODO: variables)
				// functions on the otherhand cannot be evaluated - because not in first index (so return func itself)
				var value = scopedVariables[token.value] || gel.functions[token.value];
				if (!value) {
					if (!scopedVariables.hasOwnProperty(token.value)) {
						throw strings.UnknownIdentifier.format(token.value);
					}
				}

				tokens[partIndex] = value;
			}
			
			function evaluateValueToken(token, tokens, partIndex, scopedVariables){
				// if argument, leave as is (evaluate callbacks)
				if(token.callback){
					tokens[partIndex] = token.callback(token.value);
				}else{
					tokens[partIndex] = token.value;
				}
			}
			
			function evaluateToken(token, tokens, partIndex, scopedVariables){
				if (token.type === knownTokens.period) {
					if(!partIndex){
						throw "unexpected " + knownTokens.period;
					}
					/*
					if(tokens[partIndex + 1].type !== "identifier"){
						throw "no identifier following " + knownTokens.period;
					}
					*/
					if(typeof tokens[partIndex - 1] === "object" || typeof tokens[partIndex - 1] === "function"){
						if(tokens[partIndex - 1].hasOwnProperty(tokens[partIndex + 1].value)){
							tokens[partIndex - 1] = tokens[partIndex - 1][tokens[partIndex + 1].value];
						}else{
							tokens[partIndex - 1] = undefined;
						}
					}
					
					tokens = tokens.slice(0, partIndex).concat(tokens.slice(partIndex + 2));
					partIndex--;
				}else if (token.type === knownTokens.subExpression) {
					evaluateSubExpressionToken(token, tokens, partIndex, scopedVariables);
				}
				else if (token.type === knownTokens.identifier) {
					evaluateIdentifierToken(token, tokens, partIndex, scopedVariables);
				}
				else {
					evaluateValueToken(token, tokens, partIndex, scopedVariables);
				}
				
				return {tokens: tokens, partIndex: partIndex};
			}
            
            function evaluateTokens(tokens, isInSubExpression, scopedVariables) {
                // expected input,
                // tokens: array of tokens (created by tokenise)
                
				if(typeof isInSubExpression !== 'boolean'){
					scopedVariables = scopedVariables || isInSubExpression || {};
					isInSubExpression = false;
				}
					
                if (tokens.length === 0) {
                    // ah empty expression... return undefined
                    return;
                }

                // filter out delmitters
                tokens = stripDelimiters(tokens);

                // evaluate  tokens
                var gelFunction;
                for (var partIndex = 0; partIndex < tokens.length; partIndex++) {
                    var token = tokens[partIndex];
					
					var result = evaluateToken(token, tokens, partIndex, scopedVariables);
					partIndex = result.partIndex;
					tokens = result.tokens;
                }

				// first item is function to execute (only when inside function syntax)
				if (isInSubExpression) {
					gelFunction = tokens[0];
					if (!gelFunction) {
						throw strings.UnknownFunction.format(token.value);
					}
				}

                if (gelFunction) {
                    // [base case] apply evaluated values
                    tokens.shift();
                    return gelFunction.apply(this, tokens);
                }
                else {
                    if (tokens.length == 1) {
                        return tokens[0];
                    }
                    //return tokens;
					throw "Invalid Syntax: Multiple root level expressions";
                }

            }



            /**    PUBLICS    **/
            
            this.parse = function parse(expression, context) {
                var tokens = tokenise(expression);
                return evaluateTokens(tokens, context);
            };
            
            this.getTokens = function getTokens(expression, tokenName){
                var tokens = tokenise(expression),
                    filteredTokens = [];
                                        
                function filterTokens(tokens){
                    itemsEach(tokens, function(token){
                        token.tokenName === tokenName && filteredTokens.push(token);
                        if(token.type === knownTokens.subExpression){
                            filterTokens(token.value);
                        }
                    });
                };
                
                filterTokens(tokens);
                  
                return filteredTokens;                
            };
        }

        return new Gel();
    }

})();