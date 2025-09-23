document.addEventListener("DOMContentLoaded", function () {
  const inputText = document.getElementById("inputText");
  const dictionarySelect = document.getElementById("dictionarySelect");
  const convertBtn = document.getElementById("convertBtn");
  const outputText = document.getElementById("outputText");
  const stats = document.getElementById("stats");

  // Convert button click handler
  convertBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    const dictionary = dictionarySelect.value;

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
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          dictionary: dictionary,
          format: "html",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Display converted text
        outputText.innerHTML = result.data.converted;

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
        throw new Error(result.error.message || "変換に失敗しました");
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
      convertBtn.textContent = "💎 変換";
    }
  });

  // Enter key handler for textarea
  inputText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      convertBtn.click();
    }
  });

  // Sample text for demonstration
  const sampleTexts = [
    "重要な会議で新しい戦略を検討した。",
    "効率的な解決策を見つけるために協力する必要がある。",
    "技術の進歩により、私たちの生活は大きく変化している。",
  ];

  // Add sample text button (for development)
  if (process.env.NODE_ENV !== "production") {
    const sampleBtn = document.createElement("button");
    sampleBtn.textContent = "サンプルテキスト";
    sampleBtn.style.marginLeft = "10px";
    sampleBtn.onclick = () => {
      const randomText =
        sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      inputText.value = randomText;
    };
    convertBtn.parentNode.appendChild(sampleBtn);
  }
});
