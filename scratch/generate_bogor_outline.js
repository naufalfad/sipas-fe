import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/geojson/kab bogor/ADMINISTRASIDESA_AR_25K.json');
const outputPath = path.join(__dirname, '../public/geojson/kab bogor/KAB_BOGOR_OUTLINE.json');

console.log('Loading GeoJSON...');
const rawData = fs.readFileSync(inputPath, 'utf8');
const geojson = JSON.parse(rawData);

console.log('Filtering features for Kabupaten Bogor (WADMKK === "Bogor")...');
const bogorFeatures = geojson.features.filter(
  f => f.properties && f.properties.WADMKK === 'Bogor'
);

console.log(`Found ${bogorFeatures.length} features.`);

if (bogorFeatures.length === 0) {
  console.error('No features found for WADMKK === "Bogor"');
  process.exit(1);
}

console.log('Merging features into a single polygon...');
// Turf union can take features one by one or fold them
let unionResult = bogorFeatures[0];

for (let i = 1; i < bogorFeatures.length; i++) {
  try {
    unionResult = turf.union(turf.featureCollection([unionResult, bogorFeatures[i]]));
  } catch (err) {
    console.warn(`Failed union for index ${i}:`, err.message);
  }
}

console.log('Simplifying polygon...');
// Simplify with a small tolerance to keep it accurate but extremely lightweight
const simplified = turf.simplify(unionResult, { tolerance: 0.0005, highQuality: true });

console.log('Writing simplified outline to file...');
fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2), 'utf8');

console.log('Done! Output size:', fs.statSync(outputPath).size, 'bytes');
