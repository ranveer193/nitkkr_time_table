const mongoose = require('mongoose');
const Building = require('./backend/models/Building');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/timetabl');
  
  const b = await Building.create({ name: 'Test Build', code: 'TB' });
  console.log('Created:', b._id);
  
  b.isDeleted = true;
  await b.save();
  console.log('Soft deleted');
  
  const b2 = await Building.findById(b._id).setOptions({ includeDeleted: true });
  console.log('Still in DB:', !!b2);
  
  await mongoose.disconnect();
}
test().catch(console.error);
