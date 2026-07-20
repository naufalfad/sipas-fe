import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/geojson/kab bogor/ADMINISTRASIDESA_AR_25K.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

const wadmkkValues = new Set();
data.features.forEach(f => {
  if (f.properties && f.properties.WADMKK) {
    wadmkkValues.add(f.properties.WADMKK);
  }
});

console.log('Unique WADMKK values:', Array.from(wadmkkValues));
console.log('Total features:', data.features.length);
console.log('Sample properties:', data.features[0]?.properties);
