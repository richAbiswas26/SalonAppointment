require('dotenv').config();const app=require('./app');const connectDB=require('./config/db');const {seed}=require('./controllers/adminController');const PORT=process.env.PORT||3000;
(async()=>{try{await connectDB();await seed();app.listen(PORT,()=>console.log(`Salon app running at http://localhost:${PORT}`));}catch(e){console.error(e);process.exit(1);}})();
