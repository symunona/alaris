
// Here comes a very opinionated if. I want to show publicly posts only if they match ALL of the following:
// - top flag is true
// - topic is 0
// - they have been upvoted at least the delta T time / 2 times.
try{
    if (typeof(moment)=== 'undefined'){
        moment = require('moment')
    }
}
catch(e){
    //yeah
    console.warn(e)
}
function isThisPostPublic(post) {
	return post.top &&
		post.topic === 0 &&
		(
			(moment().diff(moment(post.date), 'year') / 2) < 1 ||
			post.grade &&
			post.grade > (moment().diff(moment(post.date), 'year') / 2)
		)
}

if (typeof(module.exports)!== 'undefined') {
    module.exports = isThisPostPublic
}