import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/geojson/kab bogor/KAB_BOGOR_OUTLINE.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

console.log('Geometry Type:', data.geometry?.type);
console.log('Coordinates Length:', data.geometry?.coordinates?.length);
if (data.geometry?.coordinates) {
  console.log('Outer ring coordinates count:', data.geometry.coordinates[0]?.length);
}
