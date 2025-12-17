const passport = require('passport');

// 🔴 OAuth DESACTIVADO TEMPORALMENTE
// No registramos Google ni Facebook por ahora

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
