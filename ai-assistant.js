// AI Assistant logic for Research Paper Organizer
// Uses Gemini API, Chart.js/Plotly, and Web Speech API

// --- Gemini API Integration via backend proxy ---
async function fetchGeminiInsights(paper) {
  // Call local backend proxy instead of Gemini API directly
  const prompt = `Analyze this research paper and provide a detailed breakdown.

Paper Details:
Title: ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year}
Journal: ${paper.journal}
Abstract: ${paper.abstract}

Please provide:
1. TL;DR: A brief 1-2 sentence summary
2. Detailed Summary: An expanded explanation of the paper's main contributions
3. Key Points: List the main takeaways and findings
4. Questions: 3 thought-provoking questions about the research
5. Visualization Suggestions: Ideas for charts or graphs

Format your response with clear headers for each section (TL;DR:, Detailed Summary:, etc.)`;

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const res = await fetch('http://localhost:3001/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gemini API error');
  const data = await res.json();
  
  console.log('Raw Gemini response:', data);
  
  // Extract the text from the response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    console.error('Invalid or empty response from Gemini API');
    throw new Error('Failed to get response from AI');
  }
  
  console.log('Extracted text:', text);
  
  // Parse the response into sections
  const sections = {
    tldr: '',
    detailed: '',
    keyPoints: [],
    questions: [],
    visualSuggestions: []
  };

  // Split response into sections and process each part
  const parts = text.split('\n');
  let currentSection = '';

  parts.forEach(part => {
    if (part.toLowerCase().includes('tl;dr') || part.toLowerCase().includes('tldr')) {
      currentSection = 'tldr';
    } else if (part.toLowerCase().includes('detailed summary')) {
      currentSection = 'detailed';
    } else if (part.toLowerCase().includes('key points')) {
      currentSection = 'keyPoints';
    } else if (part.toLowerCase().includes('questions')) {
      currentSection = 'questions';
    } else if (part.toLowerCase().includes('visualization')) {
      currentSection = 'visualSuggestions';
    } else if (part.trim()) {
      switch (currentSection) {
        case 'tldr':
          sections.tldr += part.trim() + ' ';
          break;
        case 'detailed':
          sections.detailed += part.trim() + ' ';
          break;
        case 'keyPoints':
          if (part.startsWith('-')) {
            sections.keyPoints.push(part.substring(1).trim());
          }
          break;
        case 'questions':
          if (part.startsWith('-') || /^\d+\./.test(part)) {
            sections.questions.push(part.replace(/^-|\d+\./, '').trim());
          }
          break;
        case 'visualSuggestions':
          if (part.startsWith('-')) {
            sections.visualSuggestions.push(part.substring(1).trim());
          }
          break;
      }
    }
  });

  return sections;
}

// --- Chart.js/Plotly Integration ---
function renderVisualization(type, data, containerId) {
  if (window.Plotly) {
    // Example: Keyword frequency bar chart
    if (type === 'keyword-frequency') {
      const trace = {
        x: data.keywords,
        y: data.counts,
        type: 'bar',
        marker: { color: '#2563eb' },
      };
      Plotly.newPlot(containerId, [trace], { title: 'Keyword Frequency' });
    }
    // Add more chart types as needed
  } else if (window.Chart) {
    // Example: Year-wise stats
    if (type === 'year-wise') {
      new Chart(document.getElementById(containerId), {
        type: 'line',
        data: {
          labels: data.years,
          datasets: [{
            label: 'Papers per Year',
            data: data.counts,
            borderColor: '#2563eb',
            fill: false,
          }],
        },
      });
    }
    // Add more chart types as needed
  }
}

// --- Web Speech API (Text-to-Speech) ---
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('Sorry, your browser does not support speech synthesis.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  window.speechSynthesis.speak(utter);
}

// --- UI Integration ---
window.AIAssistant = {
  fetchGeminiInsights,
  renderVisualization,
  speakText,
};
