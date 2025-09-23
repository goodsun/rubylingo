document.addEventListener("DOMContentLoaded", function () {
  const inputText = document.getElementById("inputText");
  const convertBtn = document.getElementById("convertBtn");
  const outputText = document.getElementById("outputText");
  const stats = document.getElementById("stats");

  // Convert button click handler
  convertBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();

    if (!text) {
      alert("日本語テキストを入力してください");
      return;
    }

    // Show loading state
    convertBtn.disabled = true;
    convertBtn.textContent = "変換中...";
    outputText.innerHTML =
      '<div style="text-align: center; color: #666;">処理中です...</div>';
    stats.textContent = "";

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          format: "html",
        }),
      });

      // Debug: Display raw API response
      console.log('API Response Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        // Display converted text
        outputText.innerHTML = result.data.converted;

        // Add click event listeners to ruby elements for speech synthesis
        addRubyClickHandlers();

        // Display statistics
        const statsData = result.data.stats;
        stats.innerHTML = `
                    <strong>変換統計:</strong>
                    文字数: ${statsData.total_characters} |
                    変換語数: ${statsData.converted_words} |
                    変換率: ${statsData.conversion_rate} |
                    処理時間: ${statsData.processing_time}ms
                `;
      } else {
        throw new Error(result.error?.message || "変換に失敗しました");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      outputText.innerHTML = `
                <div style="color: #e74c3c; text-align: center;">
                    エラーが発生しました: ${error.message}
                </div>
            `;
      stats.textContent = "";
    } finally {
      // Reset button state
      convertBtn.disabled = false;
      convertBtn.textContent = "変換";
    }
  });

  // Enter key handler for textarea
  inputText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      convertBtn.click();
    }
  });

  // Generate HTML with color-coded ruby elements
  function generateRubyHTML(originalText, tokens) {
    if (!tokens || !Array.isArray(tokens)) {
      return originalText;
    }

    let result = "";
    let lastIndex = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Add text before this token
      if (token.start > lastIndex) {
        result += originalText.slice(lastIndex, token.start);
      }

      // Add ruby element with color class
      const colorIndex = i % 3;
      result += `<ruby class="ruby-color-${colorIndex}">${token.word}<rt>${token.translation}</rt></ruby>`;

      lastIndex = token.end;
    }

    // Add remaining text
    if (lastIndex < originalText.length) {
      result += originalText.slice(lastIndex);
    }

    return result;
  }

  // Text-to-speech functionality
  function speakText(text) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }

  // Add click event listeners to ruby elements
  function addRubyClickHandlers() {
    const rubyElements = outputText.querySelectorAll('ruby');
    
    rubyElements.forEach(ruby => {
      // Remove any existing click handlers
      ruby.removeEventListener('click', handleRubyClick);
      
      // Add click handler
      ruby.addEventListener('click', handleRubyClick);
      
      // Add visual indication that it's clickable
      ruby.style.cursor = 'pointer';
      ruby.title = 'Click to hear pronunciation';
    });
  }

  // Handle ruby element clicks
  function handleRubyClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const ruby = event.currentTarget;
    const rtElement = ruby.querySelector('rt');
    
    if (rtElement) {
      const englishText = rtElement.textContent.trim();
      console.log('Speaking:', englishText);
      
      // Add visual feedback
      ruby.style.background = '#e3f2fd';
      setTimeout(() => {
        ruby.style.background = '';
      }, 300);
      
      speakText(englishText);
    }
  }
});
