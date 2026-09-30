const fs=require('fs');
const path=require('path');
const bcrypt=require('bcryptjs');
const User=require('../models/User');
const Category=require('../models/Category');
const Service=require('../models/Service');
const Booking=require('../models/Booking');
const SlotSetting=require('../models/SlotSetting');
const HeroImage=require('../models/HeroImage');
const ContactMessage=require('../models/ContactMessage');
const Revenue=require('../models/Revenue');
const RewardHistory=require('../models/RewardHistory');
const {registerCompletedVisit}=require('../services/rewardService');

const slotList=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const uploadRoot=path.join(__dirname,'../../frontend/uploads');

function removeUpload(url){
  if(!url)return;
  const relative=url.replace(/^\/uploads\//,'');
  const file=path.join(uploadRoot,relative);
  try{if(fs.existsSync(file))fs.unlinkSync(file);}catch(e){console.error('Could not delete image:',e.message);}
}

exports.seed=async()=>{
  let admin=await User.findOne({role:'admin'});
  if(!admin){
    admin=await User.create({
      name:'Salon Admin',
      adminId:process.env.ADMIN_ID||'admin',
      username:process.env.ADMIN_USERNAME||'admin',
      email:process.env.ADMIN_EMAIL||'admin@example.com',
      passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD||'ChangeMe123!',12),
      role:'admin'
    });
  }else if(!admin.adminId){
    admin.adminId=process.env.ADMIN_ID||'admin';
    await admin.save();
  }
};

exports.dashboard=async(req,res)=>{
  const [bookings,revenue,customerCount,completedCount,rewards]=await Promise.all([
    Booking.find().populate('customer').sort('-createdAt').limit(10),
    Revenue.aggregate([{$group:{_id:'$month',total:{$sum:'$amount'}}},{$sort:{_id:-1}}]),
    User.countDocuments({role:'customer'}),
    Booking.countDocuments({status:'completed'}),
    RewardHistory.countDocuments()
  ]);
  res.render('admin/dashboard',{bookings,revenue,customerCount,completedCount,rewards});
};

exports.bookings=async(req,res)=>{
  const bookings=await Booking.find().populate('customer').sort('-date -slot');
  const services=await Service.find({active:true}).sort('name');
  const rewardMap={};
  const customerIds=bookings.filter(b=>b.customer).map(b=>b.customer._id);
  if(customerIds.length){
    const users=await User.find({_id:{$in:customerIds}});
    users.forEach(u=>rewardMap[u.id]=u);
  }
  res.render('admin/bookings',{bookings,services,rewardMap});
};

exports.cancelBooking=async(req,res)=>{
  const b=await Booking.findById(req.params.id);
  if(b&&['booked','confirmed'].includes(b.status)){
    b.status='cancelled';
    b.cancelledBy='admin';
    b.cancelledAt=new Date();
    await b.save();
  }
  res.redirect('/admin/bookings');
};

exports.completeBooking=async(req,res)=>{
  try{
    const b=await Booking.findById(req.params.id);
    if(!b)return res.redirect('/admin/bookings');
    if(b.status==='completed'||b.status==='cancelled')return res.redirect('/admin/bookings');

    let finalItems=b.items;
    if(req.body.items){
      try{finalItems=JSON.parse(req.body.items);}catch(e){return res.status(400).send('Invalid final items.');}
    }

    b.finalItems=finalItems;
    b.subtotal=b.finalItems.reduce((a,x)=>a+Number(x.price)*Number(x.members),0);

    const customer=b.customer?await User.findById(b.customer):null;
    const discount=customer&&customer.rewardCount===5?customer.rewardDiscount:0;

    b.discountPercent=discount;
    b.discountAmount=b.subtotal*discount/100;
    b.finalTotal=b.subtotal-b.discountAmount;
    b.status='completed';
    b.completedAt=new Date();
    await b.save();

    if(customer)await registerCompletedVisit(customer.id,b.id,discount);

    await Revenue.create({
      booking:b.id,
      amount:b.finalTotal,
      month:new Date().toISOString().slice(0,7)
    });

    res.redirect('/admin/bookings');
  }catch(e){
    console.error(e);
    res.status(400).send(e.message);
  }
};

exports.categories = async (req, res) => {
    const categories = await Category.find().sort({ name: 1 });

    res.render('admin/categories', {
        categories,
        error: null
    });
};

exports.editCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.redirect('/admin/categories');
    }

    res.render('admin/edit-category', {
        category,
        error: null
    });
};

exports.createCategory=async(req,res)=>{
  try{
    const name=(req.body.name||'').trim();
    const exists=await Category.findOne({name:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i')});
    if(exists){
      return res.status(409).render('admin/categories',{
        categories:await Category.find().sort('name'),
        error:`Category "${name}" already exists.`
      });
    }
    await Category.create({
      name,
      description:req.body.description,
      image:req.file?'/uploads/categories/'+req.file.filename:''
    });
    res.redirect('/admin/categories');
  }catch(e){
    console.error(e);
    res.status(400).render('admin/categories',{
      categories:await Category.find().sort('name'),
      error:e.code===11000?'Category already exists.':e.message
    });
  }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.redirect('/admin/categories');
        }

        const name = (req.body.name || '').trim();

        const duplicate = await Category.findOne({
            _id: { $ne: category._id },
            name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`, 'i')
        });

        if (duplicate) {
            return res.status(409).render('admin/edit-category', {
                category,
                error: `Category "${name}" already exists.`
            });
        }

        category.name = name;
        category.description = req.body.description || '';

        if (req.file) {
            removeUpload(category.image);
            category.image = '/uploads/categories/' + req.file.filename;
        }

        await category.save();

        res.redirect('/admin/categories');

    } catch (e) {
        console.error(e);

        res.status(400).render('admin/edit-category', {
            category: await Category.findById(req.params.id),
            error: e.code === 11000
                ? 'Category already exists.'
                : e.message
        });
    }
};

exports.deleteCategory=async(req,res)=>{
  const category=await Category.findById(req.params.id);
  if(!category)return res.redirect('/admin/categories');

  const services=await Service.find({category:category._id});
  services.forEach(s=>removeUpload(s.image));
  await Service.deleteMany({category:category._id});
  removeUpload(category.image);
  await category.deleteOne();

  res.redirect('/admin/categories');
};

exports.services=async(req,res)=>{
  res.render('admin/services',{
    services:await Service.find().populate('category').sort('name'),
    categories:await Category.find().sort('name'),
    error:null
  });
};

exports.createService=async(req,res)=>{
  try{
    const name=(req.body.name||'').trim();
    const exists=await Service.findOne({
      category:req.body.category,
      name:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i')
    });
    if(exists){
      return res.status(409).render('admin/services',{
        services:await Service.find().populate('category').sort('name'),
        categories:await Category.find().sort('name'),
        error:`Service "${name}" already exists in this category.`
      });
    }
    await Service.create({
      category:req.body.category,
      name,
      description:req.body.description,
      image:req.file?'/uploads/services/'+req.file.filename:'',
      price:Number(req.body.price)
    });
    res.redirect('/admin/services');
  }catch(e){
    res.status(400).render('admin/services',{
      services:await Service.find().populate('category').sort('name'),
      categories:await Category.find().sort('name'),
      error:e.code===11000?'Service already exists.':e.message
    });
  }
};

exports.deleteService=async(req,res)=>{
  const service=await Service.findById(req.params.id);
  if(service){
    removeUpload(service.image);
    await service.deleteOne();
  }
  res.redirect('/admin/services');
};

exports.hero=async(req,res)=>res.render('admin/hero',{heroes:await HeroImage.find().sort('order')});

exports.createHero=async(req,res)=>{
  if(!req.file)return res.redirect('/admin/hero');
  await HeroImage.create({
    title:req.body.title,
    subtitle:req.body.subtitle,
    image:'/uploads/hero/'+req.file.filename,
    order:Number(req.body.order||0)
  });
  res.redirect('/admin/hero');
};

exports.deleteHero=async(req,res)=>{
  const hero=await HeroImage.findById(req.params.id);
  if(hero){
    removeUpload(hero.image);
    await hero.deleteOne();
  }
  res.redirect('/admin/hero');
};

exports.slots=async(req,res)=>{
  const date=req.query.date||new Date().toISOString().slice(0,10);
  const settings=await SlotSetting.find({date:new Date(date+'T00:00:00')});
  res.render('admin/slots',{date,settings,slots:slotList});
};

exports.toggleSlot=async(req,res)=>{
  const date=new Date(req.body.date+'T00:00:00');
  let s=await SlotSetting.findOne({date,slot:req.body.slot});
  if(!s)s=await SlotSetting.create({date,slot:req.body.slot,closed:true,reason:req.body.reason});
  else{
    s.closed=!s.closed;
    s.reason=req.body.reason;
    await s.save();
  }
  res.redirect('/admin/slots?date='+req.body.date);
};


exports.toggleDay = async (req, res) => {
    const date = new Date(req.body.date + 'T00:00:00');

    const existing = await SlotSetting.findOne({
        date,
        dayClosed: true
    });

    if (existing) {
        // Open the entire day
        await SlotSetting.deleteMany({
            date,
            dayClosed: true
        });
    } else {
        // Close the entire day
        await SlotSetting.deleteMany({ date });

        await SlotSetting.create({
            date,
            slot: '',
            closed: true,
            dayClosed: true,
            reason: req.body.reason || 'Salon closed'
        });
    }

    res.redirect('/admin/slots?date=' + req.body.date);
};

exports.revenue=async(req,res)=>{
  const revenue=await Revenue.aggregate([
    {$group:{_id:'$month',total:{$sum:'$amount'},bookings:{$sum:1}}},
    {$sort:{_id:-1}}
  ]);
  const total=revenue.reduce((sum,row)=>sum+row.total,0);
  res.render('admin/revenue',{revenue,total});
};

exports.customers=async(req,res)=>{
  const customers=await User.find({role:'customer'}).sort('name');
  const counts=await Booking.aggregate([
    {$match:{customer:{$ne:null},status:'completed'}},
    {$group:{_id:'$customer',visits:{$sum:1}}}
  ]);
  const countMap={};
  counts.forEach(x=>countMap[x._id.toString()]=x.visits);
  customers.forEach(c=>c._completedVisits=countMap[c.id]||0);
  res.render('admin/customers',{customers});
};

exports.customerRewards=async(req,res)=>{
  const RewardHistory=require('../models/RewardHistory');
  const rewards=await RewardHistory.find().populate('customer').populate('booking').sort('-unlockedAt');
  res.render('admin/rewards',{rewards});
};

exports.messages=async(req,res)=>res.render('admin/messages',{messages:await ContactMessage.find().sort('-createdAt')});

exports.messageCreate=async(req,res)=>{
  await ContactMessage.create(req.body);
  res.redirect('/');
};

exports.profile=async(req,res)=>res.render('admin/profile',{user:req.user});

exports.updateProfile=async(req,res)=>{
  try{
    const u=await User.findById(req.user.id);
    u.adminId=req.body.adminId;
    u.username=req.body.username;
    u.email=req.body.email;
    if(req.body.password)u.passwordHash=await bcrypt.hash(req.body.password,12);
    await u.save();
    res.redirect('/admin/profile');
  }catch(e){
    res.status(400).send(e.message);
  }
};
