const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const User=require('../models/User');

exports.showLogin=(req,res)=>res.render('auth/login',{error:null,message:req.query.reset==='success'?'Password reset successfully. You can now log in.':null});

exports.showRegister=(req,res)=>res.render('auth/register',{error:null});

exports.register=async(req,res)=>{
  try{
    const {name,username,email,phone,password}=req.body;
    if(!name||!username||!email||!password)
      return res.render('auth/register',{error:'Name, username, email and password are required.'});

    const exists=await User.findOne({$or:[{username},{email:email.toLowerCase()}]});
    if(exists)
      return res.render('auth/register',{error:'Username or email already exists.'});

    const user=await User.create({
      name,username,email,phone,
      passwordHash:await bcrypt.hash(password,12)
    });

    req.login(user,()=>res.redirect('/'));
  }catch(e){
    res.render('auth/register',{error:e.code===11000?'Username or email already exists.':e.message});
  }
};

exports.login=async(req,res)=>{
  try{
    const {identifier,password}=req.body;
    const value=(identifier||'').trim();
    let u=await User.findOne({
      $or:[
        {email:value.toLowerCase()},
        {username:value},{adminId:value},
        {phone:value}
      ]
    });
    if(!u||!u.passwordHash||!(await bcrypt.compare(password,u.passwordHash)))
      return res.render('auth/login',{error:'Invalid username/email/phone or password.'});

    req.login(u,()=>res.redirect(u.role==='admin'?'/admin':'/'));
  }catch(e){
    res.render('auth/login',{error:e.message});
  }
};

exports.showForgot=(req,res)=>res.render('auth/forgot',{error:null,message:null,devResetUrl:null});

exports.forgot=async(req,res)=>{
  try{
    const email=(req.body.email||'').trim().toLowerCase();
    const user=await User.findOne({email,role:'customer'});

    // Always return the same generic message so the page does not reveal
    // whether an email exists in the database.
    if(!user){
      return res.render('auth/forgot',{
        error:null,
        message:'If an account exists for this email, a password reset link has been prepared.',
        devResetUrl:null
      });
    }

    const rawToken=crypto.randomBytes(32).toString('hex');
    user.resetTokenHash=crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetTokenExpiresAt=new Date(Date.now()+30*60*1000);
    await user.save();

    const base=process.env.BASE_URL||'http://localhost:3000';
    const resetUrl=`${base}/reset-password/${rawToken}`;

    // Optional SMTP support. Without SMTP credentials, show the link in
    // development so the complete flow can still be tested locally.
    let sent=false;
    if(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS){
      try{
        const nodemailer=require('nodemailer');
        const transporter=nodemailer.createTransport({
          host:process.env.SMTP_HOST,
          port:Number(process.env.SMTP_PORT||587),
          secure:String(process.env.SMTP_SECURE)==='true',
          auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}
        });
        await transporter.sendMail({
          from:process.env.SMTP_FROM||process.env.SMTP_USER,
          to:user.email,
          subject:'Salon Appointment - Reset your password',
          html:`<p>Hello ${user.name},</p><p>Use the link below to reset your password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`
        });
        sent=true;
      }catch(mailError){
        console.error('Password reset email failed:',mailError.message);
      }
    }

    res.render('auth/forgot',{
      error:null,
      message:sent
        ? 'If an account exists for this email, a password reset link has been sent.'
        : 'Development mode: use the reset link below. Configure SMTP before production.',
      devResetUrl:sent?null:resetUrl
    });
  }catch(e){
    res.render('auth/forgot',{error:e.message,message:null,devResetUrl:null});
  }
};

exports.showReset=async(req,res)=>{
  const tokenHash=crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user=await User.findOne({
    resetTokenHash:tokenHash,
    resetTokenExpiresAt:{$gt:new Date()},
    role:'customer'
  });
  if(!user) return res.status(400).render('error',{message:'This password reset link is invalid or expired.'});
  res.render('auth/reset',{token:req.params.token,error:null});
};

exports.reset=async(req,res)=>{
  try{
    const {password,confirmPassword}=req.body;
    if(!password||password.length<6)
      return res.render('auth/reset',{token:req.params.token,error:'Password must be at least 6 characters.'});
    if(password!==confirmPassword)
      return res.render('auth/reset',{token:req.params.token,error:'Passwords do not match.'});

    const tokenHash=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({
      resetTokenHash:tokenHash,
      resetTokenExpiresAt:{$gt:new Date()},
      role:'customer'
    });
    if(!user) return res.status(400).render('error',{message:'This password reset link is invalid or expired.'});

    user.passwordHash=await bcrypt.hash(password,12);
    user.resetTokenHash=undefined;
    user.resetTokenExpiresAt=undefined;
    await user.save();
    res.redirect('/login?reset=success');
  }catch(e){
    res.render('auth/reset',{token:req.params.token,error:e.message});
  }
};

exports.logout=(req,res)=>req.logout(()=>res.redirect('/'));
exports.googleCallback=(req,res)=>res.redirect('/');
