const Context = require('../Structures/Context');
const Helpers = require('./index.js');

/**
 * Decodes and sends a locale key
 * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
 * @param {Member} dest a member object (DM)
 * @param {String} key The locale key
 * @param {Object} [args] Additional arguments for decoding
 * @param {Object} [file] A file to send
 * @param {String} file.name The file's name
 * @param {Buffer} file.file The file's buffer
 */
async function decodeAndSend(dest, key, args, file) {
    return await send(dest, await decode(dest, key, args), file);
}

/**
 * Decodes a locale key
 * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
 * @param {String} key The locale key
 * @param {Object} [args={}] Additional arguments for decoding
 */
async function decode(dest, key, args = {}) {
    let { user, guild } = Helpers.Resolve.generic(dest);
    let localeName;
    if (guild) {
        // TODO: get guild locale
    }
    if (user) {
        // TODO: get author locale
    }
    if (!localeName) {
        localeName = 'en_US';
    }
    let template = _discord.LocaleManager.getTemplate(localeName, key);
    if (template === null) {
        return await decode(dest, 'error.keyundef', { key });
    }

    let recursiveRegex = /\[\[(.+?)\]\]/, match;
    while ((match = recursiveRegex.exec(template)) != null) {
        template = template.replace(new RegExp('\\[\\[' + match[1] + '\\]\\]', 'g'), await decode(dest, match[1], args));
    };

    if (Array.isArray(template)) {
        template = template[Helpers.Random.getRandomInt(0, template.length - 1)];
    }

    for (const arg of Object.keys(args)) {
        let regexp = new RegExp('\{\{' + arg + '\}\}', 'g');
        template = template.replace(regexp, args[arg]);
    }

    return template;
}

/**
 * Sends a message to the provided destination
 * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
 * @param {String} [content=''] 
 * @param {Object} [file] The file to send
 * @param {String} file.name The file's name
 * @param {Buffer} file.file The file's buffer
 */
async function send(dest, content = '', file) {
    let { channel, user, guild } = Helpers.Resolve.generic(dest);
    let destination = await Helpers.Resolve.destination(dest);

    if (channel == undefined && guild == undefined) throw new Error('No such channel or guild');
    else if (channel == undefined && guild != undefined) channel = _discord.getChannel(guild.id);
    if (channel == undefined) throw new Error('No such channel');
    if (typeof content == 'string') {
        content = {
            content
        };
    }
    if (content.content == undefined) content.content = '';
    try {
        if (content.content.length > 2000) {
            return await destination.createMessage(await decode(dest, 'error.messagetoolong'), {
                file: (content.content || '') + '\n\n' + JSON.stringify(content.embed || {}, null, 2),
                name: 'output.json'
            });
        } else if (content.content.length >= 0) {
            return await destination.createMessage(content, file);
        }
    } catch (err) {
        let response;
        if (err.response) {
            try {
                response = JSON.parse(err.response);
            } catch (err) { }
        }
        let Embed = {
            title: response !== undefined ? `${err.name}: ${response.code} - ${response.message}` : err.name,
            description: err.stack.substring(0, 250),
            fields: [],
            color: 0xAD1111,
            timestamp: _dep.moment()
        };
        if (channel.guild) {
            Embed.fields.push({
                name: 'Guild',
                value: `${channel.guild.name}\n${channel.guild.id}`
            });
        }
        Embed.fields.push({
            name: 'Channel',
            value: `${channel.name}\n${channel.id}`
        });
        Embed.fields.push({
            name: 'Content',
            value: `${(content.content || '[]').substring(0, 100)}`
        });
        if (user) {
            Embed.author = {
                name: user.fullNameId,
                icon_url: user.avatarURL
            };
        }
        await _discord.createMessage(_constants.ERROR_CHANNEL, {
            embed: Embed
        }, {
                file: JSON.stringify(content, null, 2),
                name: 'error-output.json'
            });
        throw err;
    }
}

/**
 * @callback verifyCallback
 * The verification callback for awaitMessage
 * @param {Message} msg2 The new message input
 * @returns {Boolean} Whether or not to finalize the await
 */

/**
 * Awaits a message response
 * @param {Context} ctx The context to await the message in 
 * @param {verifyCallback} callback A verification callback
 * @param {Number} [timeout=300000] The amount of time before the await expires. Set to -1 to disable 
 */
function awaitMessage(ctx, callback, timeout = 300000) {
    return new Promise((resolve, reject) => {
        if (_discord.awaitedMessages[ctx.channel.id] == undefined)
            _discord.awaitedMessages[ctx.channel.id] = {};

        callback = callback || function (msg2) {
            return msg2.author.id == ctx.author.id;
        };

        let timer;
        if (timeout > 0)
            timer = setTimeout(function () {
                delete _discord.awaitedMessages[ctx.channel.id][ctx.author.id];
                reject(new Error('Await timed out after ' + timeout + 'ms'));
            }, timeout);

        if (_discord.awaitedMessages[ctx.channel.id][ctx.author.id] != undefined) {
            _discord.awaitedMessages[ctx.channel.id][ctx.author.id].kill();
        }

        _discord.awaitedMessages[ctx.channel.id][ctx.author.id] = {
            callback,
            execute: function (msg2) {
                if (timer != undefined) clearTimeout(timer);
                resolve(msg2);
            },
            kill: function () {
                if (timer != undefined) clearTimeout(timer);
                reject(new Error('Got overwritten by same channel-author pair'));
            }
        };
    });
}

/**
 * Inserts a message into the database
 * @param {Message} msg The message object 
 * @param {Number} type The type of the message - 0 for create, 1 for update, 2 for delete
 */
async function insertMessage(msg, type = 0) {
    if (msg.channel)
        return await _r.table('chatlogs').insert({
            id: type == 0 ? msg.id : Helpers.Snowflake.make(),
            content: msg.content,
            attachment: msg.attachments.length > 0 ? msg.attachments[0].url : undefined,
            userid: msg.author ? msg.author.id : 'unknown',
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: msg.guild ? msg.guild.id : 'DM',
            msgtime: _r.epochTime(msg.timestamp / 1000),
            type
        });
}

module.exports = {
    send, decode, awaitMessage, insertMessage
};