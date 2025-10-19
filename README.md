# Useless - Cross-Occupational Learning App

A ChatGPT App built with MCP (Model Context Protocol) and Apps SDK featuring custom UI components. Learn how professionals in different fields perform specific tasks through interactive, beautifully designed learning cards.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![MCP](https://img.shields.io/badge/MCP-2024--11--05-green)
![Apps SDK](https://img.shields.io/badge/Apps%20SDK-Custom%20UX-orange)

## 🎯 Overview

**Useless** teaches you "useless" but fascinating skills from various professions - from changing oil in jet engines to measuring building sites like an architect. Each learning card is displayed in a custom red/orange branded UI component that renders directly in ChatGPT.

### Key Features

✅ **Custom UI Components** - Red/orange themed interactive cards with dark mode support
✅ **MCP Protocol** - Standards-compliant server with resources and tools
✅ **Apps SDK Integration** - Proper component templates using `text/html+skybridge`
✅ **Structured Content** - Clean data flow from server to component via `window.openai`
✅ **5 Learning Cards** - Aircraft engineering, culinary arts, architecture, electrical, and emergency medicine

## 📁 Project Structure

```
useless/
├── src/
│   └── index.js              # MCP server with component resource handling
├── web/
│   ├── src/
│   │   └── component.js      # Vanilla JS component (4KB)
│   └── dist/
│       └── component.js      # Built component bundle
├── data/
│   └── learning-cards.json   # Learning content (5 cards)
├── Dockerfile                # Production container
├── fly.toml                  # Fly.io deployment config
├── package.json              # Server dependencies
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and install
cd /path/to/useless
npm install

# Build component (optional - already built)
cp web/src/component.js web/dist/component.js
```

### 2. Local Testing

Start the MCP server:
```bash
npm start
```

The server runs on `http://localhost:3000` with the following endpoints:
- `/` - Health check
- `/mcp` - MCP protocol endpoint (POST)

### 3. Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy (uses existing fly.toml)
flyctl deploy --app useless

# Check status
flyctl status --app useless
```

Your server will be live at: `https://useless.fly.dev/mcp`

### 4. Connect to ChatGPT

1. Open [ChatGPT](https://chatgpt.com)
2. Go to **Settings → Apps & Connections → Advanced Options**
3. Enable **Developer Mode**
4. Click **Add App**:
   - **Name**: Useless
   - **Description**: Cross-occupational learning with custom UI
   - **MCP Server URL**: `https://useless.fly.dev/mcp`
   - **Authentication**: None
5. **Refresh the app** after adding (important for component support!)
6. Test: "Tell me something useless"

## 🎨 How It Works

### Architecture

```
ChatGPT → MCP Protocol → Express Server → Component Resource
                ↓              ↓                    ↓
           tools/list    structuredContent    HTML Template
                ↓              ↓                    ↓
         Tool Metadata    window.openai      Vanilla JS UI
```

### 1. MCP Server (`src/index.js`)

The server implements four MCP methods:

#### `initialize`
Returns server capabilities and metadata:
```javascript
{
  protocolVersion: '2024-11-05',
  capabilities: {
    tools: {},      // Supports tool calls
    resources: {}   // Supports component resources
  }
}
```

#### `resources/list`
Advertises available UI components:
```javascript
{
  resources: [{
    uri: 'ui://widget/learning-card.html',
    name: 'Learning Card Widget',
    mimeType: 'text/html+skybridge'  // Apps SDK component type
  }]
}
```

#### `resources/read`
Serves the component HTML template:
```javascript
{
  contents: [{
    uri: 'ui://widget/learning-card.html',
    mimeType: 'text/html+skybridge',
    text: `
      <div id="root"></div>
      <script type="module">${componentCode}</script>
    `,
    _meta: {
      'openai/widgetPrefersBorder': true,
      'openai/widgetDescription': '...'
    }
  }]
}
```

#### `tools/list`
Defines available tools with component metadata:
```javascript
{
  name: 'get_learning_card',
  _meta: {
    'openai/outputTemplate': 'ui://widget/learning-card.html',  // Links to component
    'openai/toolInvocation/invoking': 'Loading learning card...',
    'openai/toolInvocation/invoked': 'Learning card displayed'
  }
}
```

#### `tools/call`
Returns structured data for the component:
```javascript
{
  content: [{ type: 'text', text: '...' }],  // Fallback text
  structuredContent: {                        // → window.openai.toolOutput
    card: {
      id, title, description, occupation,
      category, steps, funFact, keyTakeaway
    }
  }
}
```

### 2. Component (`web/src/component.js`)

A 4KB vanilla JavaScript component that:

1. **Reads data** from `window.openai.toolOutput`
2. **Listens for theme changes** via `openai:set_globals` events
3. **Renders** styled HTML with red/orange branding
4. **Supports dark mode** by reading `window.openai.theme`

```javascript
// Get data injected by ChatGPT
const card = window.openai?.toolOutput?.card;

// Get current theme
const theme = window.openai?.theme || 'light';

// Listen for changes
window.addEventListener('openai:set_globals', () => {
  const card = getData();
  const theme = getTheme();
  document.getElementById('root').innerHTML = renderCard(card, theme);
});
```

### 3. Data Flow

```
Tool Call → structuredContent → ChatGPT → window.openai.toolOutput → Component
```

1. ChatGPT calls `get_learning_card`
2. Server returns `structuredContent: { card: {...} }`
3. ChatGPT fetches component via `resources/read`
4. ChatGPT injects data: `window.openai.toolOutput = structuredContent`
5. Component renders the card with custom styling

## 🛠️ Available Tools

### `get_learning_card`
Get a cross-occupational learning card.

**Parameters** (all optional):
- `id` - Specific card ID (e.g., "aircraft-oil-change")
- `occupation` - Filter by profession (e.g., "Chef")
- `category` - Filter by category (e.g., "Culinary Arts")

Returns a random card if no parameters provided.

### `list_all_cards`
List all available learning cards with titles, occupations, and categories.

### `search_cards`
Search cards by keyword.

**Parameters**:
- `query` - Search term (required)

## 📊 Learning Cards

Current collection includes:

| ID | Occupation | Category | Topic |
|----|-----------|----------|-------|
| `aircraft-oil-change` | Aircraft Engineer | Maintenance & Safety | Changing jet engine oil |
| `chef-knife-skills` | Professional Chef | Culinary Arts | Mastering knife techniques |
| `architect-site-measurement` | Architect | Design & Planning | Measuring building sites |
| `electrician-circuit-troubleshooting` | Electrician | Technical Troubleshooting | Diagnosing circuit problems |
| `paramedic-patient-assessment` | Paramedic | Emergency Response | Rapid patient assessment |

### Adding New Cards

Edit `data/learning-cards.json`:

```json
{
  "id": "unique-identifier",
  "title": "How Profession Does Task",
  "description": "Brief overview of the process",
  "category": "Category Name",
  "occupation": "Professional Title",
  "image": "https://unsplash.com/photo-id",
  "steps": [
    "Step 1 description",
    "Step 2 description",
    "..."
  ],
  "funFact": "Interesting trivia about this process",
  "keyTakeaway": "Main lesson or insight"
}
```

## 🎨 Component Styling

The UI component features:

- **Red/Orange Gradient Background** - Brand colors (#FF6B35, #FF8C42, #FFA559)
- **Dark Mode Support** - Adapts to ChatGPT's theme
- **Responsive Design** - Works on desktop and mobile
- **Professional Typography** - System fonts with careful hierarchy
- **Highlight Boxes** - For fun facts and key takeaways

**Light Mode**:
- Gradient: `#FF6B35 → #FF8C42 → #FFA559`
- Text: `#333333`

**Dark Mode**:
- Gradient: `#D84315 → #E64A19 → #FF6F00`
- Text: `#FFFFFF`

## 🔧 Development

### Local Development

```bash
# Run with auto-reload
npm run dev
```

### Component Development

1. Edit `web/src/component.js`
2. Copy to dist: `cp web/src/component.js web/dist/component.js`
3. Redeploy: `flyctl deploy --app useless`
4. **Refresh app in ChatGPT** (Settings → Apps → Refresh)

### Testing the MCP Server

Test endpoints directly:

```bash
# Health check
curl https://useless.fly.dev/

# MCP initialize
curl -X POST https://useless.fly.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List resources
curl -X POST https://useless.fly.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}'
```

### Viewing Logs

```bash
# Real-time logs
flyctl logs --app useless

# Recent logs
flyctl logs --no-tail --app useless
```

## 🔑 Key Implementation Details

### Why `text/html+skybridge`?

This is the **official Apps SDK MIME type** for component templates. Regular `text/html` won't work - ChatGPT specifically looks for `text/html+skybridge` to identify renderable components.

### Why `structuredContent`?

The Apps SDK documentation specifies that `structuredContent` in the tool response is automatically mapped to `window.openai.toolOutput` in the component iframe. This creates a clean data contract between server and UI.

### Why Vanilla JS instead of React?

- **Bundle size**: 4KB vs 1MB (250x smaller)
- **No build step**: Direct copy from src to dist
- **No dependencies**: Pure JavaScript
- **Fast loading**: Instant iframe initialization

### Component Refresh Requirement

**Critical**: After deploying server changes that affect component metadata (like `_meta` fields), you MUST refresh the app in ChatGPT's developer settings. ChatGPT caches tool and resource metadata aggressively.

## 📝 API Reference

### MCP Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize` | Get server capabilities | `{ capabilities, serverInfo }` |
| `resources/list` | List available components | `{ resources: [...] }` |
| `resources/read` | Get component HTML | `{ contents: [...] }` |
| `tools/list` | List available tools | `{ tools: [...] }` |
| `tools/call` | Execute a tool | `{ content, structuredContent }` |

### Component API (window.openai)

| Property | Type | Description |
|----------|------|-------------|
| `toolOutput` | Object | Data from `structuredContent` |
| `theme` | String | `'light'` or `'dark'` |
| `displayMode` | String | `'inline'`, `'fullscreen'`, or `'pip'` |
| `locale` | String | User's locale (e.g., `'en-US'`) |
| `callTool()` | Function | Call MCP tools from component |
| `sendFollowupMessage()` | Function | Insert message into conversation |

## 🐛 Troubleshooting

### Component not rendering

1. **Refresh the app** in ChatGPT developer settings
2. Check logs for `resources/read` requests
3. Verify component bundle size: `ls -lh web/dist/component.js`
4. Test resource endpoint directly with curl

### ChatGPT summarizing instead of showing component

- This means the resource isn't being fetched
- **Solution**: Delete and re-add the app in ChatGPT
- Ensure MIME type is exactly `text/html+skybridge`

### 424 Error

- Usually means component response is malformed
- Check that `structuredContent` is valid JSON
- Ensure component JavaScript has no syntax errors

## 📚 Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [ChatGPT Apps SDK](https://platform.openai.com/docs/guides/apps-sdk)
- [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [Fly.io Docs](https://fly.io/docs/)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add more learning cards
- Improve component styling
- Enhance server features
- Fix bugs

## ✨ Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [ChatGPT Apps SDK](https://platform.openai.com/docs/guides/apps-sdk)
- [Express.js](https://expressjs.com/)
- [Fly.io](https://fly.io/)

---

**Made with ❤️ for learning useless but fascinating skills**
