import OpenAI from 'openai';
import fs from 'fs/promises';
import sharp from 'sharp';

export class OpenAIBarcodeService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async processImageFile(filePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      console.log('Processing barcode image with OpenAI Vision:', filePath);
      
      // Optimize image for better vision processing
      const optimizedPath = await this.optimizeImage(filePath);
      
      // Use OpenAI Vision to detect barcode
      const result = await this.detectBarcodeWithVision(optimizedPath);
      
      // Clean up files
      await this.cleanup([filePath, optimizedPath]);
      
      return result;
    } catch (error) {
      console.error('OpenAI barcode processing error:', error);
      await this.cleanup([filePath]);
      
      return {
        success: false,
        error: 'Failed to process barcode image with AI'
      };
    }
  }

  private async detectBarcodeWithVision(imagePath: string): Promise<{ success: boolean; barcode?: string; error?: string }> {
    try {
      // Convert image to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      console.log('Sending image to OpenAI Vision API for barcode detection...');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and extract any barcodes you can find. Look for:
- UPC/EAN barcodes (numbers below black bars)
- QR codes
- Code 128/Code 39 barcodes
- Any other machine-readable codes

If you find a barcode, respond with ONLY the barcode number/text with no additional formatting or explanation.
If you cannot find any readable barcode, respond with exactly: "NO_BARCODE_FOUND"

Focus on accuracy - only return codes you can clearly read.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1 // Low temperature for consistent results
      });

      const detectedText = response.choices[0]?.message?.content?.trim();
      
      if (!detectedText) {
        return {
          success: false,
          error: 'No response from AI vision service'
        };
      }

      if (detectedText === 'NO_BARCODE_FOUND') {
        return {
          success: false,
          error: 'No barcode detected in image. Please ensure the barcode is clear and well-lit.'
        };
      }

      // Clean and validate the detected barcode
      const cleanBarcode = this.cleanBarcodeText(detectedText);
      
      if (cleanBarcode) {
        console.log('OpenAI detected barcode:', cleanBarcode);
        return {
          success: true,
          barcode: cleanBarcode
        };
      } else {
        return {
          success: false,
          error: 'AI detected text but could not extract valid barcode'
        };
      }

    } catch (error: any) {
      console.error('OpenAI Vision API error:', error);
      
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: 'AI service quota exceeded. Please try manual entry or contact support.'
        };
      }
      
      return {
        success: false,
        error: 'AI vision service temporarily unavailable'
      };
    }
  }

  private cleanBarcodeText(text: string): string | null {
    // Remove any explanatory text and extract just the barcode
    const cleanText = text.replace(/[^a-zA-Z0-9\-_]/g, '').trim();
    
    // Validate that it looks like a barcode (has some length and reasonable characters)
    if (cleanText.length >= 4 && cleanText.length <= 50) {
      return cleanText;
    }
    
    // Try to extract numbers (common for UPC/EAN)
    const numbersOnly = text.replace(/[^0-9]/g, '');
    if (numbersOnly.length >= 8 && numbersOnly.length <= 20) {
      return numbersOnly;
    }
    
    return null;
  }

  private async optimizeImage(inputPath: string): Promise<string> {
    const outputPath = inputPath + '_ai_optimized.jpg';
    
    try {
      // Optimize for AI vision processing
      await sharp(inputPath)
        .resize(1500, 1500, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      
      console.log('Created AI-optimized image');
      return outputPath;
    } catch (error) {
      console.error('Image optimization error:', error);
      return inputPath;
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
        return 'image/jpeg';
    }
  }

  private async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log('Cleaned up file:', filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

export const openAIBarcodeService = new OpenAIBarcodeService();