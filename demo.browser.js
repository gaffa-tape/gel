(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Gel = require('./'),
	gel = new Gel(),
	crel = require('crel'),
    input,
    context,
    output,
    ui = crel('div',
        crel('h1', 'Gel tester (shift+enter to run)'),
        crel('div', {'class':'halfWidth'},
            crel('h2', 'Input (Gel)'),
            input = crel('textarea')
        ),
        crel('div', {'class':'halfWidth'},
            crel('h2', 'Context (JSON)'),
            context = crel('textarea')
        ),
        crel('h2', 'Output'),
        output = crel('pre')
    );

window.gel = gel;

function run(event){
    if(event.which === 13 && event.shiftKey){
        try{
            output.innerText = gel.evaluate(input.value, JSON.parse(context.value || '{}'));
        }catch(error){
            output.innerText = error;
        }
        event.preventDefault();
    }
}

input.addEventListener('keypress', run);
context.addEventListener('keypress', run);

window.onload = function () {
    document.body.appendChild(ui);
};
},{"./":2,"crel":3}],2:[function(require,module,exports){
var Lang = require('lang-js'),
    paths = require('gedi-paths'),
    merge = require('merge'),
    createNestingParser = Lang.createNestingParser,
    detectString = Lang.detectString,
    Token = Lang.Token,
    Scope = Lang.Scope,
    createSpec = require('spec-js');

function fastEach(items, callback) {
    for (var i = 0; i < items.length; i++) {
        if (callback(items[i], i, items)) break;
    }
    return items;
}

function quickIndexOf(array, value){
    var length = array.length
    for(var i = 0; i < length && array[i] !== value;i++) {}
    return i < length ? i : -1;
}

function stringFormat(string, values){
    return string.replace(/{(\d+)}/g, function(match, number) {
        return values[number] != null
          ? values[number]
          : ''
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

function createKeywordTokeniser(Constructor, keyword){
    return function(substring){
        substring = isIdentifier(substring);
        if (substring === keyword) {
            return new Constructor(substring, substring.length);
        }
    };
}

function StringToken(){}
StringToken = createSpec(StringToken, Token);
StringToken.tokenPrecedence = 2;
StringToken.prototype.parsePrecedence = 2;
StringToken.prototype.stringTerminal = '"';
StringToken.prototype.name = 'StringToken';
StringToken.prototype.static = true;
StringToken.tokenise = function (substring) {
    if (substring.charAt(0) === this.prototype.stringTerminal) {
        var index = 0,
        escapes = 0;

        while (substring.charAt(++index) !== this.prototype.stringTerminal)
        {
           if(index >= substring.length){
                   throw "Unclosed " + this.name;
           }
           if (substring.charAt(index) === '\\' && substring.charAt(index+1) === this.prototype.stringTerminal) {
                   substring = substring.slice(0, index) + substring.slice(index + 1);
                   escapes++;
           }
        }

        return new this(
            substring.slice(0, index+1),
            index + escapes + 1
        );
    }
}
StringToken.prototype.evaluate = function () {
    this.result = this.original.slice(1,-1);
}

function String2Token(){}
String2Token = createSpec(String2Token, StringToken);
String2Token.tokenPrecedence = 1;
String2Token.prototype.parsePrecedence = 1;
String2Token.prototype.stringTerminal = "'";
String2Token.prototype.name = 'String2Token';
String2Token.tokenise = StringToken.tokenise;

function ParenthesesToken(){
}
ParenthesesToken = createSpec(ParenthesesToken, Token);
ParenthesesToken.tokenPrecedence = 1;
ParenthesesToken.prototype.parsePrecedence = 4;
ParenthesesToken.prototype.name = 'ParenthesesToken';
ParenthesesToken.tokenise = function(substring) {
    if(substring.charAt(0) === '('){
        return new ParenthesesToken(substring.charAt(0), 1);
    }
}
ParenthesesToken.prototype.parse = createNestingParser(ParenthesesEndToken);

function executeFunction(parenthesesToken, scope, fn){
    var outerArgs = parenthesesToken.childTokens.slice(1),
        hasPartial,
        hasFill;

    for(var i = 0; i < parenthesesToken.childTokens.length; i++){
        var childToken = parenthesesToken.childTokens[i];
        if(childToken instanceof FillToken){
            if(hasFill){
                throw "Only one fill token can be used in a function call"
            }
            hasFill = true;
        }else if(childToken instanceof PartialToken){
            if(hasFill){
                throw "Partial tokens may only appear befor a Fill token"
            }
            hasPartial = true;
        }
    }

    if(hasPartial || hasFill){
        parenthesesToken.result = function(scope, args){
            var argIndex = 0,
                appliedArgs = [];

            for(var i = 0; i < outerArgs.length; i++){
                if(outerArgs[i] instanceof FillToken){
                    while(argIndex<args.length){
                        appliedArgs.push(args.getRaw(argIndex));
                        argIndex++;
                    }
                }else if(outerArgs[i] instanceof PartialToken){
                    appliedArgs.push(args.getRaw(argIndex));
                    argIndex++;
                }else{
                    appliedArgs.push(outerArgs[i]);
                }
            }

            return scope.callWith(fn, appliedArgs, parenthesesToken);
        };
        return;
    }
    parenthesesToken.result = scope.callWith(fn, parenthesesToken.childTokens.slice(1), parenthesesToken);
}
ParenthesesToken.prototype.evaluate = function(scope){
    scope = new Scope(scope);

    var functionToken = this.childTokens[0];

    if(!functionToken){
        throw "Invalid function call. No function was provided to execute.";
    }

    functionToken.evaluate(scope);

    if(typeof functionToken.result !== 'function'){
        throw functionToken.original + " (" + functionToken.result + ")" + " is not a function";
    }

    executeFunction(this, scope, functionToken.result);
};

function ParenthesesEndToken(){}
ParenthesesEndToken = createSpec(ParenthesesEndToken, Token);
ParenthesesEndToken.tokenPrecedence = 1;
ParenthesesEndToken.prototype.parsePrecedence = 4;
ParenthesesEndToken.prototype.name = 'ParenthesesEndToken';
ParenthesesEndToken.tokenise = function(substring) {
    if(substring.charAt(0) === ')'){
        return new ParenthesesEndToken(substring.charAt(0), 1);
    }
};

function NumberToken(){}
NumberToken = createSpec(NumberToken, Token);
NumberToken.tokenPrecedence = 2;
NumberToken.prototype.parsePrecedence = 2;
NumberToken.prototype.name = 'NumberToken';
NumberToken.tokenise = function(substring) {
    var specials = {
        "NaN": Number.NaN,
        "-NaN": -Number.NaN,
        "Infinity": Infinity,
        "-Infinity": -Infinity
    };
    for (var key in specials) {
        if (substring.slice(0, key.length) === key) {
            return new NumberToken(key, key.length);
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
        return new NumberToken(result, index);
    }

    return;
};
NumberToken.prototype.evaluate = function(scope){
    this.result = parseFloat(this.original);
};

function ValueToken(value, sourcePathInfo, key){
    this.original = 'Value';
    this.length = this.original.length,
    this.result = value;

    if(sourcePathInfo){
        this.sourcePathInfo = new SourcePathInfo();
        this.sourcePathInfo.path = sourcePathInfo.path;
        this.sourcePathInfo.subPaths = sourcePathInfo.subPaths && sourcePathInfo.subPaths.slice();
    }

    if(key != null){
        this.sourcePathInfo.drillTo(key);
    }
}
ValueToken = createSpec(ValueToken, Token);
ValueToken.tokenPrecedence = 2;
ValueToken.prototype.parsePrecedence = 2;
ValueToken.prototype.name = 'ValueToken';
ValueToken.prototype.evaluate = function(){};

function NullToken(){}
NullToken = createSpec(NullToken, Token);
NullToken.tokenPrecedence = 2;
NullToken.prototype.parsePrecedence = 2;
NullToken.prototype.name = 'NullToken';
NullToken.tokenise = createKeywordTokeniser(NullToken, "null");
NullToken.prototype.evaluate = function(scope){
    this.result = null;
};

function UndefinedToken(){}
UndefinedToken = createSpec(UndefinedToken, Token);
UndefinedToken.tokenPrecedence = 2;
UndefinedToken.prototype.parsePrecedence = 2;
UndefinedToken.prototype.name = 'UndefinedToken';
UndefinedToken.tokenise = createKeywordTokeniser(UndefinedToken, 'undefined');
UndefinedToken.prototype.evaluate = function(scope){
    this.result = undefined;
};

function TrueToken(){}
TrueToken = createSpec(TrueToken, Token);
TrueToken.tokenPrecedence = 2;
TrueToken.prototype.parsePrecedence = 2;
TrueToken.prototype.name = 'TrueToken';
TrueToken.tokenise = createKeywordTokeniser(TrueToken, 'true');
TrueToken.prototype.evaluate = function(scope){
    this.result = true;
};

function FalseToken(){}
FalseToken = createSpec(FalseToken, Token);
FalseToken.tokenPrecedence = 2;
FalseToken.prototype.parsePrecedence = 2;
FalseToken.prototype.name = 'FalseToken';
FalseToken.tokenise = createKeywordTokeniser(FalseToken, 'false');
FalseToken.prototype.evaluate = function(scope){
    this.result = false;
};

function DelimiterToken(){}
DelimiterToken = createSpec(DelimiterToken, Token);
DelimiterToken.tokenPrecedence = 1;
DelimiterToken.prototype.parsePrecedence = 1;
DelimiterToken.prototype.name = 'DelimiterToken';
DelimiterToken.tokenise = function(substring) {
    var i = 0;
    while(i < substring.length && substring.charAt(i).trim() === "") {
        i++;
    }

    if(i){
        return new DelimiterToken(substring.slice(0, i), i);
    }
};
DelimiterToken.prototype.parse = function(tokens, position){
    tokens.splice(position, 1);
};

function IdentifierToken(){}
IdentifierToken = createSpec(IdentifierToken, Token);
IdentifierToken.tokenPrecedence = 3;
IdentifierToken.prototype.parsePrecedence = 3;
IdentifierToken.prototype.name = 'IdentifierToken';
IdentifierToken.tokenise = function(substring){
    var result = tokeniseIdentifier(substring);

    if(result != null){
        return new IdentifierToken(result, result.length);
    }
};
IdentifierToken.prototype.evaluate = function(scope){
    var value = scope.get(this.original);
    if(value instanceof Token){
        this.result = value.result;
        this.sourcePathInfo = value.sourcePathInfo;
    }else{
        this.result = value;
    }
};

function PeriodToken(){}
PeriodToken = createSpec(PeriodToken, Token);
PeriodToken.prototype.name = 'PeriodToken';
PeriodToken.tokenPrecedence = 2;
PeriodToken.prototype.parsePrecedence = 5;
PeriodToken.tokenise = function(substring){
    var periodConst = ".";
    return (substring.charAt(0) === periodConst) ? new PeriodToken(periodConst, 1) : undefined;
};
PeriodToken.prototype.parse = function(tokens, position){
    this.targetToken = tokens.splice(position-1,1)[0];
    this.identifierToken = tokens.splice(position,1)[0];
};
PeriodToken.prototype.evaluate = function(scope){
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

    var targetPath;

    if(this.targetToken.sourcePathInfo){
        targetPath = this.targetToken.sourcePathInfo.path
    }

    if(targetPath){
        this.sourcePathInfo = {
            path: paths.append(targetPath, paths.create(this.identifierToken.original))
        };
    }
};

function CommaToken(){}
CommaToken = createSpec(CommaToken, Token);
CommaToken.prototype.name = 'CommaToken';
CommaToken.tokenPrecedence = 2;
CommaToken.prototype.parsePrecedence = 6;
CommaToken.tokenise = function(substring){
    var characterConst = ",";
    return (substring.charAt(0) === characterConst) ? new CommaToken(characterConst, 1) : undefined;
};
CommaToken.prototype.parse = function(tokens, position){
    this.leftToken = tokens.splice(position-1,1)[0];
    this.rightToken = tokens.splice(position,1)[0];
    if(!this.leftToken){
        throw "Invalid syntax, expected token before ,";
    }
    if(!this.rightToken){
        throw "Invalid syntax, expected token after ,";
    }
};
CommaToken.prototype.evaluate = function(scope){
    this.leftToken.evaluate(scope);
    this.rightToken.evaluate(scope);

    var leftToken = this.leftToken,
        rightToken = this.rightToken,
        leftPath = leftToken.sourcePathInfo && leftToken.sourcePathInfo.path,
        leftPaths = leftToken.sourcePathInfo && leftToken.sourcePathInfo.subPaths,
        rightPath = rightToken.sourcePathInfo && rightToken.sourcePathInfo.path;

    this.sourcePathInfo = {
        subPaths: []
    };

    if(leftToken instanceof CommaToken){
        // concat
        this.result = leftToken.result.slice();
        this.sourcePathInfo.subPaths = leftPaths;
    }else{
        this.result = [];

        this.result.push(leftToken.result);
        this.sourcePathInfo.subPaths.push(leftPath);
    }

    this.result.push(rightToken.result);
    this.sourcePathInfo.subPaths.push(rightPath);
};

function PartialToken(){}
PartialToken = createSpec(PartialToken, Token);
PartialToken.prototype.name = 'PartialToken';
PartialToken.tokenPrecedence = 1;
PartialToken.prototype.parsePrecedence = 6;
PartialToken.tokenise = function(substring){
    var characterConst = "_";
    return (substring.charAt(0) === characterConst) ? new PartialToken(characterConst, 1) : undefined;
};
PartialToken.prototype.evaluate = function(){};

function FillToken(){}
FillToken = createSpec(FillToken, Token);
FillToken.prototype.name = 'FillToken';
FillToken.tokenPrecedence = 1;
FillToken.prototype.parsePrecedence = 6;
FillToken.tokenise = function(substring){
    var charactersConst = "...";
    return (substring.slice(0,3) === charactersConst) ? new FillToken(charactersConst, 3) : undefined;
};
FillToken.prototype.evaluate = function(){};

function PipeToken(){}
PipeToken = createSpec(PipeToken, Token);
PipeToken.prototype.name = 'PipeToken';
PipeToken.tokenPrecedence = 1;
PipeToken.prototype.parsePrecedence = 6;
PipeToken.tokenise = function(substring){
    var pipeConst = "|>";
    return (substring.slice(0,2) === pipeConst) ? new PipeToken(pipeConst, pipeConst.length) : undefined;
};
PipeToken.prototype.parse = function(tokens, position){
    this.argumentToken = tokens.splice(position-1,1)[0];
    this.functionToken = tokens.splice(position,1)[0];
};
PipeToken.prototype.evaluate = function(scope){
    scope = new Scope(scope);

    if(!this.functionToken){
        throw "Invalid function call. No function was provided to execute.";
    }

    this.functionToken.evaluate(scope);

    if(typeof this.functionToken.result !== 'function'){
        throw this.functionToken.original + " (" + this.functionToken.result + ")" + " is not a function";
    }

    this.result = scope.callWith(this.functionToken.result, [this.argumentToken], this);
};

function PipeApplyToken(){}
PipeApplyToken = createSpec(PipeApplyToken, Token);
PipeApplyToken.prototype.name = 'PipeApplyToken';
PipeApplyToken.tokenPrecedence = 1;
PipeApplyToken.prototype.parsePrecedence = 6;
PipeApplyToken.tokenise = function(substring){
    var pipeConst = "~>";
    return (substring.slice(0,2) === pipeConst) ? new PipeApplyToken(pipeConst, pipeConst.length) : undefined;
};
PipeApplyToken.prototype.parse = function(tokens, position){
    this.argumentsToken = tokens.splice(position-1,1)[0];
    this.functionToken = tokens.splice(position,1)[0];
};
PipeApplyToken.prototype.evaluate = function(scope){
    scope = new Scope(scope);

    if(!this.functionToken){
        throw "Invalid function call. No function was provided to execute.";
    }

    if(!this.argumentsToken){
        throw "Invalid function call. No arguments were provided to apply.";
    }

    this.functionToken.evaluate(scope);
    this.argumentsToken.evaluate(scope);

    if(typeof this.functionToken.result !== 'function'){
        throw this.functionToken.original + " (" + this.functionToken.result + ")" + " is not a function";
    }

    if(!Array.isArray(this.argumentsToken.result)){
        this.result = null;
        return;
    }

    this.result = scope.callWith(this.functionToken.result, this.argumentsToken.result, this);
};

function BraceToken(){}
BraceToken = createSpec(BraceToken, Token);
BraceToken.tokenPrecedence = 1;
BraceToken.prototype.parsePrecedence = 3;
BraceToken.prototype.name = 'BraceToken';
BraceToken.tokenise = function(substring) {
    if(substring.charAt(0) === '{'){
        return new BraceToken(substring.charAt(0), 1);
    }
};
BraceToken.prototype.parse = createNestingParser(BraceEndToken);
BraceToken.prototype.evaluate = function(scope){
    var parameterNames = this.childTokens.slice();

    // Object literal
    if(parameterNames.length === 0 || parameterNames[0] instanceof TupleToken){
        this.result = {};
        this.sourcePathInfo = new SourcePathInfo(null, {}, true);

        for(var i = 0; i < parameterNames.length; i++){
            var token = parameterNames[i];
            token.evaluate(scope);
            this.result[token.keyToken.result] = token.valueToken.result;

            if(token.valueToken.sourcePathInfo){
                this.sourcePathInfo.subPaths[key] = token.valueToken.sourcePathInfo.path;
            }
        };

        return;
    }

    // Function expression
    var fnBody = parameterNames.pop();

    this.result = function(scope, args){
        scope = new Scope(scope);

        for(var i = 0; i < parameterNames.length; i++){
            var parameterToken = args.getRaw(i, true);
            scope.set(parameterNames[i].original, parameterToken);
        }

        fnBody.evaluate(scope);

        if(args.callee){
            args.callee.sourcePathInfo = fnBody.sourcePathInfo;
        }

        return fnBody.result;
    };
};

function BraceEndToken(){}
BraceEndToken = createSpec(BraceEndToken, Token);
BraceEndToken.tokenPrecedence = 1;
BraceEndToken.prototype.parsePrecedence = 4;
BraceEndToken.prototype.name = 'BraceEndToken';
BraceEndToken.tokenise = function(substring) {
    if(substring.charAt(0) === '}'){
        return new BraceEndToken(substring.charAt(0), 1);
    }
};

function Tuple(key, value){
    this[key] = value;
}

function TupleToken(){}
TupleToken = createSpec(TupleToken, Token);
TupleToken.prototype.name = 'TupleToken';
TupleToken.tokenPrecedence = 2;
TupleToken.prototype.parsePrecedence = 6;
TupleToken.tokenise = function(substring){
    var tupleConst = ":";
    return (substring.charAt(0) === tupleConst) ? new TupleToken(tupleConst, 1) : undefined;
};
TupleToken.prototype.parse = function(tokens, position){
    this.keyToken = tokens.splice(position-1,1)[0];
    this.valueToken = tokens.splice(position, 1)[0];
};
TupleToken.prototype.evaluate = function(scope){
    this.keyToken.evaluate(scope);
    this.valueToken.evaluate(scope);

    this.result = new Tuple(this.keyToken.result, this.valueToken.result);
};

function SourcePathInfo(token, source, trackSubPaths){
    var innerPathInfo;

    if(trackSubPaths && source){
        this.subPaths = typeof source === 'object' && new source.constructor();
    }

    if(token){
        innerPathInfo = token.sourcePathInfo;

        if(token instanceof Token && token.path){
            originPath = token.original;
            this.original = source;
        }
    }

    this.innerPathInfo = innerPathInfo;


    this.original = innerPathInfo && innerPathInfo.original || source;
    this.path = innerPathInfo && innerPathInfo.path;
}
SourcePathInfo.prototype.setSubPath = function(to, key){
    if(!this.subPaths){
        return;
    }
    this.subPaths[to] = this.innerPathInfo && this.innerPathInfo.subPaths && this.innerPathInfo.subPaths[key] || paths.append(this.path, paths.create(key));
};
SourcePathInfo.prototype.pushSubPath = function(key){
    if(!this.subPaths){
        return;
    }
    this.setSubPath(this.subPaths.length, key);
};
SourcePathInfo.prototype.setSubPaths = function(paths){
    if(!this.subPaths){
        return;
    }
    this.subPaths = paths;
};
SourcePathInfo.prototype.mapSubPaths = function(object){
    for(var key in object){
        if(object.hasOwnProperty(key)){
            this.setSubPath(key, key);
        }
    }
};
SourcePathInfo.prototype.drillTo = function(key){
    if(this.subPaths){
        this.path = this.subPaths[key];
    }else if(this.path){
        this.path = paths.append(this.path, paths.create(key));
    }
};

function addFilterResult(filteredItems, item, key, sourcePathInfo, isArray){
    if(isArray){
        filteredItems.push(item);
    }else{
        filteredItems[key] = item;
    }
    sourcePathInfo.pushSubPath(key);
}

function gelFilter(scope, args) {
    var source = args.get(0),
        sourcePathInfo = new SourcePathInfo(args.getRaw(0), source, true),
        filteredItems = source && typeof source === 'object' && new source.constructor();

    var functionToCompare = args.get(1);

    if(!filteredItems){
        return undefined;
    }

    var isArray = Array.isArray(source),
        item;

    for(var key in source){
        if(isArray && isNaN(key)){
            continue;
        }
        item = source[key];
        if(typeof functionToCompare === "function"){
            if(scope.callWith(functionToCompare, [item])){
                addFilterResult(filteredItems, item, key, sourcePathInfo, isArray);
            }
        }else{
            if(item === functionToCompare){
                addFilterResult(filteredItems, item, key, sourcePathInfo, isArray);
            }
        }
    }

    args.callee.sourcePathInfo = sourcePathInfo;

    return filteredItems;
}

function gelMerge(scope, args){
    var result = {};
    while(args.hasNext()){
        var nextObject = args.next();
        result = merge(result, nextObject);
    }
    return result;
}

var tokenConverters = [
        StringToken,
        String2Token,
        ParenthesesToken,
        ParenthesesEndToken,
        NumberToken,
        NullToken,
        UndefinedToken,
        TrueToken,
        FalseToken,
        DelimiterToken,
        IdentifierToken,
        CommaToken,
        PeriodToken,
        PartialToken,
        FillToken,
        PipeToken,
        PipeApplyToken,
        BraceToken,
        BraceEndToken,
        TupleToken
    ],
    scope = {
        "parseInt":function(scope, args){
            return parseInt(args.next());
        },
        "parseFloat":function(scope, args){
            return parseFloat(args.next());
        },
        "toFixed": function(scope, args){
            var num = args.next(),
                decimals = args.get(1) || 2;

            if(isNaN(num)){
                return;
            }

            return num.toFixed(decimals);
        },
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
        "%":function(scope, args){
            return args.next() % args.next();
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
        "?":function(scope, args){
            var result,
                resultToken;
            if(args.next()){
                result = args.get(1);
                resultToken = args.getRaw(1);
            }else{
                result = args.get(2);
                resultToken = args.getRaw(2);
            }

            args.callee.sourcePathInfo = resultToken && resultToken.sourcePathInfo;

            return result;
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
            var nextArg,
                rawResult,
                argIndex = -1;

            while(args.hasNext()){
                argIndex++;
                nextArg = args.next();
                if(nextArg){
                    break;
                }
            }

            rawResult = args.getRaw(argIndex);
            args.callee.sourcePathInfo = rawResult && rawResult.sourcePathInfo;
            return nextArg;
        },
        "|":function(scope, args){
            var nextArg,
                rawResult,
                argIndex = -1;

            while(args.hasNext()){
                argIndex++;
                nextArg = args.next();
                if(nextArg === true){
                    break;
                }
            }

            rawResult = args.getRaw(argIndex);
            args.callee.sourcePathInfo = rawResult && rawResult.sourcePathInfo;
            return nextArg;
        },
        "&&":function(scope, args){
            var nextArg,
                rawResult,
                argIndex = -1;

            while(args.hasNext()){
                argIndex++;
                nextArg = args.next();
                if(!nextArg){
                    break;
                }
            }

            rawResult = args.getRaw(argIndex);
            args.callee.sourcePathInfo = rawResult && rawResult.sourcePathInfo;
            return nextArg;
        },
        "keys":function(scope, args){
            var object = args.next();
            return typeof object === 'object' ? Object.keys(object) : undefined;
        },
        "values":function(scope, args){
            var target = args.next(),
                callee = args.callee,
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), target, true),
                result = [];

            for(var key in target){
                result.push(target[key]);

                sourcePathInfo.setSubPath(result.length - 1, key);
            }

            callee.sourcePathInfo = sourcePathInfo;

            return result;
        },
        "invert":function(scope, args){
            var target = args.next(),
                result = {};
            for(var key in target){
                result[target[key]] = key;
            }
            return result;
        },
        "extend": gelMerge,
        "merge": gelMerge,
        "array":function(scope, args){
            var argTokens = args.raw(),
                argValues = args.all(),
                result = [],
                callee = args.callee,
                sourcePathInfo = new SourcePathInfo(null, [], true);

            for(var i = 0; i < argValues.length; i++) {
                result.push(argValues[i]);
                if(argTokens[i] instanceof Token && argTokens[i].sourcePathInfo){
                    sourcePathInfo.subPaths[i] = argTokens[i].sourcePathInfo.path;
                }
            }

            callee.sourcePathInfo = sourcePathInfo;

            return result;
        },
        "object":function(scope, args){
            var result = {},
                callee = args.callee,
                sourcePathInfo = new SourcePathInfo(null, {}, true);

            for(var i = 0; i < args.length; i+=2){
                var key = args.get(i),
                    valueToken = args.getRaw(i+1),
                    value = args.get(i+1);

                result[key] = value;

                if(valueToken instanceof Token && valueToken.sourcePathInfo){
                    sourcePathInfo.subPaths[key] = valueToken.sourcePathInfo.path;
                }
            }

            callee.sourcePathInfo = sourcePathInfo;

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
            var source = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source, true),
                sortFunction = args.next(),
                result,
                sourceArrayKeys,
                caller = args.callee;

            if(!Array.isArray(source)){
                return;
            }

            // no subpaths, just do a normal sort.
            if(!sourcePathInfo.path){
                return source.slice().sort(function(value1, value2){
                    return scope.callWith(sortFunction, [value1,value2], caller);
                });
            }

            for(var i = 0; i < source.length; i++){
                sourcePathInfo.setSubPath(i, i);
            }

            result = [];
            sortedPaths = sourcePathInfo.subPaths.slice();
            sortedPaths.sort(function(path1, path2){
                var value1 = source[quickIndexOf(sourcePathInfo.subPaths, path1)],
                    value2 = source[quickIndexOf(sourcePathInfo.subPaths, path2)];

                return scope.callWith(sortFunction, [value1,value2], caller);
            });

            for(var i = 0; i < sortedPaths.length; i++) {
                result[i] = sourcePathInfo.original[paths.toParts(sortedPaths[i]).pop()];
            }

            sourcePathInfo.setSubPaths(sortedPaths);

            args.callee.sourcePathInfo = sourcePathInfo;

            return result;
        },
        "filter": gelFilter,
        "findOne": function(scope, args) {
            var source = args.next(),
                functionToCompare = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source),
                result,
                caller = args.callee;

            if (Array.isArray(source)) {

                fastEach(source, function(item, index){
                    if(scope.callWith(functionToCompare, [item], caller)){
                        result = item;
                        sourcePathInfo.drillTo(index);
                        args.callee.sourcePathInfo = sourcePathInfo;
                        return true;
                    }
                });
                return result;
            }
        },
        "concat":function(scope, args){
            var result = [],
                argCount = 0,
                sourcePathInfo = new SourcePathInfo(),
                sourcePaths = [];

            var addPaths = function(argToken){
                var argSourcePathInfo = argToken.sourcePathInfo;

                if(argSourcePathInfo){
                    if(Array.isArray(argSourcePathInfo.subPaths)){
                        sourcePaths = sourcePaths.concat(argSourcePathInfo.subPaths);
                    }else if(argSourcePathInfo.path){
                        for(var i = 0; i < argToken.result.length; i++){
                            sourcePaths.push(paths.append(argSourcePathInfo.path, paths.create(i)));
                        }
                    }
                }else{
                    // Non-path-tracked array
                    var nullPaths = [];
                    for(var i = 0; i < argToken.result.length; i++) {
                        nullPaths.push(null);
                    };
                    sourcePaths = sourcePaths.concat(nullPaths);
                }
            };

            while(argCount < args.length){
                if(result == null || !result.concat){
                    return undefined;
                }
                var nextRaw = args.getRaw(argCount, true);
                if(Array.isArray(nextRaw.result)){
                    result = result.concat(nextRaw.result);
                    addPaths(nextRaw);
                }
                argCount++;
            }
            sourcePathInfo.subPaths = sourcePaths;
            args.callee.sourcePathInfo = sourcePathInfo;
            return result;
        },
        "join":function(scope, args){
            args = args.all();

            return args.slice(1).join(args[0]);
        },
        "slice":function(scope, args){
            var sourceTokenIndex = 0,
                source = args.next(),
                start,
                end,
                sourcePathInfo;

            if(args.hasNext()){
                start = source;
                source = args.next();
                sourceTokenIndex++;
            }
            if(args.hasNext()){
                end = source;
                source = args.next();
                sourceTokenIndex++;
            }

            if(!source || !source.slice){
                return;
            }

            if(typeof source !== 'string'){

                // clone source
                source = source.slice();

                sourcePathInfo = new SourcePathInfo(args.getRaw(sourceTokenIndex), source, true);

                if(sourcePathInfo.path){
                    if(sourcePathInfo.innerPathInfo && sourcePathInfo.innerPathInfo.subPaths){
                        sourcePathInfo.setSubPaths(sourcePathInfo.innerPathInfo.subPaths.slice(start, end));
                    }else{
                        sourcePathInfo.mapSubPaths(source);
                        sourcePathInfo.setSubPaths(sourcePathInfo.subPaths.slice(start, end));
                    }
                }
            }

            var result = source.slice(start, end);

            args.callee.sourcePathInfo = sourcePathInfo;

            return result;
        },
        "split":function(scope, args){
            var target = args.next();
            return target ? target.split(args.hasNext() && args.next()) : undefined;
        },
        "last":function(scope, args){
            var source = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source),
                lastIndex;

            if(!Array.isArray(source)){
                return;
            }

            lastIndex = Math.max(0, source.length - 1);

            sourcePathInfo.drillTo(lastIndex);

            args.callee.sourcePathInfo = sourcePathInfo;

            return source[lastIndex];
        },
        "first":function(scope, args){
            var source = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source);

            sourcePathInfo.drillTo(0);

            args.callee.sourcePathInfo = sourcePathInfo;

            if(!Array.isArray(source)){
                return;
            }
            return source[0];
        },
        "length":function(scope, args){
            var value = args.next();
            return value != null ? value.length : undefined;
        },
        "getValue":function(scope, args){
            var source = args.next(),
                key = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source);

            sourcePathInfo.drillTo(key);

            args.callee.sourcePathInfo = sourcePathInfo;

            if(!source || typeof source !== 'object'){
                return;
            }

            return source[key];
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
                    if(!scope.callWith(comparitor, [objectToCompare[key], reference[key]], this)){
                        result = false;
                    }
                }
            }

            return result;
        },
        "contains": function(scope, args){
            var args = args.all(),
                target = args.shift(),
                success = false,
                strict = false,
                arg;

            if(target == null){
                return;
            }

            if(typeof target === 'boolean'){
                strict = target;
                target = args.shift();
            }

            arg = args.pop();

            if(target == null || !target.indexOf){
                return;
            }

            if(typeof arg === "string" && !strict){
                arg = arg.toLowerCase();

                if(Array.isArray(target)){
                    fastEach(target, function(targetItem){
                        if(typeof targetItem === 'string' && targetItem.toLowerCase() === arg.toLowerCase()){
                            return success = true;
                        }
                    });
                }else{
                    if(typeof target === 'string' && target.toLowerCase().indexOf(arg)>=0){
                        return success = true;
                    }
                }
                return success;
            }else{
                return target.indexOf(arg)>=0;
            }
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
        "toUpperCase":function(scope, args){
            var target = args.next();

            if(typeof target !== 'string'){
                return undefined;
            }

            return target.toUpperCase();
        },
        "format": function format(scope, args) {
            var args = args.all();

            if(!args[0]){
                return;
            }

            return stringFormat(args.shift(), args);
        },
        "refine": function(scope, args){
            var allArgs = args.all(),
                exclude = typeof allArgs[0] === "boolean" && allArgs.shift(),
                original = allArgs.shift(),
                refined = {},
                sourcePathInfo = new SourcePathInfo(args.getRaw(exclude ? 1 : 0), original, true);

            for(var i = 0; i < allArgs.length; i++){
                allArgs[i] = allArgs[i].toString();
            }


            for(var key in original){
                if(allArgs.indexOf(key)>=0){
                    if(!exclude){
                        refined[key] = original[key];
                        sourcePathInfo.setSubPath(key, key);
                    }
                }else if(exclude){
                    refined[key] = original[key];
                    sourcePathInfo.setSubPath(key, key);
                }
            }

            args.callee.sourcePathInfo = sourcePathInfo;

            return refined;
        },
        "date": (function(){
            var date = function(scope, args) {
                return args.length ? new Date(args.length > 1 ? args.all() : args.next()) : new Date();
            };

            date.addDays = function(scope, args){
                var baseDate = args.next();

                return new Date(baseDate.setDate(baseDate.getDate() + args.next()));
            };

            return date;
        })(),
        "toJSON":function(scope, args){
            return JSON.stringify(args.next());
        },
        "fromJSON":function(scope, args){
            return JSON.parse(args.next());
        },
        "map":function(scope, args){
            var source = args.next(),
                sourcePathInfo = new SourcePathInfo(args.getRaw(0), source, true),
                isArray = Array.isArray(source),
                isObject = typeof source === 'object' && source !== null,
                result = isArray ? [] : {},
                functionToken = args.next();

            if(isArray){
                fastEach(source, function(item, index){
                    var callee = {};
                    result[index] = scope.callWith(functionToken, [
                        new ValueToken(item, new SourcePathInfo(args.getRaw(0), source), index)
                    ], callee);
                    if(callee.sourcePathInfo){
                        sourcePathInfo.subPaths[index] = callee.sourcePathInfo.path;
                    }
                });
            }else if(isObject){
                for(var key in source){
                    var callee = {};
                    result[key] = scope.callWith(functionToken, [
                        new ValueToken(source[key], new SourcePathInfo(args.getRaw(0), source), key)
                    ], callee);
                    if(callee.sourcePathInfo){
                        sourcePathInfo.subPaths[key] = callee.sourcePathInfo.path;
                    }
                }
            }else{
                return null;
            }

            args.callee.sourcePathInfo = sourcePathInfo;

            return result;
        },
        "fold": function(scope, args){
            var fn = args.get(2),
                seedToken = args.getRaw(1, true),
                seed = args.get(1),
                sourceToken = args.getRaw(0, true),
                source = args.get(0),
                result = seed;


            var sourcePathInfo = new SourcePathInfo(sourceToken, source, true);
            sourcePathInfo.mapSubPaths(source);

            if(!source || !source.length){
                return result;
            }

            var resultPathInfo = seedToken.sourcePathInfo;

            for(var i = 0; i < source.length; i++){
                var callee = {};
                result = scope.callWith(
                    fn,
                    [
                        new ValueToken(result, resultPathInfo),
                        new ValueToken(source[i], sourcePathInfo, i),
                        i
                    ],
                    callee
                );

                resultPathInfo = callee.sourcePathInfo;
            }

            args.callee.sourcePathInfo = resultPathInfo;

            return result;
        },
        "partial": function(scope, outerArgs){
            var fn = outerArgs.get(0),
                caller = outerArgs.callee;

            return function(scope, innerArgs){
                var result = scope.callWith(fn, outerArgs.raw().slice(1).concat(innerArgs.raw()), caller);

                innerArgs.callee.sourcePathInfo = outerArgs.callee.sourcePathInfo;

                return result;
            };
        },
        "flip": function(scope, args){
            var outerArgs = args.all().reverse(),
                fn = outerArgs.pop(),
                caller = args.callee;

            return function(scope, args){
                return scope.callWith(fn, outerArgs, caller);
            };
        },
        "compose": function(scope, args){
            var outerArgs = args.all().reverse(),
                caller = args.callee;

            return function(scope, args){
                var result = scope.callWith(outerArgs[0], args.all(),caller);

                for(var i = 1; i < outerArgs.length; i++){
                    result = scope.callWith(outerArgs[i], [result],caller);
                }

                return result;
            };
        },
        "apply": function(scope, args){
            var fn = args.next(),
                outerArgs = args.next();

            return scope.callWith(fn, outerArgs, args.callee);
        },
        "zip": function(scope, args){
            var allArgs = args.all(),
                result = [],
                maxLength = 0;

            for(var i = 0; i < allArgs.length; i++){
                if(!Array.isArray(allArgs[i])){
                    allArgs.splice(i,1);
                    i--;
                    continue;
                }
                maxLength = Math.max(maxLength, allArgs[i].length);
            }

            for (var itemIndex = 0; itemIndex < maxLength; itemIndex++) {
                for(var i = 0; i < allArgs.length; i++){
                    if(allArgs[i].length >= itemIndex){
                        result.push(allArgs[i][itemIndex]);
                    }
                }
            }

            return result;
        },
        "keyFor": function(scope, args){
            var value = args.next(),
                target = args.next();

            for(var key in target){
                if(!target.hasOwnProperty(key)){
                    continue;
                }

                if(target[key] === value){
                    return key;
                }
            }
        },
        "regex": function(scope, args){
            var all = args.all();

            return new RegExp(all[0], all[1]);
        },
        "match": function(scope, args){
            var string = args.next();

            if(typeof string !== 'string'){
                return false;
            }

            return string.match(args.next());
        }
    };

function createMathFunction(key){
    return function(scope, args){
        var all = args.all();
        return Math[key].apply(Math, all);
    };
}

scope.math = {};

var mathFunctionNames = ['abs','acos','asin','atan','atan2','ceil','cos','exp','floor','imul','log','max','min','pow','random','round','sin','sqrt','tan'];

for(var i = 0; i < mathFunctionNames.length; i++){
    var key = mathFunctionNames[i];
    scope.math[key] = createMathFunction(key);
}


Gel = function(){
    var gel = {},
        lang = new Lang();

    gel.lang = lang;
    gel.tokenise = function(expression){
        return gel.lang.tokenise(expression, this.tokenConverters);
    };
    gel.evaluate = function(expression, injectedScope, returnAsTokens){
        var scope = new Scope(this.scope);

        scope.add(injectedScope);

        return lang.evaluate(expression, scope, this.tokenConverters, returnAsTokens);
    };
    gel.tokenConverters = tokenConverters.slice();
    gel.scope = merge({}, scope);

    return gel;
};

for (var i = 0; i < tokenConverters.length; i++) {
    Gel[tokenConverters[i].prototype.name] = tokenConverters[i];
};

Gel.Token = Token;
Gel.Scope = Scope;
module.exports = Gel;
},{"gedi-paths":5,"lang-js":6,"merge":8,"spec-js":9}],3:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.

    However, the code's intention should be transparent.

    *** IE SUPPORT ***

    If you require this library to work in IE7, add the following after declaring crel.

    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;


    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;



*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    // based on http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    var isNode = typeof Node === 'function'
        ? function (object) { return object instanceof Node; }
        : function (object) {
            return object
                && typeof object === 'object'
                && typeof object.nodeType === 'number'
                && typeof object.nodeName === 'string';
        };
    var isArray = function(a){ return a instanceof Array; };
    var appendChild = function(element, child) {
      if(!isNode(child)){
          child = document.createTextNode(child);
      }
      element.appendChild(child);
    };


    function crel(){
        var document = window.document,
            args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = args[0],
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel.attrMap;

        element = isNode(element) ? element : document.createElement(element);
        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(typeof settings !== 'object' || isNode(settings) || isArray(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string
        if((argumentsLength - childIndex) === 1 && typeof args[childIndex] === 'string' && element.textContent !== undefined){
            element.textContent = args[childIndex];
        }else{
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];

                if(child == null){
                    continue;
                }

                if (isArray(child)) {
                  for (var i=0; i < child.length; ++i) {
                    appendChild(element, child[i]);
                  }
                } else {
                  appendChild(element, child);
                }
            }
        }

        for(var key in settings){
            if(!attributeMap[key]){
                element.setAttribute(key, settings[key]);
            }else{
                var attr = crel.attrMap[key];
                if(typeof attr === 'function'){
                    attr(element, settings[key]);
                }else{
                    element.setAttribute(attr, settings[key]);
                }
            }
        }

        return element;
    }

    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    // String referenced so that compilers maintain the property name.
    crel['attrMap'] = {};

    // String referenced so that compilers maintain the property name.
    crel["isNode"] = isNode;

    return crel;
}));

},{}],4:[function(require,module,exports){
module.exports = function detectPath(substring){
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
                return substring.slice(0, index+1);
            }
            index++;
        } while (index < substring.length);
    }
};
},{}],5:[function(require,module,exports){
var detectPath = require('./detectPath');

var pathSeparator = "/",
    upALevel = "..",
    bubbleCapture = "...",
    currentKey = "#",
    rootPath = "",
    pathStart = "[",
    pathEnd = "]",
    pathWildcard = "*";

function pathToRaw(path) {
    return path && path.slice(1, -1);
}

//***********************************************
//
//      Raw To Path
//
//***********************************************

function rawToPath(rawPath) {
    return pathStart + (rawPath == null ? '' : rawPath) + pathEnd;
}

var memoisePathCache = {};
function resolvePath() {
    var memoiseKey,
        pathParts = [];

    for(var argumentIndex = arguments.length; argumentIndex--;){
        pathParts.unshift.apply(pathParts, pathToParts(arguments[argumentIndex]));
        if(isPathAbsolute(arguments[argumentIndex])){
            break;
        }
    }

    memoiseKey = pathParts.join(',');

    if(memoisePathCache[memoiseKey]){
        return memoisePathCache[memoiseKey];
    }

    var absoluteParts = [],
        lastRemoved,
        pathParts,
        pathPart;

    for(var pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++){
        pathPart = pathParts[pathPartIndex];

        if (pathPart === currentKey) {
            // Has a last removed? Add it back on.
            if(lastRemoved != null){
                absoluteParts.push(lastRemoved);
                lastRemoved = null;
            }
        } else if (pathPart === rootPath) {
            // Root path? Reset parts to be absolute.
            absoluteParts = [''];

        } else if (pathPart.slice(-bubbleCapture.length) === bubbleCapture) {
            // deep bindings
            if(pathPart !== bubbleCapture){
                absoluteParts.push(pathPart.slice(0, -bubbleCapture.length));
            }
        } else if (pathPart === upALevel) {
            // Up a level? Remove the last item in absoluteParts
            lastRemoved = absoluteParts.pop();
        } else if (pathPart.slice(0,2) === upALevel) {
            var argument = pathPart.slice(2);
            //named
            while(absoluteParts[absoluteParts.length - 1] !== argument){
                if(absoluteParts.length === 0){
                    throw "Named path part was not found: '" + pathPart + "', in path: '" + arguments[argumentIndex] + "'.";
                }
                lastRemoved = absoluteParts.pop();
            }
        } else {
            // any following valid part? Add it to the absoluteParts.
            absoluteParts.push(pathPart);
        }
    }

    // Convert the absoluteParts to a Path and memoise the result.
    return memoisePathCache[memoiseKey] = createPath(absoluteParts);
}

var memoisedPathTokens = {};

function createPath(path){

    if(typeof path === 'number'){
        path = path.toString();
    }

    if(path == null){
        return rawToPath();
    }

    // passed in an Expression or an 'expression formatted' Path (eg: '[bla]')
    if (typeof path === "string"){

        if(memoisedPathTokens[path]){
            return memoisedPathTokens[path];
        }

        if(path.charAt(0) === pathStart) {
            var pathString = path.toString(),
                detectedPath = detectPath(pathString);

            if (detectedPath && detectedPath.length === pathString.length) {
                return memoisedPathTokens[pathString] = detectedPath;
            } else {
                return false;
            }
        }else{
            return createPath(rawToPath(path));
        }
    }

    if(path instanceof Array) {

        var parts = [];
        for (var i = 0; i < path.length; i++) {
            var pathPart = path[i];
            pathPart = pathPart.replace(/([\[|\]|\\|\/])/g, '\\$1');
            parts.push(pathPart);
        }
        if(parts.length === 1 && parts[0] === rootPath){
            return createRootPath();
        }
        return rawToPath(parts.join(pathSeparator));
    }
}

function createRootPath(){
    return createPath([rootPath, rootPath]);
}

function pathToParts(path){
    var pathType = typeof path;

    if(pathType !== 'string' && pathType !== 'number'){
        if(Array.isArray(path)){
            return path;
        }
        return;
    }

    // if we haven't been passed a path, then turn the input into a path
    if (!isPath(path)) {
        path = createPath(path);
        if(path === false){
            return;
        }
    }

    path = path.slice(1,-1);

    if(path === ""){
        return [];
    }

    var lastPartIndex = 0,
        parts,
        nextChar,
        currentChar;

    if(path.indexOf('\\') < 0){
        return path.split(pathSeparator);
    }

    parts = [];

    for(var i = 0; i < path.length; i++){
        currentChar = path.charAt(i);
        if(currentChar === pathSeparator){
            parts.push(path.slice(lastPartIndex,i));
            lastPartIndex = i+1;
        }else if(currentChar === '\\'){
            nextChar = path.charAt(i+1);
            if(nextChar === '\\'){
                path = path.slice(0, i) + path.slice(i + 1);
            }else if(nextChar === ']' || nextChar === '['){
                path = path.slice(0, i) + path.slice(i + 1);
            }else if(nextChar === pathSeparator){
                parts.push(path.slice(lastPartIndex), i);
            }
        }
    }
    parts.push(path.slice(lastPartIndex));

    return parts;
}

function appendPath(){
    var parts = pathToParts(arguments[0]);

    if(!parts){
        return;
    }

    if(isPathRoot(arguments[0])){
        parts.pop();
    }

    for (var argumentIndex = 1; argumentIndex < arguments.length; argumentIndex++) {
        var pathParts = pathToParts(arguments[argumentIndex]);

        pathParts && parts.push.apply(parts, pathParts);
    }

    return createPath(parts);
}

function isPath(path) {
    if(!(typeof path === 'string' || (path instanceof String))){
        return;
    }
    var match = path.match(/\[.*?(?:\\\])*(?:\\\[)*\]/g);
    if(match && match.length === 1 && match[0] === path){
        return true;
    }
}

function isPathAbsolute(path){
    var parts = pathToParts(path);

    if(parts == null){
        return false;
    }

    return parts[0] === rootPath;
}

function isPathRoot(path){
    var parts = pathToParts(path);
    if(parts == null){
        return false;
    }
    return (isPathAbsolute(parts) && parts[0] === parts[1]) || parts.length === 0;
}

function isBubbleCapturePath(path){
    var parts = pathToParts(path),
        lastPart = parts[parts.length-1];
    return lastPart && lastPart.slice(-bubbleCapture.length) === bubbleCapture;
}

module.exports = {
    resolve: resolvePath,
    create: createPath,
    is: isPath,
    isAbsolute: isPathAbsolute,
    isRoot: isPathRoot,
    isBubbleCapture: isBubbleCapturePath,
    append: appendPath,
    toParts: pathToParts,
    createRoot: createRootPath,
    constants:{
        separator: pathSeparator,
        upALevel: upALevel,
        currentKey: currentKey,
        root: rootPath,
        start: pathStart,
        end: pathEnd,
        wildcard: pathWildcard
    }
};
},{"./detectPath":4}],6:[function(require,module,exports){
(function (process){
var Token = require('./token');

function fastEach(items, callback) {
    for (var i = 0; i < items.length; i++) {
        if (callback(items[i], i, items)) break;
    }
    return items;
}

var now;

if(typeof process !== 'undefined' && process.hrtime){
    now = function(){
        var time = process.hrtime();
        return time[0] + time[1] / 1000000;
    };
}else if(typeof performance !== 'undefined' && performance.now){
    now = function(){
        return performance.now();
    };
}else if(Date.now){
    now = function(){
        return Date.now();
    };
}else{
    now = function(){
        return new Date().getTime();
    };
}

function callWith(fn, fnArguments, calledToken){
    if(fn instanceof Token){
        fn.evaluate(scope);
        fn = fn.result;
    }
    var argIndex = 0,
        scope = this,
        args = {
            callee: calledToken,
            length: fnArguments.length,
            raw: function(evaluated){
                var rawArgs = fnArguments.slice();
                if(evaluated){
                    fastEach(rawArgs, function(arg){
                        if(arg instanceof Token){
                            arg.evaluate(scope);
                        }
                    });
                }
                return rawArgs;
            },
            getRaw: function(index, evaluated){
                var arg = fnArguments[index];

                if(evaluated){
                    if(arg instanceof Token){
                        arg.evaluate(scope);
                    }
                }
                return arg;
            },
            get: function(index){
                var arg = fnArguments[index];

                if(arg instanceof Token){
                    arg.evaluate(scope);
                    return arg.result;
                }
                return arg;
            },
            hasNext: function(){
                return argIndex < fnArguments.length;
            },
            next: function(){
                if(!this.hasNext()){
                    throw "Incorrect number of arguments";
                }
                if(fnArguments[argIndex] instanceof Token){
                    fnArguments[argIndex].evaluate(scope);
                    return fnArguments[argIndex++].result;
                }
                return fnArguments[argIndex++];
            },
            all: function(){
                var allArgs = [];
                while(this.hasNext()){
                    allArgs.push(this.next());
                }
                return allArgs;
            }
        };

    return fn(scope, args);
}

function Scope(oldScope){
    this.__scope__ = {};
    if(oldScope){
        this.__outerScope__ = oldScope instanceof Scope ? oldScope : {__scope__:oldScope};
    }
}
Scope.prototype.get = function(key){
    var scope = this;
    while(scope && !scope.__scope__.hasOwnProperty(key)){
        scope = scope.__outerScope__;
    }
    return scope && scope.__scope__[key];
};
Scope.prototype.set = function(key, value, bubble){
    if(bubble){
        var currentScope = this;
        while(currentScope && !(key in currentScope.__scope__)){
            currentScope = currentScope.__outerScope__;
        }

        if(currentScope){
            currentScope.set(key, value);
        }
    }
    this.__scope__[key] = value;
    return this;
};
Scope.prototype.add = function(obj){
    for(var key in obj){
        this.__scope__[key] = obj[key];
    }
    return this;
};
Scope.prototype.isDefined = function(key){
    if(key in this.__scope__){
        return true;
    }
    return this.__outerScope__ && this.__outerScope__.isDefined(key) || false;
};
Scope.prototype.callWith = callWith;

// Takes a start and end regex, returns an appropriate parse function
function createNestingParser(closeConstructor){
    return function(tokens, index, parse){
        var openConstructor = this.constructor,
            position = index,
            opens = 1;

        while(position++, position <= tokens.length && opens){
            if(!tokens[position]){
                throw "Invalid nesting. No closing token was found";
            }
            if(tokens[position] instanceof openConstructor){
                opens++;
            }
            if(tokens[position] instanceof closeConstructor){
                opens--;
            }
        }

        // remove all wrapped tokens from the token array, including nest end token.
        var childTokens = tokens.splice(index + 1, position - 1 - index);

        // Remove the nest end token.
        childTokens.pop();

        // parse them, then add them as child tokens.
        this.childTokens = parse(childTokens);
    };
}

function scanForToken(tokenisers, expression){
    for (var i = 0; i < tokenisers.length; i++) {
        var token = tokenisers[i].tokenise(expression);
        if (token) {
            return token;
        }
    }
}

function sortByPrecedence(items, key){
    return items.slice().sort(function(a,b){
        var precedenceDifference = a[key] - b[key];
        return precedenceDifference ? precedenceDifference : items.indexOf(a) - items.indexOf(b);
    });
}

function tokenise(expression, tokenConverters, memoisedTokens) {
    if(!expression){
        return [];
    }

    if(memoisedTokens && memoisedTokens[expression]){
        return memoisedTokens[expression].slice();
    }

    tokenConverters = sortByPrecedence(tokenConverters, 'tokenPrecedence');

    var originalExpression = expression,
        tokens = [],
        totalCharsProcessed = 0,
        previousLength,
        reservedKeywordToken;

    do {
        previousLength = expression.length;

        var token;

        token = scanForToken(tokenConverters, expression);

        if(token){
            expression = expression.slice(token.length);
            totalCharsProcessed += token.length;
            tokens.push(token);
            continue;
        }

        if(expression.length === previousLength){
            throw "Unable to determine next token in expression: " + expression;
        }

    } while (expression);

    memoisedTokens && (memoisedTokens[originalExpression] = tokens.slice());

    return tokens;
}

function parse(tokens){
    var parsedTokens = 0,
        tokensByPrecedence = sortByPrecedence(tokens, 'parsePrecedence'),
        currentToken = tokensByPrecedence[0],
        tokenNumber = 0;

    while(currentToken && currentToken.parsed == true){
        currentToken = tokensByPrecedence[tokenNumber++];
    }

    if(!currentToken){
        return tokens;
    }

    if(currentToken.parse){
        currentToken.parse(tokens, tokens.indexOf(currentToken), parse);
    }

    // Even if the token has no parse method, it is still concidered 'parsed' at this point.
    currentToken.parsed = true;

    return parse(tokens);
}

function evaluate(tokens, scope){
    scope = scope || new Scope();
    for(var i = 0; i < tokens.length; i++){
        var token = tokens[i];
        token.evaluate(scope);
    }

    return tokens;
}

function printTopExpressions(stats){
    var allStats = [];
    for(var key in stats){
        allStats.push({
            expression: key,
            time: stats[key].time,
            calls: stats[key].calls,
            averageTime: stats[key].averageTime
        });
    }

    allStats.sort(function(stat1, stat2){
        return stat2.time - stat1.time;
    }).slice(0, 10).forEach(function(stat){
        console.log([
            "Expression: ",
            stat.expression,
            '\n',
            'Average evaluation time: ',
            stat.averageTime,
            '\n',
            'Total time: ',
            stat.time,
            '\n',
            'Call count: ',
            stat.calls
        ].join(''));
    });
}

function Lang(){
    var lang = {},
        memoisedTokens = {},
        memoisedExpressions = {};


    var stats = {};

    lang.printTopExpressions = function(){
        printTopExpressions(stats);
    }

    function addStat(stat){
        var expStats = stats[stat.expression] = stats[stat.expression] || {time:0, calls:0};

        expStats.time += stat.time;
        expStats.calls++;
        expStats.averageTime = expStats.time / expStats.calls;
    }

    lang.parse = parse;
    lang.tokenise = function(expression, tokenConverters){
        return tokenise(expression, tokenConverters, memoisedTokens);
    };
    lang.evaluate = function(expression, scope, tokenConverters, returnAsTokens){
        var langInstance = this,
            memoiseKey = expression,
            expressionTree,
            evaluatedTokens,
            lastToken;

        if(!(scope instanceof Scope)){
            scope = new Scope(scope);
        }

        if(Array.isArray(expression)){
            return evaluate(expression , scope).slice(-1).pop();
        }

        if(memoisedExpressions[memoiseKey]){
            expressionTree = memoisedExpressions[memoiseKey].slice();
        } else{
            expressionTree = langInstance.parse(langInstance.tokenise(expression, tokenConverters, memoisedTokens));

            memoisedExpressions[memoiseKey] = expressionTree;
        }


        var startTime = now();
        evaluatedTokens = evaluate(expressionTree , scope);
        addStat({
            expression: expression,
            time: now() - startTime
        });

        if(returnAsTokens){
            return evaluatedTokens.slice();
        }

        lastToken = evaluatedTokens.slice(-1).pop();

        return lastToken && lastToken.result;
    };

    lang.callWith = callWith;
    return lang;
};

Lang.createNestingParser = createNestingParser;
Lang.Scope = Scope;
Lang.Token = Token;

module.exports = Lang;
}).call(this,require('_process'))
},{"./token":7,"_process":10}],7:[function(require,module,exports){
function Token(substring, length){
    this.original = substring;
    this.length = length;
}
Token.prototype.name = 'token';
Token.prototype.precedence = 0;
Token.prototype.valueOf = function(){
    return this.result;
}

module.exports = Token;
},{}],8:[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.1.3
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	function merge() {

		var items = Array.prototype.slice.call(arguments),
			result = items.shift(),
			deep = (result === true),
			size = items.length,
			item, index, key;

		if (deep || typeOf(result) !== 'object')

			result = {};

		for (index=0;index<size;++index)

			if (typeOf(item = items[index]) === 'object')

				for (key in item)

					result[key] = deep ? clone(item[key]) : item[key];

		return result;

	}

	function clone(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = clone(input[index]);

		}

		return output;

	}

	function typeOf(input) {

		return ({}).toString.call(input).match(/\s([\w]+)/)[1].toLowerCase();

	}

	if (isNode) {

		module.exports = merge;

	} else {

		window.merge = merge;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],9:[function(require,module,exports){
Object.create = Object.create || function (o) {
    if (arguments.length > 1) {
        throw new Error('Object.create implementation only accepts the first parameter.');
    }
    function F() {}
    F.prototype = o;
    return new F();
};

function createSpec(child, parent){
    var parentPrototype;

    if(!parent) {
        parent = Object;
    }

    if(!parent.prototype) {
        parent.prototype = {};
    }

    parentPrototype = parent.prototype;

    child.prototype = Object.create(parent.prototype);
    child.prototype.__super__ = parentPrototype;
    child.__super__ = parent;

    // Yes, This is 'bad'. However, it runs once per Spec creation.
    var spec = new Function("child", "return function " + child.name + "(){child.__super__.apply(this, arguments);return child.apply(this, arguments);}")(child);

    spec.prototype = child.prototype;
    spec.prototype.constructor = child.prototype.constructor = spec;
    spec.__super__ = parent;

    return spec;
}

module.exports = createSpec;
},{}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1]);
