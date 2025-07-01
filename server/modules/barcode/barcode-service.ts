import { BrowserMultiFormatReader } from '@zxing/library';
import sharp from 'sharp';
import fs from 'fs/promises';

export class BarcodeService {
  private codeReader: BrowserMultiFormatReader;

  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }

  async processImageFile(filePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      console.log('Processing barcode image:', filePath);
      
      // Try to decode barcode from original image first
      let result = await this.decodeBarcode(filePath);
      
      // If that fails, try with image optimization
      if (!result.success) {
        console.log('Trying with optimized image...');
        const optimizedPath = await this.optimizeImage(filePath);
        result = await this.decodeBarcode(optimizedPath);
        
        // Clean up optimized image
        if (optimizedPath !== filePath) {
          await this.cleanup([optimizedPath]);
        }
      }
      
      // Clean up original uploaded file
      await this.cleanup([filePath]);
      
      return result;
    } catch (error) {
      console.error('Barcode processing error:', error);
      
      // Clean up on error
      await this.cleanup([filePath]);
      
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
      console.log('Attempting to decode barcode from:', imagePath);
      
      // Convert image to base64 data URL for ZXing
      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      // Decode using ZXing
      const result = await this.codeReader.decodeFromImage(undefined, dataUrl);
      
      if (result) {
        const barcodeText = result.getText().trim();
        console.log('Barcode detected:', {
          text: barcodeText,
          format: result.getBarcodeFormat?.() || 'unknown'
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
      return {
        success: false,
        error: 'Could not detect barcode. Please ensure the barcode is clear, well-lit, and properly framed in the image.'
      };
    }
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
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

export const barcodeService = new BarcodeService();