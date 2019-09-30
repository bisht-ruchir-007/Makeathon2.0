const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
//const OutlookStrategy = require("passport-outlook").Strategy;

const { Users } = require("./db");

passport.use(
  "local",
  new LocalStrategy((username, password, done) => {
    Users.findOne({
      where: {
        username
      }
    })
      .then(user => {
        if (!user) {
          return done(null, false, {
            message: "Username is not valid"
          });
        }

        if (user.password != password) {
          return done(null, false, {
            message: "Password is INCORRECT!!!"
          });
        }
        done(null, user);
      })
      .catch(done);
  })
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

module.exports = passport;
