const config = require('./../config.json'),
    _ = require('underscore'),
    db = require('./db')

exports.renderEntries = function (res, template, entries, extend) {
    let years = []
    let year = 2007
    while (year < new Date().getFullYear()) years.push(year++)

    res.render(template, _.extend({
        eras: db.db.tags,
        years: years,
        config: config,        
        entries: entries.map(formatBody)
    }, extend))
}

function formatBody(entry) {
    // entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "$1" + config.serverRoot + "/$2$3");
    // entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "'/$2$3");
    try{
        entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "$1$2$3");
    }
    catch(e){
        console.error(entry)
        debugger;
    }
    return entry
}
