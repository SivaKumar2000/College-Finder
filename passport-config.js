const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByUserName){
    const authenticateUser =async (username,password,done) =>{
        const user = getUserByUserName(username)
        if( user == null){
            return done(null, false, {message: "No user with that email"})
        }

        try{
            if( await bcrypt.compare(password, user.password)){
                return done(null,user)
            }else{
                return done(null, false , {message : "Password Incorrect"})
            }
        }catch(e){
            return done(e)
        }
    }

    passport.use( new LocalStrategy(function (username, password, done) {
        User.findOne({ username: username }, function(err,user){
            if(err) return done(err);
            if(!user) return done(null,false,{ message: 'Incorrect Username'});

            bcrypt.compare(password, user.password, function(err, res){
                if(err) return done(err);
                if(res==false) return done(null, false, { message:'Incorrect Password.'});

                return done(null,user);
            });
        });
    }));
    passport.serializeUser(function( user , done){
        done(null,user.username);
    });
    passport.deserializeUser(function(username, done){
        Admin.findByUsername(username, function(err, user){
            done(err, user);
        });
    });
}

module.exports = initialize