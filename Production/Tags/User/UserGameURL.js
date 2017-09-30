const { User } = require.main.require('./Tag/Classes');

class UserGameURL extends User {
    constructor(client) {
        super(client, {
            name: 'gameurl',
            args: [
                {
                    name: 'user',
                    optional: true
                }
            ],
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let user = ctx.user, member;
        if (args[0]) {
            user = await ctx.client.Helpers.Resolve.user(ctx, args[0].toString(), true);
        }
        if (user)
            member = ctx.guild.members.get(user.id);
        return res.setContent(member && member.game ? member.game.url : '');
    }
}

module.exports = UserGameURL;