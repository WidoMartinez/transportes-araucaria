import { Reserva } from './backend/models/index.js';
async function test() {
  const r = await Reserva.findOne({ order: [['id', 'DESC']] });
  console.log(JSON.stringify(r.toJSON(), null, 2));
  process.exit(0);
}
test();
