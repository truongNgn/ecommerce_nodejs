const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Ensure environment variables are loaded
require('dotenv').config();

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile);
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({ 
      'socialLogin.provider': 'google',
      'socialLogin.providerId': profile.id 
    });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.socialLogin = {
        provider: 'google',
        providerId: profile.id,
        profilePicture: profile.photos[0]?.value
      };
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = await User.create({
      email: profile.emails[0].value,
      fullName: profile.displayName,
      socialLogin: {
        provider: 'google',
        providerId: profile.id,
        profilePicture: profile.photos[0]?.value
      },
      isEmailVerified: true // Google emails are pre-verified
    });
    
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'picture'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Facebook OAuth Strategy - Profile received:', {
      id: profile.id,
      emails: profile.emails,
      name: profile.name,
      photos: profile.photos
    });
    
    // Validate profile data
    if (!profile.id) {
      console.error('❌ Facebook profile missing ID');
      return done(new Error('Facebook profile missing ID'), null);
    }
    
    if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
      console.error('❌ Facebook profile missing email');
      return done(new Error('Facebook profile missing email'), null);
    }
    
    const email = profile.emails[0].value;
    const fullName = profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : 'Facebook User';
    
    // Check if user already exists with this Facebook ID
    let user = await User.findOne({ 
      'socialLogin.provider': 'facebook',
      'socialLogin.providerId': profile.id 
    });
    
    if (user) {
      console.log('✅ Found existing Facebook user:', user.email);
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: email });
    
    if (user) {
      console.log('✅ Found existing user with same email, linking Facebook account');
      // Link Facebook account to existing user
      user.socialLogin = {
        provider: 'facebook',
        providerId: profile.id,
        profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      };
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    console.log('✅ Creating new Facebook user:', email);
    user = await User.create({
      email: email,
      fullName: fullName,
      socialLogin: {
        provider: 'facebook',
        providerId: profile.id,
        profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      },
      isEmailVerified: true // Facebook emails are pre-verified
    });
    
    console.log('✅ Facebook user created successfully:', user.email);
    return done(null, user);
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
