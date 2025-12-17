const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const clienteService = require('../services/cliente/clientes.services');

// En config/passport.config.js - AGREGAR DEBUG COMPLETO
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/clientes/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔐 === GOOGLE PROFILE COMPLETO ===');
        console.log('🔐 Profile ID:', profile.id);
        console.log('🔐 Profile Provider:', profile.provider);
        console.log('🔐 Display Name:', profile.displayName);
        console.log('🔐 Emails:', profile.emails);
        console.log('🔐 Photos:', profile.photos);
        console.log('🔐 Profile RAW:', JSON.stringify(profile, null, 2));
        console.log('🔐 === FIN GOOGLE PROFILE ===');
        
        const cliente = await clienteService.autenticarSocial(profile);
        done(null, cliente);
    } catch (err) {
        console.error(' Error en Google Strategy:', err);
        done(err, null);
    }
}));
// Estrategia Facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/clientes/facebook/callback", // 
    profileFields: ['id', 'emails', 'name', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔐 Facebook Profile:', profile);
        const cliente = await clienteService.autenticarSocial(profile);
        done(null, cliente);
    } catch (err) {
        console.error('Error en Facebook Strategy:', err);
        done(err, null);
    }
}));

// Serialización
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;