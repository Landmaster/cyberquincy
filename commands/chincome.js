// Spreadsheets with round income data
const chimps = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
const h = require('../helpers/general.js');

// Discord library
const Discord = require('discord.js');

// Discord bot sidebar colors
const colors = require('../jsons/colours.json');

const OptionalParser = require('../parser/optional-parser.js');
const RoundParser = require('../parser/round-parser.js');
const ModeParser = require('../parser/mode-parser.js');
const AnyOrderParser = require('../parser/any-order-parser');

module.exports = {
    name: 'chincome',

    // Main executable function
    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR', 'HALFCASH'),
                    'CHIMPS' // default if not provided
                ),
                new RoundParser('IMPOPPABLE')
            )
        );

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        return message.channel.send(chincomeMessage(parsed.mode, parsed.round));
    },

    helpMessage(message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('`q!chincome` HELP')
            .addField(
                '`q!chincome <round> (<gamemode>)` (Order agnostic)',
                '  • Cash generated during round <round>\n' +
                    '  • Cash generated from start of round 6 through end of round <round>\n' +
                    '  • Cash generated from start of round <round> through end of round 100'
            )
            .addField('Valid `(<gamemode>)` values', 'CHIMPS, HALFCASH, ABR')
            .addField('Valid `<round>` values', '6, 7, ..., 100')
            .addField('Ex. #1', 'q!chincome <round> | q!chincome 8')
            .addField('Ex. #2', 'q!chincome <mode> <round> | q!chincome abr R8')
            .addField(
                'Ex. #3',
                'q!chincome <round> <mode> | q!chincome r8 halfcash'
            );

        return message.channel.send(errorEmbed);
    },

    errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Likely Cause(s)', parsingErrors.join('\n'))
            .addField('Type `q!chincome` for help', ':)')
            .setColor(colors['orange']);

        return message.channel.send(errorEmbed);
    },
};

chincomeMessage = function (mode, round) {
    incomes = calculateIncomes(mode, round);

    var mode_str_iden = (function (mode) {
        switch (mode) {
            case 'HALFCASH':
                return 'Half Cash';
            case 'CHIMPS':
                return 'Standard';
            default:
                return mode.toUpperCase();
        }
    })(mode);

    return new Discord.MessageEmbed()
        .setTitle(`${mode_str_iden} CHIMPS Income (R${round})`)
        .addField(
            `Income gained from just round ${round} itself`,
            `$${h.numberWithCommas(incomes.rincome)}`
        )
        .addField(
            `Total cash gained through the end of round ${round}`,
            `$${h.numberWithCommas(incomes.chincome)}`
        )
        .addField(
            `Income gained from start of round ${round} to end of R100`,
            `$${h.numberWithCommas(incomes.lincome)}`
        )
        .setColor(colours['cyber']);
};

// rincome = round income
// chincome = cumulative income (CHIMPS with modifier specified by `mode`)
// lincome = left income (income left over i.e. cash from start of round to end of R100)
calculateIncomes = function (mode, round) {
    chincome = null;
    rincome = null;

    if (mode == 'abr') {
        index = round - 2;

        chincome = abr[index][1] - abr[3][1] + 650;
        rincome = abr[index][0];
        lincome = abr[98][1] - abr[index - 1][1];
    } else {
        index = round;

        chincome =
            chimps[index].cumulativeCash - chimps[5].cumulativeCash + 650;
        rincome = chimps[index].cashThisRound;
        lincome = chimps[100].cumulativeCash - chimps[index - 1].cumulativeCash;

        if (mode == 'halfcash') {
            chincome /= 2;
            rincome /= 2;
            lincome /= 2;
        }
    }

    return {
        rincome: rincome.toFixed(1),
        chincome: chincome.toFixed(1),
        lincome: lincome.toFixed(1),
    };
};
