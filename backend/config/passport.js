const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
if(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET){
 passport.use(new GoogleStrategy({clientID:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,callbackURL:process.env.GOOGLE_CALLBACK_URL},async(_a,_r,p,done)=>{
   try{
    let user=await User.findOne({googleId:p.id});
    if(!user) user=await User.findOne({email:p.emails?.[0]?.value?.toLowerCase()});
    if(!user) user=await User.create({name:p.displayName,email:p.emails?.[0]?.value?.toLowerCase(),googleId:p.id,authProvider:'google'});
    else if(!user.googleId){user.googleId=p.id;user.authProvider='google';await user.save();}
    done(null,user);
   }catch(e){done(e);}
 }));
}
passport.serializeUser((u,done)=>done(null,u.id));
passport.deserializeUser(async(id,done)=>{try{done(null,await User.findById(id));}catch(e){done(e);}});
module.exports=passport;
