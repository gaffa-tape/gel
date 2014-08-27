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