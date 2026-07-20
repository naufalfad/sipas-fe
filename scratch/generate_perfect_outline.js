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

console.log('Filtering features for Kabupaten Bogor...');
const bogorFeatures = geojson.features.filter(
  f => f.properties && f.properties.WADMKK === 'Bogor'
);

console.log(`Found ${bogorFeatures.length} features.`);

console.log('Cleaning and buffering geometries to fix topologies...');
const cleanedFeatures = bogorFeatures.map((f, idx) => {
  try {
    // Run buffer(0) to resolve self-intersections and fix polygon topology
    let buffered = turf.buffer(f, 0);
    return buffered;
  } catch (err) {
    console.warn(`Failed cleaning at index ${idx}:`, err.message);
    return f;
  }
});

console.log('Performing turf.union step-by-step...');
let unionResult = cleanedFeatures[0];
let successCount = 1;
let failCount = 0;

for (let i = 1; i < cleanedFeatures.length; i++) {
  try {
    const nextFeature = cleanedFeatures[i];
    // Buffer both features to ensure they are clean
    const cleanUnion = turf.buffer(unionResult, 0);
    const cleanNext = turf.buffer(nextFeature, 0);
    
    const united = turf.union(turf.featureCollection([cleanUnion, cleanNext]));
    if (united) {
      unionResult = united;
      successCount++;
    } else {
      failCount++;
    }
  } catch (err) {
    failCount++;
    // Try to union with a very tiny buffer if simple union fails
    try {
      const bufferedUnion = turf.buffer(unionResult, 0.00001);
      const bufferedNext = turf.buffer(cleanedFeatures[i], 0.00001);
      const united = turf.union(turf.featureCollection([bufferedUnion, bufferedNext]));
      if (united) {
        unionResult = united;
        successCount++;
        failCount--; // remove from failed since it succeeded on retry
      }
    } catch (retryErr) {
      // Ignore and continue
    }
  }
}

console.log(`Union process complete. Success: ${successCount}, Failed: ${failCount}`);

if (!unionResult) {
  console.error('Union resulted in null geometry.');
  process.exit(1);
}

console.log('Simplifying unified outline...');
// Simplify outline to make it lightweight
const simplifiedOutline = turf.simplify(unionResult, { tolerance: 0.0002, highQuality: true });

// Add custom properties
simplifiedOutline.properties = {
  NAMOBJ: 'Kabupaten Bogor Outline',
  REMARK: 'Batas Luar Wilayah Administrasi Kabupaten Bogor'
};

console.log('Writing output file...');
fs.writeFileSync(outputPath, JSON.stringify(simplifiedOutline, null, 2), 'utf8');

console.log('Done! Output size:', (fs.statSync(outputPath).size / 1024).toFixed(2), 'KB');
