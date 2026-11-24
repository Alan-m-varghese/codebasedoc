import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { runLangGraphPipeline } from './src/engine/langchainGraph.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini SDK with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    frameworks: ['LangChain', 'LangGraph', 'Express', 'Gemini'],
    timestamp: new Date().toISOString()
  });
});

// Server-side LangChain & LangGraph Architecture Analysis
app.post('/api/analyze-repo', async (req, res) => {
  try {
    const { name, totalFiles, totalLoc, filesSummary, cycles, risks } = req.body;

    const graphResult = await runLangGraphPipeline({
      query: `Execute architectural audit for repository ${name}`,
      taskType: 'audit',
      filesContext: filesSummary || [],
      repoMetadata: { name, totalFiles, totalLoc, cycles, risks }
    });

    res.json({
      analysis: graphResult.finalOutput,
      stepLogs: graphResult.stepLogs,
      cycleAnalysis: graphResult.cycleAnalysis,
      riskAudit: graphResult.riskAudit
    });
  } catch (err: any) {
    console.error('LangGraph repo analysis error:', err);
    res.status(500).json({ error: 'Failed to generate architectural analysis via LangGraph', details: err?.message });
  }
});

// Server-side LangChain & LangGraph RAG Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query, filesContext, history } = req.body;

    const graphResult = await runLangGraphPipeline({
      query,
      taskType: 'chat',
      filesContext: filesContext || [],
      repoMetadata: {}
    });

    res.json({
      answer: graphResult.finalOutput,
      stepLogs: graphResult.stepLogs,
      retrievedSymbols: graphResult.retrievedSymbols
    });
  } catch (err: any) {
    console.error('LangGraph chat error:', err);
    res.status(500).json({ error: 'Failed to answer query via LangChain graph', details: err?.message });
  }
});

// Explicit LangGraph State Graph Workflow Route for UI Orchestration DAG
app.post('/api/langgraph-workflow', async (req, res) => {
  try {
    const { query, taskType, filesContext, repoMetadata } = req.body;

    const graphResult = await runLangGraphPipeline({
      query: query || 'Analyze codebase graph',
      taskType: taskType || 'audit',
      filesContext: filesContext || [],
      repoMetadata: repoMetadata || {}
    });

    res.json({
      success: true,
      orchestrator: 'LangGraph StateGraph',
      nodesExecuted: ['context_retriever', 'cycle_analyzer', 'risk_auditor', 'synthesizer'],
      stepLogs: graphResult.stepLogs,
      result: graphResult.finalOutput
    });
  } catch (err: any) {
    console.error('LangGraph workflow error:', err);
    res.status(500).json({ error: 'LangGraph workflow execution failed', details: err?.message });
  }
});

// Server-side Fix Recommendation
app.post('/api/suggest-fix', async (req, res) => {
  try {
    const { riskFinding, fileContent } = req.body;

    const prompt = `Target File: ${riskFinding.filePath}
Issue Title: ${riskFinding.title}
Category: ${riskFinding.category} | Severity: ${riskFinding.severity}
Description: ${riskFinding.description}

Current File Content:
\`\`\`
${fileContent}
\`\`\`

Provide a refined, production-grade fix for this specific issue. Return:
1. Short explanation of the refactoring technique.
2. The corrected code snippet replacing the problematic lines.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ suggestion: response.text });
  } catch (err: any) {
    console.error('Gemini fix suggestion error:', err);
    res.status(500).json({ error: 'Failed to generate fix suggestion', details: err?.message });
  }
});

// Start Express + Vite server setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Codebase Doctor] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
