var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `pop`;
e.args = `&lt;pop&gt;`;
e.usage = `{pop;array}`;
e.desc = `Returns the last element in an array. If used with {get} or {aget}, this will remove the last element from the array as well.`;
e.exampleIn = `{pop;["this", "is", "an", "array"]}`;
e.exampleOut = `array`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args1 = params.args[1];
        let deserialized = await bu.getArray(params, args1);

        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = deserialized.v.pop();
            if (deserialized.n) {
                await bu.setArray(deserialized, params);
            }
        } else {
            replaceString = await bu.tagProcessError(params, '`Not an array`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};