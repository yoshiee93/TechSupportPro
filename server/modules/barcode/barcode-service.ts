import { BrowserMultiFormatReader, Result } from '@zxing/library';
import sharp from 'sharp';
import fs from 'fs/promises';

export class BarcodeService {
  private codeReader: BrowserMultiFormatReader;

  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }

  async processImageFile(filePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Optimize image for barcode detection
      const optimizedImagePath = await this.optimizeImage(filePath);
      
      // Try to decode barcode from optimized image
      const result = await this.decodeBarcode(optimizedImagePath);
      
      // Clean up temporary files
      await this.cleanup([filePath, optimizedImagePath]);
      
      return result;
    } catch (error) {
      console.error('Barcode processing error:', error);
      
      // Clean up on error
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      return {
        success: false,
        error: 'Failed to process barcode image'
      };
    }
  }

  private async optimizeImage(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_optimized.png');
    
    try {
      // Optimize image for barcode detection
      await sharp(inputPath)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Image optimization error:', error);
      // Return original path if optimization fails
      return inputPath;
    }
  }

  private async decodeBarcode(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Read image buffer
      const imageBuffer = await fs.readFile(imagePath);
      
      // Decode barcode using ZXing
      const result = await this.codeReader.decodeFromImage(undefined, imagePath);
      
      if (result) {
        const barcodeText = result.getText().trim();
        console.log('Barcode detected:', {
          text: barcodeText,
          format: result.getBarcodeFormat(),
          confidence: result.getResultMetadata()
        });
        
        return {
          success: true,
          barcode: barcodeText
        };
      } else {
        return {
          success: false,
          error: 'No barcode detected in image'
        };
      }
    } catch (error) {
      console.error('Barcode decode error:', error);
      
      // Try different approaches for better detection
      return await this.tryAlternativeDecoding(imagePath);
    }
  }

  private async tryAlternativeDecoding(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Try with different image processing approaches
      const variations = [
        // Higher contrast
        sharp(imagePath).normalize().modulate({ brightness: 1.2, contrast: 1.5 }),
        // Different threshold
        sharp(imagePath).threshold(128),
        // Blur reduction
        sharp(imagePath).sharpen({ sigma: 2 })
      ];

      for (let i = 0; i < variations.length; i++) {
        try {
          const tempPath = imagePath.replace(/\.[^/.]+$/, `_var${i}.png`);
          await variations[i].png().toFile(tempPath);
          
          const result = await this.decodeBarcode(tempPath);
          
          // Clean up temp file
          await fs.unlink(tempPath).catch(() => {});
          
          if (result.success) {
            return result;
          }
        } catch (variationError) {
          console.log(`Variation ${i} failed:`, variationError);
          continue;
        }
      }

      return {
        success: false,
        error: 'Could not detect barcode. Please ensure the barcode is clear, well-lit, and properly framed in the image.'
      };
    } catch (error) {
      console.error('Alternative decoding error:', error);
      return {
        success: false,
        error: 'Failed to process barcode image'
      };
    }
  }

  private async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
        console.log(`Could not delete ${filePath}:`, error);
      }
    }
  }
}

export const barcodeService = new BarcodeService();