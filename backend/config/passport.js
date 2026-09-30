const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleEmail =
            profile.emails?.[0]?.value?.toLowerCase();

          // Check whether the customer is already registered
          let user = await User.findOne({
            email: googleEmail
          });

          // Not registered → do not create account
          if (!user) {
            return done(null, false, {
              message: 'Account not found. Please register first.'
            });
          }

          // Registered account → connect Google account if needed
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            await user.save();
          }

          return done(null, user);

        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;