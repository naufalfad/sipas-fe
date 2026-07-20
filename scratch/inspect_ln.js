import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/geojson/kab bogor/ADMINISTRASI_LN_25K.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

console.log('Total features in LN:', data.features.length);
console.log('Sample properties in LN:', data.features[0]?.properties);
const remarks = new Set();
data.features.forEach(f => {
  if (f.properties && f.properties.REMARK) {
    remarks.add(f.properties.REMARK);
  }
});
console.log('Unique REMARK values:', Array.from(remarks));
