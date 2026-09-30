const User=require('../models/User');
const RewardHistory=require('../models/RewardHistory');

async function getDiscount(userId){
  if(!userId) return 0;
  const u=await User.findById(userId);
  // The 6th completed appointment unlocks and receives the reward.
  return u && u.rewardCount===5 ? u.rewardDiscount : 0;
}

async function registerCompletedVisit(userId,bookingId,discountApplied=0){
  if(!userId) return null;
  const u=await User.findById(userId);
  if(!u) return null;

  u.rewardCount += 1;

  if(u.rewardCount >= 6){
    u.rewardCycle += 1;
    const cycle=u.rewardCycle;
    await RewardHistory.create({
      customer:u._id,
      booking:bookingId,
      cycle,
      visitsRequired:6,
      discountPercent:discountApplied || u.rewardDiscount
    });
    u.rewardCount=0;
  }

  await u.save();
  return u;
}

module.exports={getDiscount,registerCompletedVisit};
