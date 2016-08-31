var e = module.exports = {}
var bu = require('./../util.js')
var wordsearch = require('wordsearch')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = 'wordsearch';
e.info = 'Gives you wordsearch help';
e.category = bu.CommandType.GENERAL

e.execute = (msg, words, text) => {
    if (words.length > 1) {
        words.shift();
        switch (words.shift().toLowerCase()) {
            case 'create':
                initWordSearch(msg, words);
                break;
            case 'create-size':
                initWordSearch(msg, words, [words.shift(), words.shift()])
                break;
            case 'guess':
                wordSearchGuess(msg, words);
                break;
            case 'solve':
                solveWordSearch(msg);
                break;
            default:
                bu.sendMessageToDiscord(msg.channel.id, `\`\`\`xl
wordsearch create <words...> 
    - creates a 10x10 wordsearch with provided words
wordsearch create-size <x> <y> <words...>
    - creates a custom-sized wordsearch with provided words
wordsearch solve
    - solves the current wordsearch\`\`\``);

                break;
        }
    } else {
        bu.sendMessageToDiscord(msg.channel.id, `\`\`\`xl
wordsearch create <words...> 
    - creates a 10x10 wordsearch with provided words
wordsearch create-size <x> <y> <words...>
    - creates a custom-sized wordsearch with provided words
wordsearch solve
    - solves the current wordsearch\`\`\``);

    }
}

var ongoingSearches = {};
var alphaChart = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
    6: 'G',
    7: 'H',
    8: 'I',
    9: 'J',
    10: 'K',
    11: 'L',
    12: 'M',
    13: 'N',
    14: 'O',
    15: 'P',
    16: 'Q',
    17: 'R',
    18: 'S',
    19: 'T',
    20: 'U',
    21: 'V',
    22: 'W',
    23: 'X',
    24: 'Y',
    25: 'Z',
    26: 'AA',
    27: 'AB',
    28: 'AC',
    29: 'AD'
}


function wordSearchGuess(msg, words) {

}

function initWordSearch(msg, words, size) {
    //   words.shift();
    if (!size) {
        size = [10, 10];
    }
    if (size[0] > 20 || size[1] > 20) {
        bu.sendMessageToDiscord(msg.channel.id, 'The maximum size is 20!')
        return;
    }
    var search = wordsearch(words, size[0], size[1])
    ongoingSearches[msg.channel.id] = search;
    var line1 = ''
    var line2 = ''
    var output = '```xl\n'
    for (var i = 0; i < search.grid[0].length; i++) {
        if (size[0] > 10)
            if (i < 10) {
                line1 += ` ${i}`;
                line2 += `  `;
            }
            else {
                line1 += ` ${Math.floor(i / 10)}`;
                line2 += ` ${i % 10}`;
            }
        else
            line1 += ` ${i}`;
    }
    output += line1 + (size[0] > 10 ? '\n' + line2 : '') + '\n';
    console.log(line1, '\n', line2)
    for (var i = 0; i < search.grid[0].length; i++) {
        output += '--';
    }
    output += '-+\n';
    for (var i = 0; i < search.grid.length; i++) {
        for (var ii = 0; ii < search.grid[i].length; ii++) {
            output += ` ${search.grid[i][ii].toUpperCase()}`
        }
        output += ` | ${alphaChart[i]}\n`;
    }
    output += '\n```'

    bu.sendMessageToDiscord(msg.channel.id, output);
}

function solveWordSearch(msg) {

    // var search = wordsearch(words, size[0], size[1])
    var search = ongoingSearches[msg.channel.id];
    var output = '```xl\n'
    var line1 = '';
    var line2 = '';
    for (var i = 0; i < search.grid[0].length; i++) {
        if (search.grid[0].length > 10)
            if (i < 10) {
                line1 += ` ${i}`;
                line2 += `  `;
            }
            else {
                line1 += ` ${Math.floor(i / 10)}`;
                line2 += ` ${i % 10}`;
            }
        else
            line1 += ` ${i}`;
    }

    output += line1 + +(search.grid[0].length > 10 ? '\n' + line2 : '') + '\n';
    for (var i = 0; i < search.solved[0].length; i++) {
        output += ` ${i}`;
    }
    output += '\n';
    for (var i = 0; i < search.solved[0].length; i++) {
        output += '--';
    }
    output += '-+\n';
    for (var i = 0; i < search.solved.length; i++) {
        for (var ii = 0; ii < search.solved[i].length; ii++) {
            output += ` ${search.solved[i][ii].toUpperCase()}`
        }
        output += ` | ${alphaChart[i]}\n`;
    }
    output += '\n```'

    bu.sendMessageToDiscord(msg.channel.id, output);
}