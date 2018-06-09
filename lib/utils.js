const config = require('./../config.json'),
    _ = require('underscore'),
    db = require('./db'),
    isThisPostPublic = require('../public/js/is-public')

exports.renderEntries = function (res, template, entries, extend) {

    res.render(template, _.extend({
        eras: db.db.tags,
        years: extend && extend.admin ? exports.getYearData() : exports.getYearData(isThisPostPublic),
        config: config,
        entries: entries.map(formatEntry)
    }, extend))
}

function formatEntry(entry) {
    // entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "$1" + config.serverRoot + "/$2$3");
    // entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "'/$2$3");
    entry.isPublic = isThisPostPublic(entry)
    entry.isWithinHalfYear = isThisPostPublic.isWithinHalfYear(entry)
    entry.minimumGradeToBeVisible = isThisPostPublic.minimumGradeToBeVisible(entry)
    try {
        entry.body = entry.body.replace(/(<img.+?src *= *[\"'])(?!http:?)(?!https:?)(.+?)([\"'].*?>)/gi, "$1$2$3");
    }
    catch (e) {
        console.error(entry)
        debugger;
    }
    return entry
}

exports.getYearData = function (filter) {
    let map = {}
    let entries = db.db.blog
    if (filter) entries = entries.filter(filter)
    entries.map((e, i) => {
        try{
            let year = e.date.substr(0, 4)
            map[year] = entries.length - 1 - i
        } catch(execption){
            console.warn(e, e.date)
            debugger;
        }
    })
    return map
}

