/**
Here comes a very opinionated if. I want to show publicly posts only if they match ALL of the following:
- top flag is true
- topic is 0
- they have been upvoted at least the delta T time / 2 times.
Human memory is a funny thing. It fades. Higlights and the lows stay.
The further you go to the future, the more likely that a specific memory
will diminish. Thereby memories have to be maintained by us. If they are
important lessons of life, they will just come up again and again.
The other catch here, is within memories with a close proximity.
With recent events, we have much stronger feelings than with the 
ones already having perspective. Hence we keep them in front of our
eyes.
 */
try {
    if (typeof (moment) === 'undefined') {
        moment = require('moment')
    }
}
catch (e) {
    //yeah
    console.warn(e)
}
function isThisPostPublic(post) {
    return post.top &&
        post.topic === 0 &&
        (
            isWithinHalfYear(post) ||
            post.grade &&
            post.grade > (minimumGradeToBeVisible(post))
        )
}

function isWithinHalfYear(post) {
    return (moment().diff(moment(post.date), 'year') / 2) < 1
}

function minimumGradeToBeVisible(post) {
    return (moment().diff(moment(post.date), 'year') / 2)
}

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = isThisPostPublic
    module.exports.minimumGradeToBeVisible = minimumGradeToBeVisible
    module.exports.isWithinHalfYear = isWithinHalfYear

}