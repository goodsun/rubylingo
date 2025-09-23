// 簡易アイコン生成スクリプト
// Node.jsで実行: node create-icons.js

const fs = require('fs');

// SVGテンプレート（R文字のアイコン）
const createSvg = (size, isOff = false) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${isOff ? '#999' : '#2196F3'}" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}px" font-weight="bold" fill="white" text-anchor="middle" dy=".35em">R</text>
</svg>
`;

// 各サイズのアイコンを生成
const sizes = [16, 48, 128];
const states = ['', '_off'];

sizes.forEach(size => {
  states.forEach(state => {
    const isOff = state === '_off';
    const filename = `icon${size}${state}.svg`;
    const svg = createSvg(size, isOff);
    fs.writeFileSync(filename, svg);
    console.log(`Created ${filename}`);
  });
});

console.log('\nSVGアイコンを作成しました。');
console.log('PNGに変換する場合は、オンラインコンバーターまたは画像編集ソフトを使用してください。');
console.log('または、以下のような単純なHTMLで仮アイコンとして使用できます。');