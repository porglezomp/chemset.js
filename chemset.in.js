function Token(name, sub) {
    this.string = name;
    this.subscript = sub;
}

function Compound() {
    this.count = null;
    this.charge = undefined;
    this.state = undefined;
    this.tokens = [];
}

// Build a finite state machine
var fsm = {
    state: 'outside',
    tmp: {},
    equation: [],
    transition: {
        'outside': [
            { pattern: /[[(A-Z]/, to: 'new_token' },
            { pattern: /\d/, to: 'count_compound' },
            { pattern: /\s/, to: 'outside' },
            { pattern: /\+/, to: 'outside' },
            { pattern: /-/, to: 'becomes' },
            { pattern: /\0/, to: 'outside' }
        ],
        'count_compound': [
            { pattern: /[[(A-Z]/, to: 'new_token' },
            { pattern: /\d/, to: 'count_compound' }
        ],
        'new_token': [
            { pattern: /[()A-Z[\]]/, to: 'new_token' },
            { pattern: /[a-z]/, to: 'continue_token' },
            { pattern: /\d/, to: 'count_token' },
            { pattern: /[+-]/, to: 'charge' },
            { pattern: /\s/, to: 'charge_wait' },
            { pattern: /\0/, to: 'outside' }
        ],
        'continue_token': [
            { pattern: /[()A-Z[\]]/, to: 'new_token' },
            { pattern: /[a-z]/, to: 'continue_token' },
            { pattern: /\d/, to: 'count_token' },
            { pattern: /[+-]/, to: 'charge' },
            { pattern: /\s/, to: 'charge_wait' },
            { pattern: /\0/, to: 'outside' }
        ],
        'count_token': [
            { pattern: /[()A-Z[\]]/, to: 'new_token' },
            { pattern: /\d/, to: 'count_token' },
            { pattern: /[+-]/, to: 'charge' },
            { pattern: /\s/, to: 'charge_wait' },
            { pattern: /\0/, to: 'outside' }
        ],
        'charge': [
            { pattern: /\s/, to: 'state_wait' },
            { pattern: /\0/, to: 'outside' }
        ],
        'charge_wait': [
            { pattern: /\s/, to: 'charge_wait' },
            { pattern: /\d/, to: 'charge_count' },
            { pattern: /\(/, to: 'state' },
            { pattern: /\+/, to: 'outside' },
            { pattern: /\0/, to: 'outside' }
        ],
        'charge_count': [
            { pattern: /\d/, to: 'charge_count' },
            { pattern: /[+-]/, to: 'charge_end' }
        ],
        'charge_end': [
            { pattern: /\s/, to: 'state_wait' },
            { pattern: /\0/, to: 'outside' }
        ],
        'state_wait': [
            { pattern: /\(/, to: 'state' },
            { pattern: /\+/, to: 'outside' },
            { pattern: /\0/, to: 'outside' }
        ],
        'state': [
            { pattern: /(a|q|s|l)/, to: 'state' },
            { pattern: /\)/, to: 'outside' }
        ],
        'becomes': [
            { pattern: /-/, to: 'becomes' },
            { pattern: />/, to: 'outside' }
        ],
        'error': []
    },
    act: function (character) {
        var tran = this.transition[this.state];
        var l = tran.length;
        var next_state = 'error';
        for (var i = 0; i < l; i++) {
            var obj = tran[i];
            if (obj.pattern.test(character)) {
                next_state = obj.to;
                break;
            }
        }
        // console.log(this.state+" -> "+next_state+" ("+character+")");
        this.state = next_state;
        return this.state;
    }
}

// Parse the string and turn it into a token stream
function parse(text) {
    // Add a null terminator for the FSM to check
    var text = text + "\0"
    var comp = undefined;
    var number = /\d/;
    var whitespace = /\s/;
    // Initialize the FSM
    fsm.state = 'outside';
    fsm.equation = [];
    fsm.tmp = {};
    // Iterate over the string and give each
    // character to the FSM
    for (var i = 0; i < text.length; i++) {
        var character = text[i];
        var state1 = fsm.state;
        var state2 = fsm.act(character);

        // Fail on error
        if (state2 === 'error') {
            return "ERROR at character " + i;
        }
        // Leaving 'outside'
        if (state1 === 'outside' &&
            state2 !== 'outside') {
            comp = new Compound();
            if (state2 !== 'count_compound') {
                comp.count_compound = undefined;
            }
        }
        if (state2 === 'count_compound') {
            // Entering count_compound
            if (state1 === 'outside') {
                fsm.tmp.count_compound = character;
            } else {
                fsm.tmp.count_compound += character;
            }   
        }
       // Add the digit into the token count
        if (state2 === 'count_token') {
            if (state1 !== 'count_token') {
                fsm.tmp.count_string = character;
            } else {
                fsm.tmp.count_string += character;
            }
        }
        // Leaving 'count_token'
        // Save the count into the token
        if (state1 === 'count_token' &&
            state2 !== 'count_token') {
            fsm.tmp.count = parseInt(fsm.tmp.count_string);
        }
        // Leaving 'count_compound'
        if (state1 === 'count_compound' &&
            state2 !== 'count_compound') {
            comp.count = parseInt(fsm.tmp.count_compound);
        }
        // Entering 'outside'
        if (state2 === 'outside' &&
            state1 !== 'outside') {
            if (comp.tokens.length > 0) {
                // If they haven't been set, they'll just
                // set it to undefined again, so no harm
                comp.charge = fsm.tmp.charge;
                fsm.tmp.charge = undefined;
                comp.state = fsm.tmp.state;
                fsm.tmp.state = undefined;
                
                // console.log(comp)
                fsm.equation.push(comp);
            }
        }
        // Save a + or -
        if (state2 === 'charge') {
            fsm.tmp.charge = character;
        }
        if (state2 === 'charge_count' ||
            state2 === 'charge_end') {
            if (state1 === 'charge_wait') {
                fsm.tmp.charge = character;
            } else {
                fsm.tmp.charge += character;
            }
        }
        if (state2 === 'state') {
            if (state1 !== 'state') {
                fsm.tmp.state = "";
            } else {
                if (character !== ")") {
                    fsm.tmp.state += character;
                }
            }
        }
        // Entering 'becomes' (the -->)
        if (state2 === 'becomes' &&
            state1 !== 'becomes') {
            fsm.equation.push("-->");
        }

        // Time to save any potential temporary tokens
        if (state2 === 'new_token' ||
            state2 === 'charge' ||
            state2 === 'charge_wait' ||
            state2 === 'outside') {
            if (fsm.tmp.token_string !== undefined) {
                var token = new Token(fsm.tmp.token_string,
                                       fsm.tmp.count);
                comp.tokens.push(token);
                // console.log(token);
                fsm.tmp.token_string = undefined;
                fsm.tmp.count = undefined;
            }
        }

        if (state2 === 'new_token') {
            fsm.tmp.token_string = character;
        }
        if (state2 === 'continue_token') {
            fsm.tmp.token_string += character;
        }
    }
    return fsm.equation;
}

function format_paragraph(el) {
    // Remove ' + ' from a string
    var stripPlus = function (string) {
        return string.substring(0, string.length - 3);
    };
    var list = el.innerText.match(chemRegex);
    var l = list.length;
    for (var i = 0; i < l; i++) {
        if (list[i].length > 1) {
            var result = parse(list[i]);
            // If the result contains anything
            if (result.length > 0) {
                res_string = '<span class="chemset">';
                var l2 = result.length;
                for (var j = 0; j < l2; j++) {
                    var compound = result[j];
                    if (compound === '-->') {
                        res_string = stripPlus(res_string);
                        res_string += ' <span class="chem-arrow"><span ' +
                            'class="chem-hidden">--></span></span> ';
                    } else {
                        var l3 = compound.tokens.length;
                        if(compound.count) {
                            res_string += compound.count;
                        }
                        for (var t = 0; t < l3; t++) {
                            var token = compound.tokens[t];
                            res_string += token.string
                            if (token.subscript) {
                                res_string += '<span class="chem-sub">' +
                                    token.subscript + '</span>';
                            }
                        }
                        if (compound.charge) {
                            if (compound.charge.length > 1) {
                                // Add an invisible space if it's n+ or n-
                                // This helps reproduce the original input
                                res_string += '<span class="chem-hidden"> ' +
                                    '</span>';
                            }
                            compound.charge = compound.charge.replace("-",
                                '<span class="chem-hidden">-</span>' +
                                '<span class="chem-negative"></span>')
                                .replace("+",'<span class="chem-hidden">' +
                                    '+</span><span class="chem-positive">' +
                                    '</span>')
                            res_string += '<span class="chem-charge">' +
                                compound.charge  + '</span>';
                        }
                        if (compound.state) {
                            res_string += '<span class="chem-hidden"> ' +
                                    '</span><span class="chem-state">(<i>' +
                                compound.state + '</i>)</span>';
                        }
                        res_string += " + "
                    }
                }
                res_string = stripPlus(res_string);
                res_string += '</span>';
                el.innerHTML = el.innerHTML.replace(htmlEscape(list[i]),
                                                      res_string);

            }
        }
    }
}

ready(function () {
    insertCSS(
        '.chem-hidden { font-size: 0; }\n' +
        '.chem-negative:before { font-weight: bold; content: "\u2013"; }\n' +
        '.chem-positive:before { font-weight: bold; content: "+"; }\n' +
        '.chem-arrow:before { content: "\u27F6"; }\n' +
        '.chem-state, .chem-charge, .chem-sub { font-size: 75%; ' +
        'line-height: 0; position: relative; vertical-align: baseline; } \n' +
        '.chem-state, .chem-sub { bottom: -0.25em; }\n' +
        '.chem-charge { top: -0.5em; }'
    );
    format_paragraph(document.querySelectorAll("body")[0]);
});

function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function ready(fn) {
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState === 'interactive')
        fn();
    });
  }
}

function insertCSS(css) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
}