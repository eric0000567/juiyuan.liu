# 投資組合配置指南

## 📋 概述

此投資組合管理系統採用本地配置檔案模式，確保您的投資資訊安全私密。所有資產資料存放在 `portfolio-config.json` 檔案中，網站僅作為展示用途。

## 🚀 快速開始

### 1. 下載配置範本
在網站上點擊「下載配置範本」按鈕，獲得基本的配置檔案範本。

### 2. 編輯配置檔案
將下載的檔案重命名為 `portfolio-config.json`，並放置在與網站檔案相同的目錄中。

### 3. 設定您的資產
根據以下說明編輯配置檔案。

### 4. 自動更新與部署
- 每次 `git push` 時，系統會自動更新 `lastUpdate` 時間戳
- 無需手動修改更新時間
- 重新載入網站頁面即可看到您的投資組合

## 📁 檔案結構

```
juiyuan.liu/
├── index.html
├── portfolio.html
├── portfolio-config.json    ← 您的配置檔案
├── portfolio-script.js
├── portfolio-styles.css
└── styles.css
```

## ⚙️ 配置檔案說明

### 基本資訊設定

```json
{
  "portfolioInfo": {
    "name": "您的投資組合名稱",
    "lastUpdate": "2024-01-01T00:00:00.000Z",
    "baseCurrency": "TWD",
    "description": "投資組合描述",
    "clearHistoryOnNextLoad": false
  }
}
```

**🗑️ 清除歷史數據功能：**
- 設定 `clearHistoryOnNextLoad: true` 可在下次載入時自動清除歷史數據
- 適用於開發測試階段重新開始記錄
- 系統會在清除完成後自動將此值重設為 `false`
- 比網頁按鈕更安全，避免誤觸清除

### 資產類別

系統支援以下五種資產類別：

#### 1. 加密貨幣 (crypto)

```json
"crypto": [
  {
    "id": "btc_holding",           // 唯一識別碼
    "symbol": "BTC",               // 代碼（用於API查詢）
    "name": "比特幣",              // 顯示名稱
    "quantity": 0.5,               // 持有數量
    "averageCost": 80000,          // 平均成本價
    "priceCurrency": "USDT",       // 計價貨幣（USDT 或 USD）
    "purchaseDate": "2023-06-15",  // 購入日期
    "dividendRate": 0,             // 配息率（年化百分比）
    "useManualPrice": false,       // 是否使用手動價格
    "manualPrice": 0,              // 手動設定價格（當useManualPrice為true時使用）
    "notes": "長期持有策略",        // 備註
    "platform": "幣安"            // 交易平台
  }
]
```

**💡 USDT 計價功能：**
- 設定 `priceCurrency: "USDT"` 來使用 USDT 計價
- `averageCost` 填入您的 USDT 購入價格（例：80000 USDT）
- 系統會自動轉換為台幣顯示總資產價值
- 漲跌計算基於 USDT 價格變化，更符合實際交易情況

**🎯 手動價格設定功能：**
- 設定 `useManualPrice: true` 啟用手動價格
- 在 `manualPrice` 欄位設定您想要的價格
- 適用於 API 無法正確獲取的代幣（如台灣本土代幣）
- 手動價格會覆蓋 API 獲取的價格

**支援的加密貨幣代碼：**
- BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX
- MAX（台灣MAX交易所代幣）, MATIC, LINK, LTC, BCH, UNI, COMP

#### 2. 台股 (taiwanStocks)

```json
"taiwanStocks": [
  {
    "id": "tsmc_holding",
    "symbol": "2330.TW",           // 台股代碼（必須加 .TW 後綴）
    "name": "台積電",
    "quantity": 100,               // 股數
    "averageCost": 480,            // 平均成本價（台幣）
    "purchaseDate": "2023-05-10",
    "dividendRate": 2.8,           // 股息殖利率（年化百分比）
    "notes": "半導體龍頭股",
    "broker": "富邦證券"           // 證券商
  }
]
```

**常見台股代碼：**
- 2330.TW (台積電)
- 2882.TW (國泰金)
- 2454.TW (聯發科)
- 2303.TW (聯電)
- 2317.TW (鴻海)

#### 3. 台幣現金 (cash)

```json
"cash": [
  {
    "id": "twd_savings",
    "symbol": "TWD",               // 幣別代碼
    "name": "台幣定存",
    "quantity": 500000,            // 金額
    "averageCost": 1,              // 固定為 1
    "purchaseDate": "2023-01-01",
    "dividendRate": 1.5,           // 利率（年化百分比）
    "notes": "緊急預備金",
    "bank": "國泰世華銀行"         // 銀行名稱
  }
]
```

**現金類型：**
- TWD（台幣定存）
- TWD_CURRENT（台幣活存）

#### 4. 外匯 (forex)

```json
"forex": [
  {
    "id": "usd_holding",
    "symbol": "USD",               // 外幣代碼
    "name": "美元外匯",
    "quantity": 5000,              // 外幣數量
    "averageCost": 31.2,           // 購入匯率
    "purchaseDate": "2023-04-15",
    "dividendRate": 0,             // 利息率
    "notes": "美元投資避險",
    "platform": "台灣銀行"         // 兌換平台
  }
]
```

**支援的外幣：**
- USD（美元）
- JPY（日圓）
- EUR（歐元）

#### 5. 負債 (liabilities)

```json
"liabilities": [
  {
    "id": "house_loan",
    "symbol": "HOUSE_MORTGAGE",    // 負債類型代碼
    "name": "房屋貸款",
    "quantity": 1,                 // 固定為 1
    "amount": 8000000,             // 負債金額
    "interestRate": 2.1,           // 負債利率（年化百分比）
    "startDate": "2022-03-01",     // 開始日期
    "termYears": 30,               // 貸款年限
    "notes": "自住房屋貸款",
    "bank": "國泰世華銀行"         // 貸款銀行
  }
]
```

**負債類型：**
- HOUSE_MORTGAGE（房屋貸款）
- CAR_LOAN（車貸）
- CREDIT_DEBT（信用卡債務）
- PERSONAL_LOAN（個人信貸）

## 💰 配息利率設定

### 投資標的配息設定

在各類資產中設定 `dividendRate` 欄位：

```json
{
  "dividendRate": 2.8  // 年化配息率 2.8%
}
```

### 負債利率設定

在負債項目中設定 `interestRate` 欄位：

```json
{
  "interestRate": 2.1  // 年化利率 2.1%
}
```

## 🔧 API 設定

系統會自動從以下 API 獲取實時價格：

### 加密貨幣價格
- **來源：** CoinGecko API
- **支援貨幣：** USD、USDT 雙重計價
- **更新頻率：** 5 分鐘
- **USDT 匯率：** 自動獲取 USDT/USD/TWD 匯率
- **免費額度：** 每分鐘 50 次請求
- **手動價格：** 支援手動設定價格覆蓋 API 結果

### 台股價格
- **來源：** Yahoo Finance API
- **更新頻率：** 5 分鐘
- **支援時間：** 台股交易時間

### 外匯匯率
- **來源：** ExchangeRate API
- **更新頻率：** 1 小時
- **基準貨幣：** USD

## 📊 顯示設定

可以控制哪些資訊對外顯示：

```json
"displaySettings": {
  "showPublic": {
    "totalValue": true,          // 顯示總資產價值
    "assetAllocation": true,     // 顯示資產配置
    "historicalChart": true,     // 顯示歷史圖表
    "dividendIncome": true,      // 顯示股息收入
    "individualAssets": false,   // 隱藏個別資產詳情
    "exactQuantities": false,    // 隱藏精確數量
    "purchasePrices": false      // 隱藏購入價格
  },
  "privacy": {
    "maskSensitiveData": true,      // 遮蔽敏感資料
    "showPercentageOnly": true,     // 僅顯示百分比
    "roundToNearestThousand": true  // 四捨五入到千位
  }
}
```

## 🎯 投資目標設定

可以設定投資目標和配置比例：

```json
"targets": {
  "assetAllocation": {
    "crypto": 20,        // 加密貨幣 20%
    "taiwanStocks": 40,  // 台股 40%
    "cash": 20,          // 現金 20%
    "forex": 20          // 外匯 20%
  },
  "annualReturn": 8.0,       // 目標年報酬率 8%
  "maxDrawdown": 15.0,       // 最大回撤 15%
  "emergencyFundMonths": 6   // 緊急預備金 6 個月
}
```

## 📈 功能特色

### 實時價格更新
- 自動獲取最新市場價格
- 支援多種資產類別和計價貨幣
- USDT 和 USD 價格自動換算為台幣
- 智能匯率轉換（USDT ≈ USD ≈ 31.5 TWD）

### 配息收入計算
- 自動計算月度股息收入
- 顯示利息支出
- 計算淨收益

### 歷史數據記錄
- 自動記錄價格變化
- 支援多時間週期圖表
- 本地數據存儲

### 隱私保護
- 資料完全本地化
- 不上傳任何敏感資訊
- 可自訂顯示內容

### 🆕 手動價格設定
- 支援手動設定特定資產價格
- 適用於 API 無法獲取的代幣
- 價格設定以原始計價貨幣為準

### 🆕 歷史數據管理
- 通過配置檔案控制清除歷史數據
- 設定 `clearHistoryOnNextLoad: true` 即可在下次載入時清除
- 適用於開發測試階段
- 比網頁按鈕更安全，避免誤觸

### 🆕 資產配置百分比優化
- 正常資產顯示實際配置比例
- 負債顯示債務比率（紅色警示）
- 合理的百分比計算邏輯

## 🔧 故障排除

### 常見問題

#### 1. 網站顯示空白或錯誤
**解決方法：**
- 檢查 `portfolio-config.json` 檔案是否存在
- 驗證 JSON 格式是否正確
- 查看瀏覽器控制台錯誤訊息

#### 2. 價格無法更新
**解決方法：**
- 檢查網路連線
- 確認資產代碼是否正確
- 等待 API 冷卻時間
- 考慮使用手動價格設定

#### 3. 特定代幣價格錯誤
**解決方法：**
- 使用手動價格設定功能
- 在配置中設定 `useManualPrice: true`
- 在 `manualPrice` 欄位設定正確價格

#### 4. 圖表不顯示
**解決方法：**
- 確保有歷史數據記錄
- 檢查時間週期設定
- 嘗試重新載入頁面
- 如需重新開始，可使用清除歷史功能

#### 5. 如何清除歷史記錄
**新方法（推薦）：**
- 在 `portfolio-config.json` 中設定 `"clearHistoryOnNextLoad": true`
- 推送更新到 GitHub
- 重新載入網站頁面
- 系統會自動清除歷史數據並顯示確認訊息

**舊方法（已移除）：**
- 網頁上的清除歷史按鈕已移除，改用配置檔案控制

#### 6. 百分比顯示異常
**解決方法：**
- 正常資產：顯示在總資產中的配置比例
- 負債：顯示債務比率（負債金額 ÷ 總資產）
- 如果債務比率超過 100%，會顯示紅色警示
- 這是正常現象，表示負債金額大於總資產

### JSON 格式驗證

使用線上 JSON 驗證工具確保格式正確：
- [JSONLint](https://jsonlint.com/)
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)

## 📞 技術支援

如果遇到問題，可以：

1. **檢查配置範本**：下載最新的配置範本對比
2. **查看錯誤日誌**：開啟瀏覽器開發者工具查看錯誤
3. **重新開始**：使用基本範本重新設定
4. **清除歷史**：在配置檔案中設定 `clearHistoryOnNextLoad: true`

## 🔄 更新說明

### 版本 2.2.0 (最新版本)
- ✅ 優化資產配置百分比顯示邏輯
- ✅ 負債改為顯示債務比率，超過100%時紅色警示
- ✅ 清除歷史功能移到配置檔案控制
- ✅ 移除網頁清除歷史按鈕，避免誤觸
- ✅ 更安全的歷史數據管理機制

### 版本 2.1.0 (2024-01-27)
- ✅ 自動更新時間戳（每次 push 自動更新）
- ✅ USDT 計價支援（加密貨幣可用 USDT 計價）
- ✅ 智能貨幣轉換（自動轉換為台幣顯示）
- ✅ 多幣種價格顯示（同時顯示 USDT 和台幣價格）
- ✅ 手動價格設定（解決特定代幣價格問題）
- ✅ 歷史數據清除功能（開發階段便利功能）
- ✅ 修正台灣 MAX 代幣價格獲取
- ✅ 淨資產顯示（資產減負債）
- ✅ 月度收益計算

### 版本 2.0.0 (2024-01-01)
- ✅ 新增本地配置管理
- ✅ 支援五種資產類別
- ✅ 加入配息利率計算
- ✅ 負債利息追蹤
- ✅ 隱私保護設定

---

**注意事項：**
- 配置檔案包含敏感財務資訊，請妥善保管
- 建議定期備份配置檔案
- 系統僅供個人使用，不提供投資建議
- 手動價格設定需要定期更新以保持準確性
- 清除歷史記錄操作無法撤銷，請謹慎使用
- 百分比計算已優化，負債顯示債務比率更直觀 