const router=require('express').Router();
const c=require('../controllers/authController');
const passport=require('../config/passport');

router.get('/login',c.showLogin);
router.post('/login',c.login);
router.get('/register',c.showRegister);
router.post('/register',c.register);

router.get('/forgot-password',c.showForgot);
router.post('/forgot-password',c.forgot);
router.get('/reset-password/:token',c.showReset);
router.post('/reset-password/:token',c.reset);

router.get('/logout',c.logout);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),c.googleCallback);

module.exports=router;
