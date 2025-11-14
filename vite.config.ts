import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Allow base path to be configurable via environment variable
    // Default to '/' for local dev and Vercel, use '/AOS/' for GitHub Pages
    const base = process.env.VITE_BASE_PATH || '/';

    // Get API keys from environment variables (passed by GitHub Actions) or .env files
    const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    const grokApiKey = process.env.GROK_API_KEY || env.GROK_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GROK_API_KEY': JSON.stringify(grokApiKey),
        'process.env.GROQ_API_KEY': JSON.stringify(groqApiKey),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(openrouterApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor-react';
                if (id.includes('d3')) return 'vendor-d3';
                if (id.includes('@google/genai')) return 'vendor-gemini';
              }

              if (id.includes('/components/ConsciousnessGraph') || id.includes('/components/ILPKnowledgeGraph') || id.includes('/components/ILPGraphQuiz')) {
                return 'viz-d3';
              }

              if (id.includes('/components/ThreeTwoOneWizard') || id.includes('/components/IFSWizard') || id.includes('/components/BiasDetectiveWizard') ||
                  id.includes('/components/SubjectObjectWizard') || id.includes('/components/PerspectiveShifterWizard') || id.includes('/components/PolarityMapperWizard')) {
                return 'wizards-shadow';
              }

              if (id.includes('/components/SomaticGeneratorWizard') || id.includes('/components/MeditationWizard') || id.includes('/components/RoleAlignmentWizard') ||
                  id.includes('/components/KeganAssessmentWizard') || id.includes('/components/RelationalPatternChatbot') || id.includes('/components/JhanaTracker')) {
                return 'wizards-practice';
              }

              if (id.includes('/components/PracticeInfoModal') || id.includes('/components/PracticeExplanationModal') || id.includes('/components/PracticeCustomizationModal') ||
                  id.includes('/components/CustomPracticeModal') || id.includes('/components/GuidedPracticeGenerator')) {
                return 'modals';
              }

              if (id.includes('/components/MindToolsTab') || id.includes('/components/ShadowToolsTab') || id.includes('/components/BodyToolsTab') || id.includes('/components/SpiritToolsTab')) {
                return 'tabs-tools';
              }

              if (id.includes('/components/StackTab') || id.includes('/components/BrowseTab') || id.includes('/components/TrackerTab') || id.includes('/components/StreaksTab')) {
                return 'tabs-practice';
              }

              if (id.includes('/components/AqalTab') || id.includes('/components/RecommendationsTab') || id.includes('/components/LibraryTab') || id.includes('/components/JourneyTab')) {
                return 'tabs-analysis';
              }

              return undefined;
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      }
    };
});
