import sharp from 'sharp';
import fs from 'fs/promises';
import { createRequire } from 'module';

// Import node-zxing using createRequire for ES modules compatibility
const require = createRequire(import.meta.url);
const ZXing = require('node-zxing');

export class RealBarcodeService {
  async processImageFile(filePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      console.log('Processing barcode image:', filePath);
      
      // Try to decode barcode from the actual image
      const result = await this.detectBarcodeFromImage(filePath);
      
      // Clean up uploaded file
      await this.cleanup([filePath]);
      
      return result;
    } catch (error) {
      console.error('Barcode processing error:', error);
      await this.cleanup([filePath]);
      
      return {
        success: false,
        error: 'Failed to process barcode image'
      };
    }
  }

  private async detectBarcodeFromImage(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // First, optimize the image for barcode detection
      const optimizedPath = await this.optimizeImageForBarcode(imagePath);
      
      // Try multiple approaches with different libraries
      const approaches = [
        () => this.tryNodeZXing(optimizedPath),
        () => this.tryNodeZXing(imagePath), // Try original too
        () => this.tryWithRotation(imagePath),
      ];

      for (let i = 0; i < approaches.length; i++) {
        try {
          console.log(`Trying barcode detection approach ${i + 1}...`);
          const result = await approaches[i]();
          
          if (result.success) {
            console.log(`Success with approach ${i + 1}:`, result);
            // Clean up optimized image if different
            if (optimizedPath !== imagePath) {
              await this.cleanup([optimizedPath]);
            }
            return result;
          }
        } catch (error) {
          console.log(`Approach ${i + 1} failed:`, error);
          continue;
        }
      }

      // Clean up optimized image
      if (optimizedPath !== imagePath) {
        await this.cleanup([optimizedPath]);
      }

      return {
        success: false,
        error: 'Could not detect barcode in image. Please ensure the barcode is clear, well-lit, and properly framed.'
      };
      
    } catch (error) {
      console.error('Barcode detection error:', error);
      return {
        success: false,
        error: 'Failed to analyze image for barcode'
      };
    }
  }

  private async tryNodeZXing(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        ZXing.decode(imagePath, (err: any, result: any) => {
          if (err) {
            console.log('ZXing decode error:', err);
            resolve({ success: false, error: err.message });
            return;
          }
          
          if (result && result.text) {
            const barcodeText = result.text.trim();
            console.log('ZXing detected barcode:', {
              text: barcodeText,
              format: result.format,
              quality: result.quality
            });
            
            resolve({
              success: true,
              barcode: barcodeText
            });
          } else {
            resolve({ success: false, error: 'No barcode found with ZXing' });
          }
        });
      } catch (error) {
        console.log('ZXing library error:', error);
        resolve({ success: false, error: 'ZXing processing failed' });
      }
    });
  }

  private async optimizeImageForBarcode(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_optimized.png');
    
    try {
      // Optimize image specifically for barcode detection
      await sharp(inputPath)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .greyscale() // Convert to grayscale for better detection
        .normalize() // Normalize contrast
        .sharpen({ sigma: 1.5 }) // Sharpen edges
        .png({ quality: 95 })
        .toFile(outputPath);
      
      console.log('Created optimized image for barcode detection');
      return outputPath;
    } catch (error) {
      console.error('Image optimization error:', error);
      // Return original path if optimization fails
      return inputPath;
    }
  }

  private async tryWithRotation(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    // Try rotating the image in case the barcode is sideways
    const rotations = [90, 180, 270];
    
    for (const rotation of rotations) {
      try {
        const rotatedPath = imagePath.replace(/\.[^/.]+$/, `_rot${rotation}.png`);
        
        await sharp(imagePath)
          .rotate(rotation)
          .greyscale()
          .normalize()
          .png()
          .toFile(rotatedPath);
        
        const result = await this.tryNodeZXing(rotatedPath);
        
        // Clean up rotated image
        await this.cleanup([rotatedPath]);
        
        if (result.success) {
          console.log(`Found barcode with ${rotation}° rotation`);
          return result;
        }
      } catch (error) {
        console.log(`Rotation ${rotation}° failed:`, error);
        continue;
      }
    }
    
    return { success: false, error: 'No barcode found with rotation attempts' };
  }

  private async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log('Cleaned up file:', filePath);
      } catch (error) {
        // Ignore cleanup errors
        console.log(`Could not delete ${filePath}:`, error);
      }
    }
  }
}

export const realBarcodeService = new RealBarcodeService();