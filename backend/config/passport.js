const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const FacebookStrategy = require('passport-facebook').Strategy;

// Đăng nhập bằng Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: profile.displayName || "Google User",
                email,
                password: Math.random().toString(36).slice(-8),
            });
        }

        return done(null, {
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => done(null, user._id ? user._id.toString() : user));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
});

module.exports = passport;