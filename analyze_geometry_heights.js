const JSZip = require('jszip');
const fs = require('fs');

async function run() {
  try {
    const zipData = fs.readFileSync('tulip_chair_debug.zip');
    const zip = await JSZip.loadAsync(zipData);
    const files = Object.keys(zip.files);
    const objFile = files.find(f => f.toLowerCase().endsWith('.obj'));
    if (!objFile) {
      console.log("No OBJ file found.");
      return;
    }

    const content = await zip.files[objFile].async('string');
    const lines = content.split('\n');

    let currentObject = 'default';
    const yCoordinates = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('o ')) {
        currentObject = trimmed.slice(2).trim();
      } else if (trimmed.startsWith('v ') && currentObject === 'Retopo_chair.006') {
        const parts = trimmed.slice(2).trim().split(/\s+/).map(Number);
        if (parts.length >= 3 && !parts.some(isNaN)) {
          yCoordinates.push(parts[1]); // Y is vertical height
        }
      }
    }

    yCoordinates.sort((a, b) => a - b);
    const total = yCoordinates.length;
    console.log(`Total vertices in Retopo_chair.006: ${total}`);
    console.log(`Min Y: ${yCoordinates[0]}`);
    console.log(`Max Y: ${yCoordinates[total - 1]}`);

    // Let's divide into 10 height bins and count vertices in each bin
    const bins = 10;
    const minY = yCoordinates[0];
    const maxY = yCoordinates[total - 1];
    const binSize = (maxY - minY) / bins;
    const counts = Array(bins).fill(0);

    for (const y of yCoordinates) {
      let binIdx = Math.floor((y - minY) / binSize);
      if (binIdx >= bins) binIdx = bins - 1;
      counts[binIdx]++;
    }

    console.log("\nVertex distribution by height (from bottom to top):");
    for (let i = 0; i < bins; i++) {
      const start = minY + i * binSize;
      const end = start + binSize;
      console.log(`Bin ${i+1} [${start.toFixed(3)} - ${end.toFixed(3)}]: ${counts[i]} vertices (${((counts[i]/total)*100).toFixed(1)}%)`);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
