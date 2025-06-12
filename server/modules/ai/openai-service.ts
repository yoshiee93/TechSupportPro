import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TicketAnalysis {
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDifficulty: "easy" | "medium" | "hard" | "expert";
  estimatedTimeHours: number;
  suggestedActions: string[];
  recommendedParts: string[];
  diagnosticQuestions: string[];
  riskFactors: string[];
  confidenceScore: number;
}

export interface RepairSuggestion {
  steps: string[];
  tools: string[];
  parts: string[];
  warnings: string[];
  estimatedTime: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
}

export class OpenAIService {
  async parseVoiceTicket(transcript: string): Promise<{
    clientName: string;
    deviceInfo: string;
    issueDescription: string;
    priority: string;
    symptoms: string[];
  }> {
    try {
      const prompt = `Parse this voice transcript from a repair shop technician and extract structured ticket information:

Voice Transcript: "${transcript}"

Extract the following information and respond with JSON:
1. Client/customer name mentioned
2. Device information (brand, model, type)
3. Clear issue description
4. Priority level (low/medium/high/urgent) based on urgency words
5. List of symptoms or problems mentioned

Respond with JSON in this exact format:
{
  "clientName": "extracted name or empty string",
  "deviceInfo": "device brand and model",
  "issueDescription": "clear description of the problem",
  "priority": "low|medium|high|urgent",
  "symptoms": ["symptom1", "symptom2"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      console.error("Error parsing voice ticket:", error);
      // Return basic structure with transcript as description
      return {
        clientName: '',
        deviceInfo: '',
        issueDescription: transcript,
        priority: 'medium',
        symptoms: []
      };
    }
  }

  async analyzeTicket(
    deviceBrand: string,
    deviceModel: string,
    issueDescription: string,
    customerComplaints?: string[]
  ): Promise<TicketAnalysis> {
    try {
      const prompt = `Analyze this device repair ticket and provide structured analysis:

Device: ${deviceBrand} ${deviceModel}
Issue Description: ${issueDescription}
${customerComplaints ? `Customer Complaints: ${customerComplaints.join(', ')}` : ''}

Based on this information, provide a detailed analysis focusing on:
1. Priority level (urgent/high/medium/low) based on severity and device criticality
2. Estimated repair difficulty and time
3. Suggested diagnostic actions
4. Recommended parts that might be needed
5. Questions to ask customer for better diagnosis
6. Risk factors to consider
7. Confidence in the analysis

Respond with JSON in this exact format:
{
  "priority": "low|medium|high|urgent",
  "estimatedDifficulty": "easy|medium|hard|expert", 
  "estimatedTimeHours": number,
  "suggestedActions": ["action1", "action2"],
  "recommendedParts": ["part1", "part2"],
  "diagnosticQuestions": ["question1", "question2"],
  "riskFactors": ["risk1", "risk2"],
  "confidenceScore": 0.0-1.0
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert device repair technician with 20+ years of experience. Analyze repair tickets and provide structured recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        priority: result.priority || "medium",
        estimatedDifficulty: result.estimatedDifficulty || "medium",
        estimatedTimeHours: result.estimatedTimeHours || 2,
        suggestedActions: result.suggestedActions || [],
        recommendedParts: result.recommendedParts || [],
        diagnosticQuestions: result.diagnosticQuestions || [],
        riskFactors: result.riskFactors || [],
        confidenceScore: result.confidenceScore || 0.7,
      };
    } catch (error) {
      console.error("Error analyzing ticket:", error);
      throw new Error("Failed to analyze ticket with AI");
    }
  }

  async generateRepairSuggestions(
    deviceBrand: string,
    deviceModel: string,
    diagnosedIssue: string,
    availableParts?: string[]
  ): Promise<RepairSuggestion> {
    try {
      const prompt = `Generate detailed repair instructions for this diagnosed issue:

Device: ${deviceBrand} ${deviceModel}
Diagnosed Issue: ${diagnosedIssue}
${availableParts ? `Available Parts: ${availableParts.join(', ')}` : ''}

Provide step-by-step repair instructions including:
1. Detailed repair steps in logical order
2. Required tools and equipment
3. Necessary parts and components
4. Safety warnings and precautions
5. Estimated repair time
6. Difficulty level

Respond with JSON in this exact format:
{
  "steps": ["step1", "step2"],
  "tools": ["tool1", "tool2"],
  "parts": ["part1", "part2"],
  "warnings": ["warning1", "warning2"],
  "estimatedTime": number_in_hours,
  "difficulty": "easy|medium|hard|expert"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert device repair technician. Provide detailed, safe, and accurate repair instructions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        steps: result.steps || [],
        tools: result.tools || [],
        parts: result.parts || [],
        warnings: result.warnings || [],
        estimatedTime: result.estimatedTime || 2,
        difficulty: result.difficulty || "medium",
      };
    } catch (error) {
      console.error("Error generating repair suggestions:", error);
      throw new Error("Failed to generate repair suggestions");
    }
  }

  async suggestPartsBySymptoms(
    deviceBrand: string,
    deviceModel: string,
    symptoms: string[]
  ): Promise<string[]> {
    try {
      const prompt = `Based on these symptoms for ${deviceBrand} ${deviceModel}, suggest the most likely parts that need replacement:

Symptoms: ${symptoms.join(', ')}

Consider common failure points and typical issues for this device type. Focus on the most probable parts based on the described symptoms.

Respond with JSON array of part names:
{
  "parts": ["part1", "part2", "part3"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in device hardware diagnostics. Suggest the most likely failing parts based on symptoms."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.parts || [];
    } catch (error) {
      console.error("Error suggesting parts:", error);
      throw new Error("Failed to suggest parts");
    }
  }

  async prioritizeTickets(tickets: any[]): Promise<{ ticketId: number; suggestedPriority: string; reason: string }[]> {
    try {
      const ticketSummaries = tickets.map(ticket => ({
        id: ticket.id,
        device: `${ticket.deviceBrand} ${ticket.deviceModel}`,
        issue: ticket.issueDescription,
        customerType: ticket.customerType || "individual",
        currentPriority: ticket.priority
      }));

      const prompt = `Analyze these repair tickets and suggest priority adjustments based on device criticality, issue severity, and business impact:

Tickets: ${JSON.stringify(ticketSummaries)}

For each ticket, determine if the current priority should be adjusted and explain why. Consider:
- Device criticality (business vs personal devices)
- Issue severity (data loss risk, complete failure vs minor issues)
- Repair complexity and time sensitivity
- Customer impact

Respond with JSON array:
{
  "priorityAdjustments": [
    {
      "ticketId": number,
      "suggestedPriority": "low|medium|high|urgent",
      "reason": "explanation for priority suggestion"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a repair shop manager expert at triaging tickets and setting priorities based on business impact and technical severity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.priorityAdjustments || [];
    } catch (error) {
      console.error("Error prioritizing tickets:", error);
      throw new Error("Failed to prioritize tickets");
    }
  }
}

export const aiService = new OpenAIService();