import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

const SVG_DIR = 'public/sprites/svg';
const OUT_DIR = 'public/sprites';

async function convertSvgToPng(svgPath, pngPath, targetSize = null) {
  const svgBuffer = await readFile(svgPath);
  let pipeline = sharp(svgBuffer, { density: 300 });

  if (targetSize) {
    pipeline = pipeline.resize(targetSize, targetSize, {
      kernel: sharp.kernel.nearest, // Keep pixel art crisp
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
  }

  await pipeline.png().toFile(pngPath);
  console.log(`  Converted: ${pngPath}`);
}

async function createSpriteSheet(frames, outputPath, frameWidth, frameHeight) {
  // Create a horizontal sprite sheet from multiple SVG frames
  const totalWidth = frameWidth * frames.length;

  const frameBuffers = [];
  for (const frame of frames) {
    const svgBuffer = await readFile(frame);
    const pngBuffer = await sharp(svgBuffer, { density: 300 })
      .resize(frameWidth, frameHeight, {
        kernel: sharp.kernel.nearest,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    frameBuffers.push(pngBuffer);
  }

  // Composite all frames into one horizontal strip
  const composites = frameBuffers.map((buf, i) => ({
    input: buf,
    left: i * frameWidth,
    top: 0
  }));

  await sharp({
    create: {
      width: totalWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  console.log(`  Sheet: ${outputPath} (${frames.length} frames, ${totalWidth}x${frameHeight})`);
}

async function main() {
  console.log('Converting SVG sprites to PNG...\n');

  // Convert individual sprites
  const spriteConfigs = [
    // Player ninja
    { svg: 'ninja-idle-1.svg', png: 'ninja-idle-1.png', size: 48 },
    { svg: 'ninja-idle-2.svg', png: 'ninja-idle-2.png', size: 48 },
    { svg: 'ninja-dash-1.svg', png: 'ninja-dash-1.png', size: 48 },
    { svg: 'ninja-dash-2.svg', png: 'ninja-dash-2.png', size: 48 },
    // Enemies
    { svg: 'oni.svg', png: 'oni.png', size: 48 },
    { svg: 'kappa.svg', png: 'kappa.png', size: 48 },
    { svg: 'tengu.svg', png: 'tengu.png', size: 48 },
    { svg: 'yurei.svg', png: 'yurei.png', size: 48 },
    { svg: 'boss-oni.svg', png: 'boss-oni.png', size: 64 },
    // Items
    { svg: 'shuriken.svg', png: 'shuriken.png', size: 32 },
    { svg: 'scroll.svg', png: 'scroll.png', size: 32 },
    { svg: 'health-orb.svg', png: 'health-orb.png', size: 24 },
    { svg: 'xp-gem.svg', png: 'xp-gem.png', size: 24 },
  ];

  console.log('Individual sprites:');
  for (const config of spriteConfigs) {
    await convertSvgToPng(
      join(SVG_DIR, config.svg),
      join(OUT_DIR, config.png),
      config.size
    );
  }

  // Create sprite sheets
  console.log('\nSprite sheets:');

  // Ninja idle animation sheet (2 frames)
  await createSpriteSheet(
    [join(SVG_DIR, 'ninja-idle-1.svg'), join(SVG_DIR, 'ninja-idle-2.svg')],
    join(OUT_DIR, 'ninja-idle-sheet.png'),
    48, 48
  );

  // Ninja dash animation sheet (2 frames)
  await createSpriteSheet(
    [join(SVG_DIR, 'ninja-dash-1.svg'), join(SVG_DIR, 'ninja-dash-2.svg')],
    join(OUT_DIR, 'ninja-dash-sheet.png'),
    48, 48
  );

  // All ninja frames combined (idle1, idle2, dash1, dash2)
  await createSpriteSheet(
    [
      join(SVG_DIR, 'ninja-idle-1.svg'),
      join(SVG_DIR, 'ninja-idle-2.svg'),
      join(SVG_DIR, 'ninja-dash-1.svg'),
      join(SVG_DIR, 'ninja-dash-2.svg'),
    ],
    join(OUT_DIR, 'ninja-spritesheet.png'),
    48, 48
  );

  // Enemy sheet (oni, kappa, tengu, yurei) at 48x48
  await createSpriteSheet(
    [
      join(SVG_DIR, 'oni.svg'),
      join(SVG_DIR, 'kappa.svg'),
      join(SVG_DIR, 'tengu.svg'),
      join(SVG_DIR, 'yurei.svg'),
    ],
    join(OUT_DIR, 'enemies-sheet.png'),
    48, 48
  );

  console.log('\nDone! All sprites saved to public/sprites/');
}

main().catch(console.error);
