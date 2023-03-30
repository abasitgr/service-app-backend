module.exports.RegularExp= Object.freeze({
    specialChar: /^[A-Za-z ]+$/,
    password:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{5,64}$/
})