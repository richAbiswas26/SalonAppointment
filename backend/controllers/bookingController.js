const Booking=require('../models/Booking');
const Service=require('../models/Service');
const SlotSetting=require('../models/SlotSetting');
const User=require('../models/User');
const bookingCode=require('../utils/code');
const {getDiscount}=require('../services/rewardService');

const slots=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

function cart(req){return req.session.cart||[];}
function todayString(){return new Date().toISOString().slice(0,10);}

exports.addToCart=async(req,res)=>{
  const s=await Service.findById(req.body.serviceId);
  if(!s||!s.active)return res.status(404).send('Service unavailable');
  const members=Math.max(1,parseInt(req.body.members||1));
  const c=cart(req);
  const found=c.find(x=>x.serviceId===s.id);
  if(found)found.members+=members;
  else c.push({serviceId:s.id,name:s.name,price:s.price,members});
  req.session.cart=c;
  res.redirect('/cart');
};

exports.cart=(req,res)=>{
  const items=cart(req);
  res.render('customer/cart',{
    items,
    subtotal:items.reduce((a,x)=>a+x.price*x.members,0)
  });
};

exports.updateCart=(req,res)=>{
  const c=cart(req);
  const i=c.find(x=>x.serviceId===req.body.serviceId);
  if(i)i.members=Math.max(1,parseInt(req.body.members||1));
  req.session.cart=c;
  res.redirect('/cart');
};

exports.removeCart=(req,res)=>{
  req.session.cart=cart(req).filter(x=>x.serviceId!==req.body.serviceId);
  res.redirect('/cart');
};

exports.bookingPage=async(req,res)=>{
  if(!cart(req).length)return res.redirect('/services');
  const discount=await getDiscount(req.user?.id);
  res.render('customer/booking',{
    items:cart(req),
    discount,
    user:req.user,
    error:null
  });
};

exports.availableSlots=async(req,res)=>{
  const value=req.query.date;
  if(!value)return res.json([]);
  const date=new Date(value+'T00:00:00');
  if(Number.isNaN(date.getTime())||value<todayString())return res.json([]);

  const booked=await Booking.find({
    date,
    status:{$in:['booked','confirmed']}
  }).select('slot');

  const settings=await SlotSetting.find({date});
const dayClosed=settings.some(s=>s.dayClosed===true);

if(dayClosed){
  return res.json({
    dayClosed:true,
    message:'Salon is closed on this date.'
  });
}

const now=new Date();

  const result=slots.map(slot=>{
    let available=true;
    const closed=settings.some(s=>s.slot===slot&&s.closed);
    const isBooked=booked.some(b=>b.slot===slot);

    if(closed||isBooked)available=false;

    // On the current date, hide slots that have already started.
    if(value===todayString()){
      const [h,m]=slot.split(':').map(Number);
      const slotTime=new Date();
      slotTime.setHours(h,m,0,0);
      if(slotTime<=now)available=false;
    }

    return {slot,closed,booked:isBooked,available};
  });

  res.json(result);
};

exports.create=async(req,res)=>{
  try{
    const {date,slot,guestName,contactEmail,contactPhone}=req.body;

    if(!date||!slot)
      return res.render('customer/booking',{items:cart(req),discount:0,user:req.user,error:'Date and time are required.'});

    if(!req.user && !contactEmail && !contactPhone)
      return res.render('customer/booking',{items:cart(req),discount:0,user:req.user,error:'Please provide an email address or phone number.'});

    const d=new Date(date+'T00:00:00');
    if(Number.isNaN(d.getTime())||date<todayString())
      return res.render('customer/booking',{items:cart(req),discount:0,user:req.user,error:'Past dates are not allowed.'});

    const existing=await Booking.findOne({
      date:d,
      slot,
      status:{$in:['booked','confirmed']}
    });
    if(existing)
      return res.render('customer/booking',{items:cart(req),discount:0,user:req.user,error:'This slot is no longer available.'});

    const settings=await SlotSetting.findOne({date:d,slot,closed:true});
    if(settings)
      return res.render('customer/booking',{items:cart(req),discount:0,user:req.user,error:'This slot is closed by the salon.'});

    const discount=await getDiscount(req.user?.id);
    const items=cart(req).map(x=>({
      service:x.serviceId,
      name:x.name,
      price:x.price,
      members:x.members
    }));
    const subtotal=items.reduce((a,x)=>a+x.price*x.members,0);
    const discountAmount=subtotal*discount/100;

    const b=await Booking.create({
      bookingCode:bookingCode(),
      customer:req.user?.id,
      guestName:guestName||req.user?.name,
      contactEmail:contactEmail||req.user?.email,
      contactPhone:contactPhone||req.user?.phone,
      date:d,slot,items,subtotal,
      discountPercent:discount,
      discountAmount,
      finalTotal:subtotal-discountAmount
    });

    req.session.cart=[];
    res.render('customer/booking-success',{booking:b});
  }catch(e){
    res.render('error',{message:e.message});
  }
};

exports.history=async(req,res)=>
  res.render('customer/history',{bookings:await Booking.find({customer:req.user.id}).sort('-createdAt')});

exports.cancel=async(req,res)=>{
  const b=await Booking.findOne({
    _id:req.params.id,
    customer:req.user.id,
    status:{$in:['booked','confirmed']}
  });
  if(!b)return res.status(404).render('error',{message:'Booking not found.'});
  b.status='cancelled';
  b.cancelledBy='customer';
  b.cancelledAt=new Date();
  await b.save();
  res.redirect('/booking-history');
};

exports.subscription=async(req,res)=>{
  const RewardHistory=require('../models/RewardHistory');
  const u=await User.findById(req.user.id);
  const history=await Booking.find({customer:req.user.id,status:'completed'}).sort('-completedAt');
  const rewards=await RewardHistory.find({customer:req.user.id}).populate('booking').sort('-unlockedAt');
  res.render('customer/subscription',{user:u,history,rewards});
};

exports.profile=async(req,res)=>res.render('customer/profile',{user:req.user});

exports.updateProfile=async(req,res)=>{
  const u=await User.findById(req.user.id);
  u.name=req.body.name;
  u.username=req.body.username;
  u.email=req.body.email;
  u.phone=req.body.phone;
  if(req.body.password)u.passwordHash=require('bcryptjs').hashSync(req.body.password,12);
  await u.save();
  res.redirect('/profile');
};
