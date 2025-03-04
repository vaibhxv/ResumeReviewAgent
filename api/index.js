const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const { openai } = require('@ai-sdk/openai');
const { jsonSchema, streamText } = require('ai');
const cors = require('cors')
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors())

// Initialize OpenAI client
const openaii = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are accepted'));
    }
  }
});

// System prompt for the resume feedback endpoint
const SYSTEM_PROMPT = `You are an expert resume reviewer and career coach with years of experience helping people improve their resumes and advance their careers.

Your task is to:
1. Analyze the user's resume thoroughly
2. Provide specific, actionable feedback on the resume's strengths and weaknesses
3. Suggest improvements to make the resume more effective
4. Recommend potential career paths based on their skills and experience
5. Suggest skills they should develop to advance their career
6. Recommend certifications or courses that would benefit them

Be specific, constructive, and encouraging. Focus on helping the user improve their resume and advance their career.

If the user hasn't uploaded a resume yet, guide them to upload one for analysis.`;

// ========== ENDPOINT 1: PDF Resume Analysis ==========
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided' });
    }

    // Extract text from PDF using pdf-parse
    const buffer = req.file.buffer;
    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text;
    
    // Verify we extracted some text
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the provided PDF' });
    }
    
    console.log("Extracted resume text:", resumeText.substring(0, 100) + "..."); // Log a preview for debugging
    
    // Send the parsed resume text to OpenAI for analysis
    const completion = await openaii.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional career advisor and resume expert. Analyze the provided resume and give:
          1. Personalized feedback on the resume (strengths, weaknesses, suggestions for improvement)
          2. Clear next steps for career growth based on their experience and skills
          3. Specific advice to help them navigate their career path
          
          Format your response in markdown with clear sections.`
        },
        {
          role: "user",
          content: `Here is the resume to analyze:\n\n${resumeText}`
        }
      ],
      temperature: 0.7,
    });

    // Extract the analysis from the OpenAI response
    const analysis = completion.choices[0].message.content;

    // Return the analysis to the client
    return res.json({
      success: true,
      analysis,
    });
    
  } catch (error) {
    console.error('Error processing resume:', error);
    
    return res.status(500).json({ 
      error: 'Failed to process resume',
      details: error.message || 'Unknown error'
    });
  }
});

// ========== ENDPOINT 2: Resume Feedback Chat ==========
app.post('/api/resume-feedback', async (req, res) => {
  try {
    const { messages, tools } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const stream = await streamText({
      model: openai("gpt-4o"),
      messages,
      system: SYSTEM_PROMPT,
      tools: tools ? Object.fromEntries(
        Object.keys(tools).map((name) => [
          name,
          { ...tools[name], parameters: jsonSchema(tools[name].parameters) },
        ])
      ) : undefined,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send the stream to the client
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Error generating feedback:', error);
    
    // If headers haven't been sent yet, send a JSON error response
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate feedback',
        details: error.message || 'Unknown error'
      });
    }
    
    // If headers have been sent (streaming started), end the stream with an error event
    res.write(`data: ${JSON.stringify({ error: error.message || 'Unknown error' })}\n\n`);
    res.end();
  }
});

// Basic home route
app.get('/', (req, res) => {
  res.send('Resume Analysis and Feedback API - Use /api/analyze-resume to upload and analyze a resume, or /api/resume-feedback for interactive feedback');
});

// Start the server
app.listen(port, () => {
  console.log(`Resume analysis and feedback server running on port ${port}`);
});

// Export the app for testing purposes
module.exports = app;