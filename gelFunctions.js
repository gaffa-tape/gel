;(function(){
    
    var gel = window.gel,
        gaffa = window.gaffa,
        tokenResult = gel.tokenResult;
    
    if(!gel){
        return;   
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
    
    
    
})();