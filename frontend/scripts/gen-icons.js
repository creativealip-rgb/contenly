const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, fileName) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, size, size);

    // Text "C"
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', size / 2, size / 2);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./public/${fileName}`, buffer);
    console.log(`Created ${fileName}`);
}

// Ensure public directory exists
if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
}

// createIcon(192, 'icon-192x192.png');
// createIcon(512, 'icon-512x512.png');
