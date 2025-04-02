// @usage
// # Convert SVGs to a different output directory
// node svg2png.js ./source/icons/ ./dist/icons/

// # Convert recursively with output directory
// node svg2png.js ./source/icons/ ./dist/icons/ --recursive

// # Convert single file
// node svg2png.js input.svg

// # Process all SVGs in a directory
// node svg2png.js ./icons/ [output_directory]

// # Process directory recursively
// node svg2png.js ./icons/ [output_directory] --recursive

// # Specify output dimensions
// node svg2png.js ./icons/ [output_directory] --width=512 --height=512 --recursive

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { optimize } = require('svgo');

async function optimizeSvg(inputBuffer) {
  try {
    const result = optimize(inputBuffer.toString(), {
      multipass: true,
      plugins: [
        'removeComments',
        'mergePaths',
        'removeEditorsNSData',
        'removeMetadata',
      ],
    });
    return Buffer.from(result.data);
  } catch (error) {
    console.error('SVG优化失败:', error);
    return inputBuffer;
  }
}

async function convertSvgToPng(inputPath, outputPath, options = {}) {
  const { width = 256, height = 256 } = options;

  try {
    const svgBuffer = fs.readFileSync(inputPath);
    // 先优化SVG
    const optimizedSvg = await optimizeSvg(svgBuffer);
    // 然后转换为PNG
    await sharp(optimizedSvg).resize(width, height).png().toFile(outputPath);

    console.log(`已转换 ${inputPath} 为 ${outputPath}`);
  } catch (error) {
    console.error(`转换 ${inputPath} 时出错:`, error);
  }
}

async function processDirectory(inputDir, outputDir, options = {}) {
  const files = fs.readdirSync(inputDir);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const stat = fs.statSync(inputPath);

    if (stat.isDirectory() && options.recursive) {
      const newOutputDir = path.join(outputDir, file);
      await processDirectory(inputPath, newOutputDir, options);
    } else if (file.toLowerCase().endsWith('.svg')) {
      const relativePath = path.relative(inputDir, inputPath);
      const outputPath = path.join(
        outputDir,
        relativePath.replace(/\.svg$/i, '.png')
      );

      // Create subdirectories in output path if needed
      const outputDirname = path.dirname(outputPath);
      if (!fs.existsSync(outputDirname)) {
        fs.mkdirSync(outputDirname, { recursive: true });
      }

      await convertSvgToPng(inputPath, outputPath, options);
    }
  }
}

// Handle command line arguments
const arg = process.argv[2];
const outputArg = process.argv[3];
const options = {
  recursive: process.argv.includes('--recursive'),
  width:
    parseInt(
      process.argv.find((arg) => arg.startsWith('--width='))?.split('=')[1]
    ) || 256,
  height:
    parseInt(
      process.argv.find((arg) => arg.startsWith('--height='))?.split('=')[1]
    ) || 256,
};

if (!arg) {
  console.log(
    'Usage: node svg2png.js <input.svg|directory> [output_directory] [options]'
  );
  console.log('Options:');
  console.log('  --recursive        Process subdirectories');
  console.log('  --width=<number>   Output width');
  console.log('  --height=<number>  Output height');
  process.exit(1);
}

if (fs.statSync(arg).isDirectory()) {
  const outputDir = outputArg || arg; // If no output directory specified, use input directory
  processDirectory(arg, outputDir, options);
} else {
  const outputFile = outputArg || arg.replace('.svg', '.png');
  convertSvgToPng(arg, outputFile, options);
}
