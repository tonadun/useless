// Minimal vanilla JS component - no React, no dependencies
(function() {
  // Get data from window.openai.toolOutput
  // ChatGPT passes structuredContent from the tool response here
  const getData = () => {
    const toolOutput = window.openai?.toolOutput;
    return toolOutput?.card || null;
  };

  const getTheme = () => {
    return window.openai?.theme || 'light';
  };

  // Create the card HTML
  const renderCard = (card, theme) => {
    const isDark = theme === 'dark';

    const styles = {
      container: `
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: ${isDark ? 'linear-gradient(135deg, #D84315 0%, #E64A19 50%, #FF6F00 100%)' : 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA559 100%)'};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
      `,
      header: `
        padding: 20px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: space-between;
        align-items: center;
      `,
      badge: `
        background: rgba(255, 255, 255, 0.95);
        color: #D84315;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `,
      category: `
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      `,
      content: `
        padding: 24px;
        background: #ffffff;
      `,
      title: `
        font-size: 26px;
        font-weight: 800;
        background: linear-gradient(135deg, #FF6B35, #FF8C42);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 12px;
      `,
      description: `
        color: #333;
        line-height: 1.6;
        margin-bottom: 24px;
      `,
      sectionTitle: `
        color: #FF6B35;
        font-weight: 700;
        font-size: 18px;
        margin: 20px 0 12px 0;
      `,
      step: `
        color: #333;
        line-height: 1.6;
        margin-bottom: 12px;
      `,
      factBox: `
        background: linear-gradient(135deg, #FFF5F0, #FFE8DC);
        border-left: 4px solid #FF8C42;
        padding: 18px;
        border-radius: 12px;
        margin: 16px 0;
      `,
      factLabel: `
        color: #FF6B35;
        font-weight: 700;
        margin-bottom: 8px;
      `,
      takeawayBox: `
        background: linear-gradient(135deg, #FFEBE5, #FFD4CC);
        border-left: 4px solid #D84315;
        padding: 18px;
        border-radius: 12px;
        margin: 16px 0;
      `,
      takeawayLabel: `
        color: #D84315;
        font-weight: 700;
        margin-bottom: 8px;
      `
    };

    return `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <div style="${styles.badge}">${card.occupation}</div>
          <div style="${styles.category}">${card.category}</div>
        </div>
        <div style="${styles.content}">
          <h1 style="${styles.title}">${card.title}</h1>
          <p style="${styles.description}">${card.description}</p>

          <div style="${styles.sectionTitle}">📋 Steps</div>
          <ol style="padding-left: 20px;">
            ${card.steps.map(step => `<li style="${styles.step}">${step}</li>`).join('')}
          </ol>

          <div style="${styles.factBox}">
            <div style="${styles.factLabel}">💡 Fun Fact</div>
            <div>${card.funFact}</div>
          </div>

          <div style="${styles.takeawayBox}">
            <div style="${styles.takeawayLabel}">🎯 Key Takeaway</div>
            <div>${card.keyTakeaway}</div>
          </div>
        </div>
      </div>
    `;
  };

  // Initial render
  const card = getData();
  const theme = getTheme();

  if (card) {
    document.getElementById('root').innerHTML = renderCard(card, theme);
  }

  // Listen for theme changes
  window.addEventListener('openai:set_globals', () => {
    const card = getData();
    const theme = getTheme();
    if (card) {
      document.getElementById('root').innerHTML = renderCard(card, theme);
    }
  });
})();
