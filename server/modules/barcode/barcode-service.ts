import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
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
      
      // Try multiple approaches for better success rate
      const approaches = [
        () => this.tryDecodeFromFile(imagePath),
        () => this.tryDecodeFromBase64(imagePath),
        () => this.tryDecodeWithCanvas(imagePath)
      ];

      for (let i = 0; i < approaches.length; i++) {
        try {
          console.log(`Trying decode approach ${i + 1}...`);
          const result = await approaches[i]();
          
          if (result.success) {
            console.log(`Success with approach ${i + 1}:`, result);
            return result;
          }
        } catch (error) {
          console.log(`Approach ${i + 1} failed:`, error.message);
          continue;
        }
      }

      return {
        success: false,
        error: 'Could not detect barcode. Please ensure the barcode is clear, well-lit, and properly framed in the image.'
      };
    } catch (error) {
      console.error('Barcode decode error:', error);
      return {
        success: false,
        error: 'Failed to process barcode image'
      };
    }
  }

  private async tryDecodeFromFile(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Try direct file path approach
      const result = await this.codeReader.decodeFromImageUrl(imagePath);
      
      if (result) {
        const barcodeText = result.getText().trim();
        return {
          success: true,
          barcode: barcodeText
        };
      }
      
      return { success: false, error: 'No barcode found (file)' };
    } catch (error) {
      throw new Error(`File decode failed: ${error.message}`);
    }
  }

  private async tryDecodeFromBase64(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Convert to base64 data URL
      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      const result = await this.codeReader.decodeFromImage(undefined, dataUrl);
      
      if (result) {
        const barcodeText = result.getText().trim();
        return {
          success: true,
          barcode: barcodeText
        };
      }
      
      return { success: false, error: 'No barcode found (base64)' };
    } catch (error) {
      throw new Error(`Base64 decode failed: ${error.message}`);
    }
  }

  private async tryDecodeWithCanvas(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Create ImageData from buffer using sharp
      const imageBuffer = await fs.readFile(imagePath);
      const image = sharp(imageBuffer);
      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Create mock ImageData object
      const imageData = {
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height
      };

      // Try to decode from ImageData
      const result = await this.codeReader.decodeFromImageData(imageData as any);
      
      if (result) {
        const barcodeText = result.getText().trim();
        return {
          success: true,
          barcode: barcodeText
        };
      }
      
      return { success: false, error: 'No barcode found (canvas)' };
    } catch (error) {
      throw new Error(`Canvas decode failed: ${error.message}`);
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