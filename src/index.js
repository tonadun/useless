#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Load learning cards data
let learningCards = null;
let componentCode = null;

async function loadLearningCards() {
  try {
    const dataPath = join(__dirname, '..', 'data', 'learning-cards.json');
    const data = await readFile(dataPath, 'utf-8');
    learningCards = JSON.parse(data);
    console.log('Loaded', learningCards.cards.length, 'learning cards');
  } catch (error) {
    console.error('Error loading learning cards:', error);
    learningCards = { cards: [] };
  }
}

async function loadComponentBundle() {
  try {
    const componentPath = join(__dirname, '..', 'web', 'dist', 'component.js');
    componentCode = await readFile(componentPath, 'utf-8');
    console.log('Loaded component bundle:', (componentCode.length / 1024).toFixed(0), 'KB');
  } catch (error) {
    console.error('Error loading component bundle:', error);
    console.log('Custom UI will not be available - falling back to text only');
    componentCode = null;
  }
}

// Handle tool calls
function handleToolCall(toolName, args) {
  switch (toolName) {
    case 'get_learning_card': {
      let matchedCard = null;

      if (args?.id) {
        matchedCard = learningCards.cards.find(card => card.id === args.id);
      } else if (args?.occupation) {
        matchedCard = learningCards.cards.find(
          card => card.occupation.toLowerCase() === args.occupation.toLowerCase()
        );
      } else if (args?.category) {
        matchedCard = learningCards.cards.find(
          card => card.category.toLowerCase() === args.category.toLowerCase()
        );
      } else {
        // Return a random card if no filters specified
        const randomIndex = Math.floor(Math.random() * learningCards.cards.length);
        matchedCard = learningCards.cards[randomIndex];
      }

      if (!matchedCard) {
        return {
          content: [
            {
              type: 'text',
              text: 'No learning card found matching your criteria. Try using list_all_cards to see available options.',
            },
          ],
        };
      }

      // Format the card as rich branded content
      const formattedCard = `
# 🔥 ${matchedCard.title}

> **${matchedCard.occupation}** | ${matchedCard.category}

${matchedCard.description}

---

## 📋 Steps

${matchedCard.steps.map((step, index) => `**${index + 1}.** ${step}`).join('\n\n')}

---

### 💡 **Fun Fact**
> ${matchedCard.funFact}

### 🎯 **Key Takeaway**
> ${matchedCard.keyTakeaway}

---
*Learn something new, even if it's useless!* 🚀
`;

      // Build response following Apps SDK format
      // structuredContent is passed to window.openai.toolOutput for the component
      return {
        content: [
          {
            type: 'text',
            text: formattedCard,
          },
        ],
        structuredContent: {
          card: matchedCard,
        },
      };
    }

    case 'list_all_cards': {
      const cardsList = learningCards.cards.map(card => ({
        id: card.id,
        title: card.title,
        occupation: card.occupation,
        category: card.category,
      }));

      const formattedList = `
# Available Learning Cards

${cardsList.map(card => `
## ${card.title}
- **ID:** ${card.id}
- **Occupation:** ${card.occupation}
- **Category:** ${card.category}
`).join('\n')}

Use \`get_learning_card\` with an ID, occupation, or category to get the full details.
`;

      return {
        content: [
          {
            type: 'text',
            text: formattedList,
          },
        ],
      };
    }

    case 'search_cards': {
      const query = args?.query?.toLowerCase() || '';
      const matchedCards = learningCards.cards.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.occupation.toLowerCase().includes(query) ||
        card.category.toLowerCase().includes(query)
      );

      if (matchedCards.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No cards found matching "${args?.query}". Try using list_all_cards to see all available options.`,
            },
          ],
        };
      }

      const formattedResults = `
# Search Results for "${args?.query}"

Found ${matchedCards.length} matching card(s):

${matchedCards.map(card => `
## ${card.title}
- **ID:** ${card.id}
- **Occupation:** ${card.occupation}
- **Category:** ${card.category}
- **Description:** ${card.description}
`).join('\n')}
`;

      return {
        content: [
          {
            type: 'text',
            text: formattedResults,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Start HTTP server
async function main() {
  await loadLearningCards();
  await loadComponentBundle();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Useless - Cross-Occupational Learning MCP Server',
      version: '1.0.0',
      status: 'running',
      cards: learningCards.cards.length,
      endpoint: '/mcp',
    });
  });

  // MCP endpoint - POST only for proper MCP protocol
  app.post('/mcp', async (req, res) => {
    try {
      const request = req.body;
      console.log('MCP request:', request.method);

      let response;

      switch (request.method) {
        case 'initialize':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
              },
              serverInfo: {
                name: 'useless',
                version: '1.0.0',
                description: 'Cross-occupational learning app teaching how professionals in different fields perform specific tasks. Perfect for learning something new, understanding job procedures, or discovering useless but interesting facts about different occupations.',
              },
            },
          };
          break;

        case 'resources/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              resources: [
                {
                  uri: 'ui://widget/learning-card.html',
                  name: 'Learning Card Widget',
                  description: 'Interactive learning card component with red/orange branding',
                  mimeType: 'text/html+skybridge',
                },
              ],
            },
          };
          break;

        case 'resources/read':
          if (request.params?.uri === 'ui://widget/learning-card.html') {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                contents: [
                  {
                    uri: 'ui://widget/learning-card.html',
                    mimeType: 'text/html+skybridge',
                    text: `
<div id="root"></div>
<script type="module">${componentCode}</script>
                    `.trim(),
                    _meta: {
                      'openai/widgetPrefersBorder': true,
                      'openai/widgetDescription': 'Displays an interactive learning card with red/orange branding showing cross-occupational skills and procedures.',
                    },
                  },
                ],
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32602,
                message: `Unknown resource: ${request.params?.uri}`,
              },
            };
          }
          break;

        case 'tools/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'get_learning_card',
                  title: 'Get Learning Card',
                  description: 'Get a cross-occupational learning card teaching how professionals perform specific tasks. Use when user asks about: how things work, professional techniques, job procedures, useless facts, learning something new, aircraft, chef, architect, electrician, paramedic, or asks to "tell me something". Returns detailed step-by-step instructions from different occupations.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        description: 'Optional: The specific card ID to retrieve (e.g., "aircraft-oil-change")',
                      },
                      occupation: {
                        type: 'string',
                        description: 'Optional: Filter by occupation (e.g., "Aircraft Engineer", "Chef", "Architect")',
                      },
                      category: {
                        type: 'string',
                        description: 'Optional: Filter by category (e.g., "Maintenance & Safety", "Culinary Arts")',
                      },
                    },
                  },
                  _meta: {
                    'openai/outputTemplate': 'ui://widget/learning-card.html',
                    'openai/toolInvocation/invoking': 'Loading learning card...',
                    'openai/toolInvocation/invoked': 'Learning card displayed',
                  },
                },
                {
                  name: 'list_all_cards',
                  description: 'List all available learning cards with their titles, occupations, and categories.',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                  },
                },
                {
                  name: 'search_cards',
                  description: 'Search learning cards by keyword in title, description, or occupation.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Search query to match against card titles, descriptions, and occupations',
                      },
                    },
                    required: ['query'],
                  },
                },
              ],
            },
          };
          break;

        case 'tools/call':
          const toolName = request.params?.name;
          const args = request.params?.arguments || {};

          try {
            const result = handleToolCall(toolName, args);
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result,
            };
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: error.message,
              },
            };
          }
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }

      res.json(response);
    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: error.message,
        },
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Useless MCP Server running on http://0.0.0.0:${PORT}`);
    console.log(`MCP endpoint available at http://0.0.0.0:${PORT}/mcp`);
    console.log(`Health check at http://0.0.0.0:${PORT}/`);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
