const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const { UnauthorizedError, BadRequestError } = require('./error');
const AdminServices = require("../service/admin.services");
const SuperAdminServices = require("../service/superAdmin.services");

passport.use('Adminlocal', new localStrategy({ usernameField: 'email' }, async (username, password, done) => {
    console.log("username" , username);
    try{
        const adminService = new AdminServices();
        const admin = await adminService.login(username);
        if (!admin) {
            return done(null, false, new BadRequestError({ message: `The email address ${username} is not associated with any account.` }));
        }
        const isMatch = await admin.compareHashedPassword(password);
        if (!isMatch) {
            return done(null, false, new UnauthorizedError({ message: 'Invalid email or password' }));
        }
        return done(null, true, admin);
    }catch(err){ 
        console.log('passport error',err);
        return done(null, false, err);
    }
}));

passport.use('SuperAdminLocal', new localStrategy({ usernameField: 'email' }, async (username, password, done) => {
    try{
        const superAdminService = new SuperAdminServices();
        const superAdmin = await superAdminService.login(username);
        console.log("superAdmin" , superAdmin);
        if (!superAdmin) {
            return done(null, false, new BadRequestError({ message: `The email address ${username} is not associated with any account.` }));
        }
        const isMatch = await superAdmin.compareHashedPassword(password);
        if (!isMatch) {
            return done(null, false, new UnauthorizedError({ message: 'Invalid email or password' }));
        }
        return done(null, true, superAdmin);
    }catch(err){ 
        console.log('passport error',err);
        return done(null, false, err);
    }
}));