# 劉瑞源 個人網站

一個現代化、響應式的個人網站，具備自動化CI/CD部署功能。

## 🚀 功能特色

- **現代化設計**: 採用深色主題，美觀的漸變背景和動畫效果
- **響應式設計**: 完美適配桌面、平板和手機設備
- **CI/CD自動化**: 使用GitHub Actions自動部署到GitHub Pages
- **性能優化**: 代碼壓縮、懶加載和性能監控
- **互動體驗**: 平滑滾動、打字效果、視差滾動等動畫
- **SEO友好**: 語義化HTML和meta標籤優化

## 🛠️ 技術棧

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **樣式**: 自定義CSS with Flexbox/Grid
- **字體**: Noto Sans TC (中文), Font Awesome (圖標)
- **部署**: GitHub Pages
- **CI/CD**: GitHub Actions
- **優化**: HTML/CSS/JS壓縮

## 📁 項目結構

```
juiyuan.liu/
├── index.html          # 主頁面
├── styles.css          # 樣式文件
├── script.js           # JavaScript功能
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions工作流程
├── README.md           # 項目說明
├── package.json        # 項目配置
└── .gitignore         # Git忽略文件
```

## 🚀 快速開始

### 1. Fork 或 Clone 項目

```bash
git clone https://github.com/yourusername/juiyuan.liu.git
cd juiyuan.liu
```

### 2. 本地開發

使用任何HTTP服務器運行項目：

```bash
# 使用Python (Python 3)
python -m http.server 8000

# 使用Node.js http-server
npx http-server

# 使用Live Server (VS Code擴展)
# 或直接打開index.html
```

訪問 `http://localhost:8000` 查看網站。

### 3. 自動部署設置

1. **推送到GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **啟用GitHub Pages**:
   - 進入GitHub倉庫設置
   - 滾動到"Pages"部分
   - 在"Source"下選擇"GitHub Actions"

3. **自動部署**:
   - 每次推送到`main`分支時，GitHub Actions會自動構建和部署
   - 網站將在 `https://yourusername.github.io/juiyuan.liu` 可訪問

## 📝 自定義內容

### 個人信息
編輯 `index.html` 中的以下部分：

- **基本信息**: 姓名、職位、聯絡方式
- **工作經歷**: 更新timeline部分的工作經驗
- **作品集**: 添加或修改project cards
- **學歷**: 更新教育背景
- **技能**: 修改技術標籤和描述

### 樣式自定義
編輯 `styles.css`：

- **顏色主題**: 修改CSS變量中的顏色值
- **字體**: 更改字體家族或大小
- **動畫**: 調整動畫時間和效果
- **佈局**: 修改響應式斷點和網格佈局

### 功能增強
編輯 `script.js`：

- **動畫效果**: 自定義滾動動畫
- **互動功能**: 添加新的交互特性
- **性能優化**: 調整懶加載和其他優化

## 🔧 開發工具

### 本地調試
```bash
# 檢查HTML語法
npx html-validate index.html

# CSS語法檢查
npx stylelint styles.css

# JavaScript語法檢查
npx eslint script.js
```

### 性能測試
```bash
# 使用Lighthouse進行性能測試
npm install -g lighthouse
lighthouse http://localhost:8000 --view
```

## 📊 CI/CD流程

GitHub Actions工作流程包含以下步驟：

1. **代碼檢出**: 獲取最新代碼
2. **環境設置**: 安裝Node.js和構建工具
3. **代碼優化**: 壓縮HTML、CSS、JavaScript
4. **部署**: 自動部署到GitHub Pages
5. **通知**: 顯示部署狀態和網站鏈接

## 🌟 最佳實踐

### 內容更新
- 定期更新工作經歷和作品集
- 保持聯絡信息的準確性
- 添加新的技能和認證

### 性能優化
- 壓縮圖片資源
- 使用WebP格式的圖片
- 定期檢查網站性能

### SEO優化
- 更新meta描述和關鍵詞
- 使用結構化數據
- 確保所有圖片都有alt標籤

## 🐛 故障排除

### 常見問題

1. **網站無法訪問**
   - 檢查GitHub Pages設置
   - 確認分支名稱正確 (main/master)
   - 等待幾分鐘讓部署完成

2. **樣式不顯示**
   - 檢查CSS文件路徑
   - 確認瀏覽器緩存已清除
   - 檢查控制台錯誤

3. **JavaScript功能失效**
   - 檢查瀏覽器控制台錯誤
   - 確認所有依賴已加載
   - 驗證JavaScript語法

### 調試命令
```bash
# 檢查Git狀態
git status

# 查看最近的提交
git log --oneline -5

# 檢查GitHub Actions狀態
# 訪問: https://github.com/username/repo/actions
```

## 📄 許可證

此項目使用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🤝 貢獻

歡迎提交問題和功能請求！如果您想貢獻代碼：

1. Fork 這個項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打開Pull Request

## 📞 聯絡

劉瑞源 - eric0000567@gmail.com

項目連結: [https://github.com/yourusername/juiyuan.liu](https://github.com/yourusername/juiyuan.liu)

---

⭐ 如果這個項目對您有幫助，請給它一個星星！ 