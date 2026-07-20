import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/geojson/kab bogor/ADMINISTRASIDESA_AR_25K.json');
const outputPath = path.join(__dirname, '../public/geojson/kab bogor/KAB_BOGOR_KECAMATAN.json');

console.log('Loading GeoJSON...');
const rawData = fs.readFileSync(inputPath, 'utf8');
const geojson = JSON.parse(rawData);

console.log('Filtering features for Kabupaten Bogor...');
const bogorFeatures = geojson.features.filter(
  f => f.properties && f.properties.WADMKK === 'Bogor'
);

console.log(`Found ${bogorFeatures.length} features.`);

console.log('Simplifying and cleaning features...');
const processedFeatures = bogorFeatures.map(f => {
  // Simplify geometry
  let simplifiedGeom = f.geometry;
  try {
    simplifiedGeom = turf.simplify(f.geometry, { tolerance: 0.0005, highQuality: true });
  } catch (err) {
    console.warn('Failed to simplify a geometry, using original');
  }

  // Clean properties to keep file size small
  const properties = {
    NAMOBJ: f.properties.NAMOBJ,
    WADMKC: f.properties.WADMKC,
    WADMKK: f.properties.WADMKK
  };

  return {
    type: 'Feature',
    geometry: simplifiedGeom,
    properties
  };
});

const outputGeoJSON = {
  type: 'FeatureCollection',
  features: processedFeatures
};

console.log('Writing processed GeoJSON...');
fs.writeFileSync(outputPath, JSON.stringify(outputGeoJSON), 'utf8');

console.log('Done! Output size:', (fs.statSync(outputPath).size / 1024).toFixed(2), 'KB');
