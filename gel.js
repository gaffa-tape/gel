(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Gel = factory();
  }
}(this, function () {

    var Lang = require('lang-js'),
        createNestingParser = Lang.createNestingParser,
        detectString = Lang.detectString,
        Token = Lang.Token,
        Scope = Lang.Scope;

    function fastEach(items, callback) {
        for (var i = 0; i < items.length; i++) {
            if (callback(items[i], i, items)) break;
        }
        return items;
    }
    
    function stringFormat(string, values){    
        return string.replace(/{(\d+)}/g, function(match, number) { 
            return typeof values[number] != 'undefined'
              ? values[number]
              : match
            ;
        });
    }

    function isIdentifier(substring){
        var valid = /^[$A-Z_][0-9A-Z_$]*/i,
            possibleIdentifier = substring.match(valid);

        if (possibleIdentifier && possibleIdentifier.index === 0) {
            return possibleIdentifier[0];
        }
    }

    function tokeniseIdentifier(substring){
        // searches for valid identifiers or operators
        //operators
        var operators = "!=<>/&|*%-^?+\\",
            index = 0;
            
        while (operators.indexOf(substring.charAt(index)||null) >= 0 && ++index) {}

        if (index > 0) {
            return substring.slice(0, index);
        }

        var identifier = isIdentifier(substring);

        if(identifier != null){
            return identifier;                        
        }
    }

    function createKeywordTokeniser(keyword){
        return function(substring){
            substring = tokeniseIdentifier(substring);
            if (substring === keyword) {
                return new Token(this, substring, substring.length);
            }
        };
    }

    var tokenConverters = [
            {
                name:"parentheses",
                precedence: 0,
                tokenise: function convertParenthesisToken(substring) {
                    if(substring.charAt(0) === '(' || substring.charAt(0) === ')'){
                        return new Token(this, substring.charAt(0), 1);
                    }
                },
                parse:createNestingParser(new RegExp('^\\($'),new RegExp('^\\)$')),
                evaluate:function(scope){
                    scope = new Scope(scope);
                        
                    var functionToken = this.childTokens[0];

                    if(!functionToken){
                        throw "Invalid function call. No function was provided to execute.";
                    }
                    
                    functionToken.evaluate(scope);
                        
                    this.result = scope.callWith(functionToken.result, this.childTokens.slice(1), this);
                }
            },
            {
                name:"function",
                precedence: 0,
                tokenise: function convertFunctionToken(substring) {
                    if(substring.charAt(0) === '{' || substring.charAt(0) === '}'){
                        return new Token(this, substring.charAt(0), 1);
                    }
                },
                parse: createNestingParser(new RegExp('^\\{$'),new RegExp('^\\}$')),
                evaluate:function(scope){
                    var parameterNames = this.childTokens.slice(),
                        fnBody = parameterNames.pop();
                                            
                    this.result = function(scope, args){
                        scope = new Scope(scope);
                            
                        for(var i = 0; i < parameterNames.length; i++){
                            scope.set(parameterNames[i].original, args.get(i));
                        }
                        
                        fnBody.evaluate(scope);
                        
                        return fnBody.result;
                    }
                }
            },            
            {
                name:"period",
                precedence: 1,
                tokenise: function convertPeriodToken(substring) {
                    var periodConst = ".";
                    if (substring.charAt(0) === periodConst) return new Token(this, ".", 1);
                    return;
                },
                parse: function(tokens, position){
                    this.targetToken = tokens.splice(position-1,1)[0];
                    this.identifierToken = tokens.splice(position,1)[0];
                },
                evaluate:function(scope){
                    this.targetToken.evaluate(scope);
                    if(
                        this.targetToken.result &&
                        (typeof this.targetToken.result === 'object' || typeof this.targetToken.result === 'function')
                        && this.targetToken.result.hasOwnProperty(this.identifierToken.original)
                    ){
                        this.result = this.targetToken.result[this.identifierToken.original];
                    }else{
                        this.result = undefined;
                    }
                }
            },
            {
                name:"delimiter",
                precedence: 0,
                tokenise: function convertDelimiterToken(substring) {
                    var i = 0;
                    while (i < substring.length && substring.charAt(i).trim() === "" || substring.charAt(i) === ',') {
                        i++;
                    }
            
                    if (i) return new Token(this, substring.slice(0, i), i);
                },
                parse:function(tokens, position){
                    tokens.splice(position, 1);
                }
            },
            {
                name:"string",
                precedence: 2,
                tokenise: function convertStringToken(substring) {
                    return detectString(this, substring, '"', "double quoted");
                },
                evaluate:function(){
                    this.result = this.original.slice(1, -1);
                }
            },
            {
                name:"singleQuoteString",
                precedence: 2,
                tokenise: function convertStringToken(substring) {
                    return detectString(this, substring, "'", "single quoted");
                },
                evaluate:function(){
                    this.result = this.original.slice(1, -1);
                }
            },
            {
                name:"number",
                precedence: 1,
                tokenise: function convertNumberToken(substring) {
                    var specials = {
                        "NaN": Number.NaN,
                        "-NaN": Number.NaN,
                        "Infinity": Infinity,
                        "-Infinity": -Infinity
                    };
                    for (var key in specials) {
                        if (substring.slice(0, key.length) === key) {
                            return new Token(this, key, key.length);
                        }
                    }
            
                    var valids = "0123456789-.Eex",
                        index = 0;
                        
                    while (valids.indexOf(substring.charAt(index)||null) >= 0 && ++index) {}
            
                    if (index > 0) {
                        var result = substring.slice(0, index);
                        if(isNaN(parseFloat(result))){
                            return;
                        }
                        return new Token(this, result, index);
                    }
            
                    return;
                },
                evaluate:function(){
                    this.result = parseFloat(this.original);
                }
            },
            {
                name:"identifier",
                precedence: 3,
                tokenise: function(substring){
                    var result = tokeniseIdentifier(substring);

                    if(result != null){
                        return new Token(this, result, result.length);
                    }
                },
                evaluate:function(scope){
                    this.result = scope.get(this.original);
                }
            },          
            {
                name:"true",
                precedence: 2,
                tokenise: createKeywordTokeniser("true"),
                evaluate:function(){
                    this.result = true;
                }
            },
            {
                name:"false",
                precedence: 2,
                tokenise: createKeywordTokeniser("false"),
                evaluate:function(){
                    this.result = false;
                }
            },
            {
                name:"null",
                precedence: 2,
                tokenise: createKeywordTokeniser("null"),
                evaluate:function(){
                    this.result = null;
                }
            },
            {
                name:"undefined",
                precedence: 2,
                tokenise: createKeywordTokeniser("undefined"),
                evaluate:function(){
                    this.result = undefined;
                }
            }
        ],
        scope = {
            "toString":function(scope, args){
                return "" + args.next();
            },
            "+":function(scope, args){
                return args.next() + args.next();
            },
            "-":function(scope, args){
                return args.next() - args.next();
            },
            "/":function(scope, args){
                return args.next() / args.next();
            },
            "*":function(scope, args){
                return args.next() * args.next();
            },
            "isNaN":function(scope, args){
                return isNaN(args.get(0));
            },
            "max":function(scope, args){
                var result = args.next();
                while(args.hasNext()){
                    result = Math.max(result, args.next());
                }
                return result;
            },
            "min":function(scope, args){
                var result = args.next();
                while(args.hasNext()){
                    result = Math.min(result, args.next());
                }
                return result;
            },
            ">":function(scope, args){
                return args.next() > args.next();
            },
            "<":function(scope, args){
                return args.next() < args.next();
            },
            ">=":function(scope, args){
                return args.next() >= args.next();
            },
            "<=":function(scope, args){
                return args.next() <= args.next();
            },
            "double":function(scope, args){
                return args.next() * 2;
            },
            "?":function(scope, args){
                return args.next() ? args.next() : args.get(2);
            },
            "!":function(scope, args){
                return !args.next();
            },
            "=":function(scope, args){
                return args.next() == args.next();
            },
            "==":function(scope, args){
                return args.next() === args.next();
            },
            "!=":function(scope, args){
                return args.next() != args.next();
            },
            "!==":function(scope, args){
                return args.next() !== args.next();
            },
            "||":function(scope, args){
                var nextArg;
                while(args.hasNext()){
                    nextArg = args.next();
                    if(nextArg){
                        return nextArg;
                    }
                }
                return nextArg;
            },
            "|":function(scope, args){
                var nextArg;
                while(args.hasNext()){
                    nextArg = args.next();
                    if(nextArg === true ){
                        return nextArg;
                    }
                }
                return nextArg;
            },
            "&&":function(scope, args){
                var nextArg;
                while(args.hasNext()){
                    nextArg = args.next();
                    if(!nextArg){
                        return false;
                    }
                }
                return nextArg;
            },
            "object":function(scope, args){
                var result = {};
                while(args.hasNext()){
                    result[args.next()] = args.next();
                }
                return result;
            },
            "array":function(scope, args){
                var result = [];
                while(args.hasNext()){
                    result.push(args.next());
                }
                return result;
            },
            "map":function(scope, args){
                var source = args.next(),
                    isArray = Array.isArray(source),
                    result = isArray ? [] : {},
                    functionToken = args.next();

                if(isArray){
                    fastEach(source, function(item, index){
                        result[index] = scope.callWith(functionToken, [item]);
                    });
                }else{
                    for(var key in source){
                        result[key] = scope.callWith(functionToken, [source[key]]);
                    };
                }  
                
                return result;
            },
            "pairs": function(scope, args){
                var target = args.next(),
                    result = [];

                for(var key in target){
                    if(target.hasOwnProperty(key)){
                        result.push([key, target[key]]);
                    }
                }

                return result;
            },
            "flatten":function(scope, args){
                var target = args.next(),
                    shallow = args.hasNext() && args.next();

                function flatten(target){
                    var result = [],
                        source;

                    for(var i = 0; i < target.length; i++){
                        source = target[i];

                        for(var j = 0; j < source.length; j++){
                            if(!shallow && Array.isArray(source[j])){
                                result.push(flatten(source));
                            }else{
                                result.push(target[i][j]);
                            }
                        }
                    }
                    return result;
                }
                return flatten(target);
            },
            "sort": function(scope, args) {
                var args = args.all(),
                    result;
                
                var array = args[0];
                var functionToCompare = args[1];
                
                if (Array.isArray(array)) {
                
                    result = array.sort(function(a,b){
                        return scope.callWith(functionToCompare, [a,b]);
                    });

                    return result;
                
                }else {
                    return;
                }
            },
            "filter": function(scope, args) {
                var args = args.all(),
                    filteredList = [];
                    
                if (args.length < 2) {
                    return args;
                }
                


                var array = args[0],
                    functionToCompare = args[1];
                
                if (Array.isArray(array)) {
                    
                    fastEach(array, function(item, index){
                        if(typeof functionToCompare === "function"){
                            if(scope.callWith(functionToCompare, [item])){ 
                                filteredList.push(item);
                            }
                        }else{
                            if(item === functionToCompare){ 
                                filteredList.push(item);
                            }
                        }
                    });
                    return filteredList;                
                }
            },
            "findOne": function(scope, args) {
                var args = args.all(),
                    result;
                    
                if (args.length < 2) {
                    return args;
                }
                


                var array = args[0],
                    functionToCompare = args[1];
                
                if (Array.isArray(array)) {
                    
                    fastEach(array, function(item, index){
                        if(scope.callWith(functionToCompare, [item])){ 
                            result = item;
                            return true;
                        }
                    });
                    return result;              
                }
            },
            "concat":function(scope, args){
                var result = args.next();
                while(args.hasNext()){
                    if(result == null || !result.concat){
                        return undefined;
                    }
                    result = result.concat(args.next());
                }
                return result;
            },
            "join":function(scope, args){
                args = args.all();

                return args.slice(1).join(args[0]);
            },
            "slice":function(scope, args){
                var target = args.next(),
                    start,
                    end;

                if(args.hasNext()){
                    start = target;
                    target = args.next();
                }
                if(args.hasNext()){
                    end = target;
                    target = args.next();
                }
                
                return target.slice(start, end);
            },
            "last":function(scope, args){
                var array = args.next();

                if(!Array.isArray(array)){
                    return;
                }
                return array.slice(-1).pop();
            },
            "length":function(scope, args){
                return args.next().length;
            },
            "getValue":function(scope, args){
                var target = args.next(),
                    key = args.next();

                if(!target || typeof target !== 'object'){
                    return;
                }

                return target[key];
            },
            "compare":function(scope, args){
                var args = args.all(),
                    comparitor = args.pop(),
                    reference = args.pop(),
                    result = true,
                    objectToCompare;
                                    
                while(args.length){
                    objectToCompare = args.pop();
                    for(var key in objectToCompare){
                        if(!scope.callWith(comparitor, [objectToCompare[key], reference[key]])){
                            result = false;
                        }
                    }
                }
                
                return result;
            },
            "contains": function(scope, args){
                var args = args.all(),
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
                    
                fastEach(args, function(arg){
                    
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
            "charAt":function(scope, args){
                var target = args.next(),
                    position;

                if(args.hasNext()){
                    position = args.next();
                }

                if(typeof target !== 'string'){
                    return;
                }

                return target.charAt(position);
            },
            "toLowerCase":function(scope, args){
                var target = args.next();

                if(typeof target !== 'string'){
                    return undefined;
                }

                return target.toLowerCase();
            },
            "format": function format(scope, args) {
                var args = args.all();
                
                return stringFormat(args.shift(), args);
            },
            "refine": function(scope, args){
                var args = args.all(),
                    exclude = typeof args[0] === "boolean" && args.shift(),
                    original = args.shift(),
                    refined = {};
                    
                for(var i = 0; i < args.length; i++){
                    args[i] = args[i].toString();
                }

                for(var key in original){
                    if(args.indexOf(key)>=0){
                        !exclude && (refined[key] = original[key]);
                    }else if(exclude){
                        refined[key] = original[key];
                    }
                }
                
                return refined;
            },
            "date": (function(){
                var date = function(scope, args) {
                    return args.length ? new Date(args.length > 1 ? args.all() : args.next()) : new Date();
                };
                
                date.addDays = function(scope, args){
                    var baseDate = args.next();

                    return new Date(baseDate.setDate(baseDate.getDate() + args.next()));
                }
                
                return date;
            })(),
            "toJSON":function(scope, args){
                return JSON.stringify(args.next());
            },
            "fromJSON":function(scope, args){
                return JSON.parse(args.next());
            },
            "fold": function(scope, args){
                var args = args.all(),
                    fn = args.pop(),
                    seed = args.pop(),
                    array = args[0],
                    result = seed;
                
                if(args.length > 1){
                    array = args;
                }
                    
                for(var i = 0; i < array.length; i++){
                    result = scope.callWith(fn, [result, array[i]]);
                }
                
                return result;
            },
            "partial": function(scope, args){
                var outerArgs = args.all(),
                    fn = outerArgs.shift();
                
                return function(scope, args){
                    var innerArgs = args.all();
                    return scope.callWith(fn, outerArgs.concat(innerArgs));
                };
            },
            "flip": function(scope, args){
                var outerArgs = args.all().reverse(),
                    fn = outerArgs.pop();
                
                return function(scope, args){
                    return scope.callWith(fn, outerArgs)
                };
            },
            "compose": function(scope, args){
                var outerArgs = args.all().reverse();
                    
                return function(scope, args){
                    var result = scope.callWith(outerArgs[0], args.all());
                    
                    for(var i = 1; i < outerArgs.length; i++){
                        result = scope.callWith(outerArgs[i], [result]);
                    }
                    
                    return result;
                };
            },
            "apply": function(scope, args){
                var fn = args.next()
                    outerArgs = args.next();
                    
                return scope.callWith(fn, outerArgs);
            }
        };

    
    Gel = function(){    
        var gel = {},
            lang = new Lang();
            
        gel.lang = lang;
        gel.tokenise = function(expression){
            return gel.lang.tokenise(expression, this.tokenConverters);
        }
        gel.evaluate = function(expression, injectedScope, returnAsTokens){
            var scope = new Lang.Scope();

            scope.add(this.scope).add(injectedScope);

            return lang.evaluate(expression, scope, this.tokenConverters, returnAsTokens);
        };
        gel.tokenConverters = tokenConverters.slice();
        gel.scope = {__proto__:scope};
        
        return gel;
    };

    return Gel;
    
}));