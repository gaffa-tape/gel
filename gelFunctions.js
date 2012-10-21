;(function(){
    
    var gel = window.gel,
        gaffa = window.gaffa,
        tokenResult = gel.tokenResult;
    
    if(!gel){
        return;   
    }
	
	function toArray(args){
		return Array.prototype.slice.call(args);
	}
    
    //Token Converters
    
    gel.tokenConverters.others["path"] = function(expression) {
        if (expression[0] === '[') {
            var index = 1,
                escapes = 0;
            do {
                if (expression[index] === '\\' && (expression[index + 1] === '[' || expression[index + 1] === ']')) {
                    expression = expression.slice(0, index) + expression.slice(index + 1);
                    index++;
                    escapes++;
                }
                else {
                    index++;
                }
            } while (expression[index] !== ']' && index < expression.length);
    
            if (index > 1) {
                return tokenResult(
                //expression.slice(0, index + 1),
    
                    expression.slice(0, index + 1),
                    index + escapes + 1, // don't ask me why, this just works
                    null,
                    function() {
                        return gaffa.model.get(expression.slice(0, index + 1), gaffa.model.get.context, true);
                    }
                );
            }
        }
    };
    
    //Functions
        
    gel.functions["caseInsenstiveCompare"] = function caseInsenstiveCompare(){
        var argsLength = arguments.length;
        if (argsLength <= 1) throw "caseInsenstiveCompare function needs more than one argument";
        for (var i = 1; i < argsLength; i++) {
            if (arguments[i].toLowerCase() !== arguments[i - 1].toLowerCase()) return false;
        }
        return true;
    };
    
    gel.functions["refine"] = function refine(){
        var args = toArray(arguments),
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
    };
    
    gel.functions["compose"] = function compose(){
		var args = toArray(arguments).reverse();
			
        return function(){
			var result = args[0].apply(this, arguments);
			for(var i = 1; i < args.length; i++){
				result = args[i].call(this, result);
			}
			return result;
		};
    };	
    
    gel.functions["each"] = function each(){
		var args = toArray(arguments),
			fn = args.pop(),
			array = args[0],
			result = [];
		
		if(args.length > 1){
			array = args;
		}
			
        for(var i = 0; i < array.length; i++){
			result[i] = fn(array[i]);
		}
		
		return result;
    };
    
    gel.functions["fold"] = function fold(){
		var args = toArray(arguments),
			fn = args.pop(),
			seed = args.pop(),
			array = args[0],
			result = seed;
		
		if(args.length > 1){
			array = args;
		}
			
        for(var i = 0; i < array.length; i++){
			result = fn.call(this, result, array[i]);
		}
		
		return result;
    };
    
    gel.functions["partial"] = function partial(){
		var args = toArray(arguments),
			fn = args.shift();
		
		return function(){
			var innerArgs = toArray(arguments);
			return fn.apply(this, args.concat(innerArgs));
		};
    };
    
    gel.functions["flip"] = function flip(){
		var fn = arguments[0];
		
		return function(){
			return fn.apply(this, toArray(arguments).reverse())
		};
    };
})();