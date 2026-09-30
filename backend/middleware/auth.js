function requireLogin(req,res,next){if(req.user)return next();res.redirect('/login?next='+encodeURIComponent(req.originalUrl));}
function requireAdmin(req,res,next){if(req.user?.role==='admin')return next();return res.status(403).render('error',{message:'Admin access required'});}
module.exports={requireLogin,requireAdmin};
