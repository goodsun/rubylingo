#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

class JMdictDownloader {
  constructor() {
    this.baseUrl = "ftp.edrdg.org";
    this.jmdictPath = "/pub/Nihongo/JMdict_e.gz";
    this.outputDir = path.join(__dirname, "..", "data");
    this.outputFile = path.join(this.outputDir, "JMdict_e.xml");
  }

  async download() {
    console.log(" JMdict辞書のダウンロードを開始します...");

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Download compressed file
    const compressedFile = this.outputFile + ".gz";
    await this.downloadFile(compressedFile);

    // Decompress
    await this.decompressFile(compressedFile);

    // Cleanup
    fs.unlinkSync(compressedFile);

    console.log("✅ JMdictダウンロード完了:", this.outputFile);
    return this.outputFile;
  }

  downloadFile(outputPath) {
    return new Promise((resolve, reject) => {
      // Use HTTP URL instead of FTP for better compatibility
      const url = `http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz`;

      console.log("📥 ダウンロード中:", url);

      const file = fs.createWriteStream(outputPath);

      http
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${response.statusCode}: ${response.statusMessage}`
              )
            );
            return;
          }

          const totalSize = parseInt(response.headers["content-length"] || "0");
          let downloadedSize = 0;

          response.on("data", (chunk) => {
            downloadedSize += chunk.length;
            const progress =
              totalSize > 0
                ? ((downloadedSize / totalSize) * 100).toFixed(1)
                : "?";
            process.stdout.write(
              `\r進捗: ${progress}% (${Math.round(
                downloadedSize / 1024 / 1024
              )}MB)`
            );
          });

          response.pipe(file);

          file.on("finish", () => {
            console.log("\n📦 ダウンロード完了");
            file.close();
            resolve();
          });

          file.on("error", (err) => {
            fs.unlink(outputPath, () => {}); // Delete incomplete file
            reject(err);
          });
        })
        .on("error", reject);
    });
  }

  decompressFile(compressedPath) {
    return new Promise((resolve, reject) => {
      const zlib = require("zlib");

      console.log("📂 解凍中...");

      const input = fs.createReadStream(compressedPath);
      const output = fs.createWriteStream(this.outputFile);
      const gunzip = zlib.createGunzip();

      input.pipe(gunzip).pipe(output);

      output.on("finish", () => {
        console.log("✅ 解凍完了");
        resolve();
      });

      output.on("error", reject);
      gunzip.on("error", reject);
    });
  }

  async checkFileExists() {
    if (fs.existsSync(this.outputFile)) {
      const stats = fs.statSync(this.outputFile);
      const ageInHours =
        (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

      if (ageInHours < 24) {
        console.log(" 既存のJMdictファイルを使用します (24時間以内)");
        return true;
      } else {
        console.log("📅 既存ファイルが古いため、再ダウンロードします");
        return false;
      }
    }
    return false;
  }

  async downloadIfNeeded() {
    if (await this.checkFileExists()) {
      return this.outputFile;
    }
    return await this.download();
  }
}

// CLI usage
if (require.main === module) {
  const downloader = new JMdictDownloader();

  downloader
    .downloadIfNeeded()
    .then((filepath) => {
      console.log("🎉 JMdict準備完了:", filepath);

      // Show file info
      const stats = fs.statSync(filepath);
      console.log(
        `📊 ファイルサイズ: ${Math.round(stats.size / 1024 / 1024)}MB`
      );
      console.log(`📅 更新日時: ${stats.mtime.toLocaleString()}`);
    })
    .catch((err) => {
      console.error("❌ エラー:", err.message);
      process.exit(1);
    });
}

module.exports = JMdictDownloader;
