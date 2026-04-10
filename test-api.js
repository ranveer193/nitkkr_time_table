const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/timetabl');
  console.log('Connected to DB');

  const Building = require('./backend/models/Building');
  const b = await Building.create({ name: 'DeleteTest', code: 'DT' });
  console.log('Created building:', b._id);

  const bObj = await Building.findById(b._id);
  console.log('Can find:', !!bObj);

  bObj.isDeleted = true;
  await bObj.save();
  console.log('Soft deleted');

  const bAfter = await Building.findById(b._id);
  console.log('Can find normally:', !!bAfter);

  const bAfterAll = await Building.findById(b._id).setOptions({ includeDeleted: true });
  console.log('Can find with includeDeleted:', !!bAfterAll);

  // If user meant "database deletion doesn't happen", they definitely meant they checked MongoDB and the records are still there.
  
  await mongoose.disconnect();
}
test().catch(console.error);
