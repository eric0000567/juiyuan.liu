/**
 * 本地配置式個人投資組合管理系統
 * 功能：讀取本地配置、實時價格獲取、配息計算、負債利息追蹤
 */

class LocalPortfolioManager {
    constructor() {
        this.config = null;
        this.currentPrices = {};
        this.exchangeRates = {};
        this.priceHistory = [];
        this.charts = {};
        this.lastUpdate = null;
        this.updateInterval = null;
        
        this.init();
    }

    /**
     * 初始化系統
     */
    async init() {
        try {
            await this.loadConfig();
            this.loadHistoryData();
            this.setupEventListeners();
            this.checkAndProcessAutoPayments();  // 檢查自動還款
            await this.updateAllPrices();
            this.updateDisplay();
            this.initCharts();
            this.startAutoUpdate();
            this.recordSnapshot();
        } catch (error) {
            console.error('初始化失敗：', error);
            this.showConfigModal();
        }
    }

    /**
     * 檢查是否需要清除歷史數據
     */
    checkClearHistory() {
        if (this.config && this.config.portfolioInfo && this.config.portfolioInfo.clearHistoryOnNextLoad) {
            console.log('偵測到清除歷史數據請求，正在清除...');
            this.priceHistory = [];
            this.saveHistoryData();
            this.showNotification('歷史數據已清除（由配置檔案觸發）', 'success');
            
            // 清除完成後，移除配置中的清除標記
            // 注意：這只會影響記憶體中的配置，不會修改實際檔案
            this.config.portfolioInfo.clearHistoryOnNextLoad = false;
        }
    }

    /**
     * 檢查並處理自動還款
     */
    checkAndProcessAutoPayments() {
        if (!this.config || !this.config.assets || !this.config.assets.liabilities) {
            return;
        }

        const today = new Date();
        let hasPayments = false;

        this.config.assets.liabilities.forEach(liability => {
            if (this.shouldProcessPayment(liability, today)) {
                this.processLoanPayment(liability);
                hasPayments = true;
            }
        });

        if (hasPayments) {
            this.saveConfigChanges();
            this.showNotification('已處理自動還款', 'success');
        }
    }

    /**
     * 檢查是否應該處理還款
     */
    shouldProcessPayment(liability, today) {
        if (!liability.autoPayment || !liability.paymentDay || !liability.monthlyPayment || liability.amount <= 0) {
            return false;
        }

        // 檢查今天是否是還款日
        const isPaymentDay = today.getDate() === liability.paymentDay;
        
        if (!isPaymentDay) {
            return false;
        }

        // 檢查這個月是否已經扣款過
        const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        const lastPaymentYearMonth = liability.lastPaymentYearMonth;
        
        // 如果這個月還沒有扣款過，則執行扣款
        return currentYearMonth !== lastPaymentYearMonth;
    }

    /**
     * 處理貸款還款
     */
    processLoanPayment(liability) {
        const paymentAmount = liability.monthlyPayment;
        const currentAmount = liability.amount;

        // 確保不會還款超過剩餘金額
        const actualPayment = Math.min(paymentAmount, currentAmount);
        
        // 扣除貸款金額
        liability.amount -= actualPayment;
        
        // 記錄本次扣款的年月，防止重複扣款
        const today = new Date();
        liability.lastPaymentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        liability.lastPaymentDate = today.toISOString().split('T')[0];

        console.log(`處理 ${liability.name} 還款：$${actualPayment.toLocaleString()}`);
        console.log(`剩餘金額：$${liability.amount.toLocaleString()}`);
        console.log(`記錄扣款月份：${liability.lastPaymentYearMonth}`);

        // 如果貸款已還清
        if (liability.amount <= 0) {
            liability.amount = 0;
            liability.autoPayment = false;
            this.showNotification(`🎉 ${liability.name} 已還清！`, 'success');
        } else {
            this.showNotification(`💳 ${liability.name} 本月已扣款 $${actualPayment.toLocaleString()}`, 'success');
        }
    }



    /**
     * 保存配置變更（注意：這只更新記憶體中的配置，實際檔案需要手動更新）
     */
    saveConfigChanges() {
        // 在實際應用中，這裡可能需要與後端API溝通或提示用戶手動更新配置檔案
        // 目前我們只在記憶體中更新，並在本地存儲中記錄變更
        try {
            const paymentHistory = this.getPaymentHistory();
            paymentHistory.push({
                timestamp: new Date().toISOString(),
                config: JSON.parse(JSON.stringify(this.config.assets.liabilities))
            });
            
            localStorage.setItem('portfolioPaymentHistory', JSON.stringify(paymentHistory));
        } catch (error) {
            console.error('保存還款歷史失敗：', error);
        }
    }

    /**
     * 獲取還款歷史
     */
    getPaymentHistory() {
        try {
            const history = localStorage.getItem('portfolioPaymentHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('載入還款歷史失敗：', error);
            return [];
        }
    }

    /**
     * 載入配置檔案
     */
    async loadConfig() {
        try {
            const response = await fetch('./portfolio-config.json');
            if (!response.ok) {
                throw new Error('無法載入配置檔案');
            }
            this.config = await response.json();
            console.log('配置載入成功:', this.config);
            this.lastUpdate = this.config.portfolioInfo?.lastUpdate;
            
            // 檢查是否需要清除歷史數據
            this.checkClearHistory();
            
        } catch (error) {
            console.error('載入配置檔案失敗：', error);
            // 使用預設配置
            this.config = this.getDefaultConfig();
            throw error;
        }
    }

    /**
     * 獲取預設配置
     */
    getDefaultConfig() {
        return {
            portfolioInfo: {
                name: "個人投資組合",
                baseCurrency: "TWD"
            },
            assets: {
                crypto: [],
                taiwanStocks: [],
                cash: [],
                forex: [],
                liabilities: []
            },
            displaySettings: {
                showPublic: {
                    totalValue: true,
                    assetAllocation: true,
                    historicalChart: true,
                    dividendIncome: true
                }
            }
        };
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 類別卡片點擊展開/收起
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.toggleCategoryDetails(e.currentTarget);
            });
        });

        // 配置說明按鈕
        document.querySelector('.config-info').addEventListener('click', () => {
            this.showConfigModal();
        });

        // 圖表控制按鈕
        document.querySelectorAll('.time-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleTimeToggle(e);
            });
        });

        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeConfigModal();
            }
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.refreshData();
            }
        });
    }

    /**
     * 切換類別詳情顯示
     */
    toggleCategoryDetails(card) {
        const isExpanded = card.classList.contains('expanded');
        
        // 關閉所有其他展開的卡片
        document.querySelectorAll('.category-card.expanded').forEach(c => {
            c.classList.remove('expanded');
        });

        if (!isExpanded) {
            card.classList.add('expanded');
            this.loadCategoryDetails(card.dataset.category);
        }
    }

        /**
     * 載入類別詳情
     */
    loadCategoryDetails(category) {
        const detailsContainer = document.getElementById(`${category}Details`);
        const assets = this.config.assets[category] || [];

        if (assets.length === 0) {
            detailsContainer.innerHTML = '<p style="color: #b0bec5; text-align: center; padding: 1rem;">暫無資料</p>';
            return;
        }

        // 按資產價值排序（價值大的排前面）
        const sortedAssets = [...assets].sort((a, b) => {
            const valueA = this.calculateAssetValue(a, category);
            const valueB = this.calculateAssetValue(b, category);
            return valueB - valueA;
        });

        const detailsHTML = sortedAssets.map(asset => {
            const currentPrice = this.getCurrentPrice(asset, category);
            const totalValue = this.calculateAssetValue(asset, category);
            const change = this.calculateAssetChange(asset, currentPrice, category);
            
            // 對於USDT計價的加密貨幣，顯示額外的價格資訊
            let priceInfo = `$${this.formatNumber(totalValue)}`;
            if (category === 'crypto' && asset.priceCurrency === 'USDT') {
                const usdtPrice = this.getCurrentPriceInOriginalCurrency(asset, category);
                if (usdtPrice && !isNaN(usdtPrice)) {
                    priceInfo += `<br><small style="color: #b0bec5;">${usdtPrice.toFixed(2)} USDT</small>`;
                }
            }

            // 對於負債，顯示還款相關信息
            let additionalInfo = '';
            if (category === 'liabilities' && asset.autoPayment) {
                const monthlyPayment = asset.monthlyPayment ? `$${asset.monthlyPayment.toLocaleString()}` : 'N/A';
                const paymentDay = asset.paymentDay ? `每月${asset.paymentDay}號` : 'N/A';
                const lastPaymentDate = asset.lastPaymentDate ? new Date(asset.lastPaymentDate).toLocaleDateString('zh-TW') : '尚未扣款';
                
                // 計算下次扣款日期
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                let nextPaymentMonth = currentMonth;
                let nextPaymentYear = currentYear;
                
                // 如果本月的還款日已過，下次扣款是下個月
                if (today.getDate() > asset.paymentDay) {
                    nextPaymentMonth += 1;
                    if (nextPaymentMonth > 11) {
                        nextPaymentMonth = 0;
                        nextPaymentYear += 1;
                    }
                }
                
                const nextPaymentDate = new Date(nextPaymentYear, nextPaymentMonth, asset.paymentDay);
                const nextPaymentDateStr = nextPaymentDate.toLocaleDateString('zh-TW');
                
                additionalInfo = `
                    <div style="margin-top: 8px; font-size: 0.85em; color: #b0bec5;">
                        <div>月付金額: ${monthlyPayment}</div>
                        <div>還款日期: ${paymentDay}</div>
                        <div>上次扣款: ${lastPaymentDate}</div>
                        <div>下次扣款: ${nextPaymentDateStr}</div>
                        <div style="color: ${asset.autoPayment ? '#4caf50' : '#ff9800'};">
                            ${asset.autoPayment ? '✅ 自動扣款' : '⏸️ 手動還款'}
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="asset-detail">
                    <div class="asset-detail-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol} • ${this.formatQuantity(asset.quantity, category, asset)}</p>
                        ${additionalInfo}
                    </div>
                    <div class="asset-detail-value">
                        <div class="price">${priceInfo}</div>
                        <div class="change ${change.className}">${change.text}</div>
                    </div>
                </div>
            `;
        }).join('');

        detailsContainer.innerHTML = detailsHTML;
    }

    /**
     * 獲取當前價格（台幣）
     */
    getCurrentPrice(asset, category) {
        if (category === 'cash') {
            return asset.averageCost; // 現金價格固定為1
        }
        
        if (category === 'liabilities') {
            return asset.amount; // 負債金額
        }

        if (category === 'crypto') {
            // 檢查是否使用手動價格
            if (asset.useManualPrice && asset.manualPrice) {
                if (asset.priceCurrency === 'USDT') {
                    return asset.manualPrice * (this.exchangeRates.USDT || 31.5);
                }
                return asset.manualPrice;
            }

            const priceData = this.currentPrices[asset.symbol];
            if (priceData && typeof priceData === 'object') {
                return priceData.twd; // 返回台幣價格
            }
            // 降級處理：如果是USDT計價，轉換為台幣
            if (asset.priceCurrency === 'USDT') {
                return asset.averageCost * (this.exchangeRates.USDT || 31.5);
            }
            return asset.averageCost;
        }

        return this.currentPrices[asset.symbol] || asset.averageCost;
    }

    /**
     * 獲取原始計價貨幣的價格（用於顯示）
     */
    getCurrentPriceInOriginalCurrency(asset, category) {
        if (category === 'crypto' && asset.priceCurrency === 'USDT') {
            // 檢查是否使用手動價格
            if (asset.useManualPrice && asset.manualPrice) {
                return asset.manualPrice; // 返回手動設定的USDT價格
            }

            const priceData = this.currentPrices[asset.symbol];
            if (priceData && typeof priceData === 'object') {
                return priceData.usdt; // 返回USDT價格
            }
            return asset.averageCost; // 返回購入時的USDT價格
        }
        
        return this.getCurrentPrice(asset, category);
    }

    /**
     * 計算資產價值
     */
    calculateAssetValue(asset, category) {
        if (category === 'cash') {
            return asset.quantity;
        }
        
        if (category === 'liabilities') {
            return asset.amount;
        }

        const currentPrice = this.getCurrentPrice(asset, category);
        return currentPrice * asset.quantity;
    }

    /**
     * 計算資產變化
     */
    calculateAssetChange(asset, currentPrice, category) {
        if (category === 'cash' || category === 'liabilities') {
            const rate = asset.dividendRate || asset.interestRate || 0;
            return {
                className: rate > 0 ? 'positive' : 'neutral',
                text: `${rate}% 年利率`
            };
        }

        if (category === 'crypto' && asset.priceCurrency === 'USDT') {
            // 對於USDT計價的加密貨幣，使用USDT價格計算變化
            const currentUSDTPrice = this.getCurrentPriceInOriginalCurrency(asset, category);
            const purchaseUSDTPrice = asset.averageCost;
            
            if (!currentUSDTPrice || currentUSDTPrice === purchaseUSDTPrice) {
                return { className: 'neutral', text: '0.00%' };
            }

            const changePercent = ((currentUSDTPrice - purchaseUSDTPrice) / purchaseUSDTPrice) * 100;
            const className = changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral';
            const sign = changePercent >= 0 ? '+' : '';
            
            return {
                className,
                text: `${sign}${changePercent.toFixed(2)}% (USDT)`
            };
        }

        if (!currentPrice || currentPrice === asset.averageCost) {
            return { className: 'neutral', text: '0.00%' };
        }

        const changePercent = ((currentPrice - asset.averageCost) / asset.averageCost) * 100;
        const className = changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral';
        const sign = changePercent >= 0 ? '+' : '';
        
        return {
            className,
            text: `${sign}${changePercent.toFixed(2)}%`
        };
    }

    /**
     * 格式化數量顯示
     */
    formatQuantity(quantity, category, asset = null) {
        switch (category) {
            case 'crypto':
                if (asset && asset.priceCurrency === 'USDT') {
                    return `${quantity.toLocaleString()} 個 • ${asset.averageCost.toLocaleString()} USDT/個`;
                }
                return `${quantity.toLocaleString()} 個`;
            case 'taiwanStocks':
                return `${quantity.toLocaleString()} 股`;
            case 'cash':
                return `$${quantity.toLocaleString()}`;
            case 'forex':
                return `${quantity.toLocaleString()} 單位`;
            case 'liabilities':
                return `負債金額`;
            default:
                return quantity.toLocaleString();
        }
    }

    /**
     * 更新所有價格
     */
    async updateAllPrices() {
        this.showLoading();

        try {
            // 更新加密貨幣價格
            await this.updateCryptoPrices();
            
            // 更新台股價格
            await this.updateTaiwanStockPrices();
            
            // 更新外匯價格
            await this.updateForexPrices();

            this.lastUpdate = new Date().toISOString();
            this.saveHistoryData();
            
        } catch (error) {
            console.error('更新價格失敗：', error);
            this.showNotification('價格更新失敗，請稍後再試', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 更新加密貨幣價格
     */
    async updateCryptoPrices() {
        const cryptoAssets = this.config.assets.crypto || [];
        if (cryptoAssets.length === 0) return;

        try {
            // 首先獲取 USDT 對台幣的匯率
            await this.updateUSDTRate();

            const symbols = cryptoAssets.map(asset => {
                // 映射常見符號到 CoinGecko ID
                const coinGeckoMap = {
                    'BTC': 'bitcoin',
                    'ETH': 'ethereum',
                    'USDT': 'tether',
                    'BNB': 'binancecoin',
                    'ADA': 'cardano',
                    'SOL': 'solana',
                    'XRP': 'ripple',
                    'DOT': 'polkadot',
                    'DOGE': 'dogecoin',
                    'AVAX': 'avalanche-2',
                    'MAX': 'max-exchange-token',  // 台灣 MAX 交易所代幣
                    'MATIC': 'matic-network',
                    'LINK': 'chainlink',
                    'LTC': 'litecoin',
                    'BCH': 'bitcoin-cash',
                    'UNI': 'uniswap',
                    'COMP': 'compound-governance-token'
                };
                return coinGeckoMap[asset.symbol] || asset.symbol.toLowerCase();
            }).join(',');

            // 獲取 USDT 和 USD 價格
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd,usdt`
            );

            if (!response.ok) throw new Error('CoinGecko API 失敗');

            const data = await response.json();
            
            cryptoAssets.forEach(asset => {
                const coinGeckoMap = {
                    'BTC': 'bitcoin',
                    'ETH': 'ethereum',
                    'USDT': 'tether',
                    'BNB': 'binancecoin',
                    'ADA': 'cardano',
                    'SOL': 'solana',
                    'XRP': 'ripple',
                    'DOT': 'polkadot',
                    'DOGE': 'dogecoin',
                    'AVAX': 'avalanche-2',
                    'MAX': 'max-exchange-token',  // 台灣 MAX 交易所代幣
                    'MATIC': 'matic-network',
                    'LINK': 'chainlink',
                    'LTC': 'litecoin',
                    'BCH': 'bitcoin-cash',
                    'UNI': 'uniswap',
                    'COMP': 'compound-governance-token'
                };
                
                const coinId = coinGeckoMap[asset.symbol] || asset.symbol.toLowerCase();
                if (data[coinId]) {
                    // 根據資產的計價貨幣決定使用哪個價格
                    if (asset.priceCurrency === 'USDT' && data[coinId].usdt) {
                        // 使用 USDT 價格，然後轉換為台幣
                        this.currentPrices[asset.symbol] = {
                            usdt: data[coinId].usdt,
                            twd: data[coinId].usdt * (this.exchangeRates.USDT || 31.5),
                            priceCurrency: 'USDT'
                        };
                    } else if (data[coinId].usd) {
                        // 使用 USD 價格，轉換為台幣
                        this.currentPrices[asset.symbol] = {
                            usd: data[coinId].usd,
                            twd: data[coinId].usd * (this.exchangeRates.USD || 31.5),
                            priceCurrency: 'USD'
                        };
                    }
                } else {
                    console.warn(`無法找到 ${asset.symbol} 的價格數據，CoinGecko ID: ${coinId}`);
                }
            });

        } catch (error) {
            console.error('更新加密貨幣價格失敗：', error);
        }
    }

    /**
     * 更新 USDT 對台幣匯率
     */
    async updateUSDTRate() {
        try {
            // 獲取 USDT 對 USD 的匯率 (通常接近1)
            const usdtResponse = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd'
            );
            
            if (usdtResponse.ok) {
                const usdtData = await usdtResponse.json();
                const usdtToUsd = usdtData.tether?.usd || 1.0;
                
                // USDT 對台幣匯率 = USDT對USD匯率 × USD對台幣匯率
                this.exchangeRates.USDT = usdtToUsd * (this.exchangeRates.USD || 31.5);
                
                console.log(`USDT/TWD 匯率: ${this.exchangeRates.USDT.toFixed(2)}`);
            }
        } catch (error) {
            console.error('更新 USDT 匯率失敗：', error);
            // 使用預設值
            this.exchangeRates.USDT = this.exchangeRates.USD || 31.5;
        }
    }

    /**
     * 更新台股價格
     */
    async updateTaiwanStockPrices() {
        const stockAssets = this.config.assets.taiwanStocks || [];
        if (stockAssets.length === 0) return;

        for (const asset of stockAssets) {
            try {
                // 使用 Yahoo Finance API
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${asset.symbol}`
                );

                if (response.ok) {
                    const data = await response.json();
                    const result = data.chart.result[0];
                    if (result?.meta?.regularMarketPrice) {
                        this.currentPrices[asset.symbol] = result.meta.regularMarketPrice;
                    }
                }

                // 添加延遲避免API限制
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`更新 ${asset.symbol} 價格失敗：`, error);
            }
        }
    }

    /**
     * 更新外匯價格
     */
    async updateForexPrices() {
        try {
            // 獲取美元對台幣匯率
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (response.ok) {
                const data = await response.json();
                this.exchangeRates.USD = data.rates.TWD || 31.5;
                this.exchangeRates.JPY = data.rates.TWD / data.rates.JPY;
                this.exchangeRates.EUR = data.rates.TWD / data.rates.EUR;
            }

            // 更新外匯資產價格
            const forexAssets = this.config.assets.forex || [];
            forexAssets.forEach(asset => {
                if (this.exchangeRates[asset.symbol]) {
                    this.currentPrices[asset.symbol] = this.exchangeRates[asset.symbol];
                }
            });

        } catch (error) {
            console.error('更新外匯價格失敗：', error);
        }
    }

    /**
     * 更新顯示
     */
    updateDisplay() {
        this.updateSummaryCards();
        this.updateCategoryCards();
        this.updateDividendSection();
    }

    /**
     * 更新摘要卡片
     */
    updateSummaryCards() {
        const totals = this.calculateTotals();
        
        // 淨資產價值（資產-負債）
        document.getElementById('totalValue').textContent = 
            `$${this.formatNumber(totals.netWorth)}`;

        // 總變化（基於總資產）
        const totalChange = totals.totalCost > 0 ? 
            ((totals.totalAssets - totals.totalCost) / totals.totalCost) * 100 : 0;
        const changeElement = document.getElementById('totalChange');
        const changeSign = totalChange >= 0 ? '+' : '';
        changeElement.textContent = `${changeSign}${totalChange.toFixed(2)}%`;
        changeElement.className = 'change-indicator ' + 
            (totalChange > 0 ? 'positive' : totalChange < 0 ? 'negative' : 'neutral');

        // 資產數量
        const totalAssetCount = Object.values(this.config.assets)
            .reduce((sum, category) => sum + (Array.isArray(category) ? category.length : 0), 0);
        document.getElementById('assetCount').textContent = totalAssetCount;
        document.getElementById('assetTypes').textContent = `5 種類型`;

        // 最後更新時間
        if (this.lastUpdate) {
            const updateTime = new Date(this.lastUpdate);
            document.getElementById('lastUpdate').textContent = updateTime.toLocaleString('zh-TW');
        }
    }

    /**
     * 更新類別卡片
     */
    updateCategoryCards() {
        const totals = this.calculateTotals();

        // 建立類別數據陣列並按價值排序
        const categories = [
            { key: 'crypto', data: totals.crypto, isLiability: false },
            { key: 'taiwanStocks', data: totals.taiwanStocks, isLiability: false },
            { key: 'cash', data: totals.cash, isLiability: false },
            { key: 'forex', data: totals.forex, isLiability: false },
            { key: 'liabilities', data: totals.liabilities, isLiability: true }
        ];

        // 按價值排序（價值大的排前面）
        categories.sort((a, b) => b.data.value - a.data.value);

        // 重新排列 DOM 元素
        const container = document.getElementById('assetCategories');
        categories.forEach(category => {
            const card = document.querySelector(`[data-category="${category.key}"]`);
            if (card) {
                container.appendChild(card);
                this.updateCategoryCard(category.key, category.data, totals.totalAssets, category.isLiability);
            }
        });
    }

    /**
     * 更新單個類別卡片
     */
    updateCategoryCard(category, totals, totalAssets, isLiability = false) {
        const card = document.querySelector(`[data-category="${category}"]`);
        if (!card) return;

        const valueElement = card.querySelector('.category-value');
        const changeElement = card.querySelector('.category-change, .category-interest');
        const weightElement = card.querySelector('.category-weight');

        // 更新價值
        const prefix = isLiability ? '-$' : '$';
        valueElement.textContent = `${prefix}${this.formatNumber(totals.value)}`;

        // 更新變化或利率
        if (isLiability) {
            const avgRate = totals.avgRate || 0;
            changeElement.textContent = `利率: ${avgRate.toFixed(2)}%`;
        } else {
            const changePercent = totals.changePercent || 0;
            const changeClass = changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral';
            const changeSign = changePercent >= 0 ? '+' : '';
            changeElement.textContent = `${changeSign}${changePercent.toFixed(2)}%`;
            changeElement.className = `category-change ${changeClass}`;
        }

        // 更新權重百分比
        if (isLiability) {
            // 負債顯示債務比率（負債/總資產）
            const debtRatio = totalAssets > 0 ? (totals.value / totalAssets) * 100 : 0;
            weightElement.textContent = `${debtRatio.toFixed(0)}% 債務比`;
            weightElement.style.color = debtRatio > 100 ? '#f44336' : '#ff9800';
        } else {
            // 正常資產顯示配置比例
            const weight = totalAssets > 0 ? (totals.value / totalAssets) * 100 : 0;
            weightElement.textContent = `${weight.toFixed(1)}%`;
            weightElement.style.color = '#64ffda';
        }
    }

    /**
     * 計算各類別總計
     */
    calculateTotals() {
        const result = {
            totalAssets: 0,
            totalCost: 0,
            totalLiabilities: 0,
            netWorth: 0,
            crypto: { value: 0, cost: 0, changePercent: 0 },
            taiwanStocks: { value: 0, cost: 0, changePercent: 0 },
            cash: { value: 0, cost: 0, changePercent: 0 },
            forex: { value: 0, cost: 0, changePercent: 0 },
            liabilities: { value: 0, avgRate: 0 }
        };

        // 計算各類別
        Object.keys(this.config.assets).forEach(category => {
            const assets = this.config.assets[category] || [];
            
            let totalLiabilityValue = 0;
            let weightedInterestRate = 0;
            
            assets.forEach(asset => {
                try {
                    const currentValue = this.calculateAssetValue(asset, category);
                    
                    if (category === 'liabilities') {
                        result.liabilities.value += currentValue;
                        totalLiabilityValue += currentValue;
                        
                        if (asset.interestRate && currentValue > 0) {
                            weightedInterestRate += asset.interestRate * currentValue;
                        }
                    } else {
                        const cost = this.calculateAssetCost(asset, category);
                        if (!isNaN(currentValue) && !isNaN(cost)) {
                            result[category].value += currentValue;
                            result[category].cost += cost;
                            result.totalAssets += currentValue;
                            result.totalCost += cost;
                        }
                    }
                } catch (error) {
                    console.error(`計算資產 ${asset.symbol} 時發生錯誤：`, error);
                }
            });

            // 計算負債的加權平均利率
            if (category === 'liabilities' && totalLiabilityValue > 0) {
                result.liabilities.avgRate = weightedInterestRate / totalLiabilityValue;
            }

            // 計算變化百分比
            if (category !== 'liabilities' && result[category].cost > 0) {
                result[category].changePercent = 
                    ((result[category].value - result[category].cost) / result[category].cost) * 100;
            }
        });

        // 計算淨資產
        result.totalLiabilities = result.liabilities.value;
        result.netWorth = result.totalAssets - result.totalLiabilities;

        return result;
    }

    /**
     * 計算資產成本
     */
    calculateAssetCost(asset, category) {
        if (!asset || typeof asset.quantity === 'undefined' || typeof asset.averageCost === 'undefined') {
            return 0;
        }

        if (category === 'cash') {
            return asset.quantity; // 現金成本等於面額
        }
        
        if (category === 'crypto' && asset.priceCurrency === 'USDT') {
            // USDT計價的加密貨幣，轉換為台幣成本
            const usdtRate = this.exchangeRates.USDT || 31.5;
            return asset.averageCost * asset.quantity * usdtRate;
        }
        
        return asset.averageCost * asset.quantity;
    }

    /**
     * 更新股息收益區塊
     */
    updateDividendSection() {
        const monthlyDividend = this.calculateMonthlyDividend();
        const monthlyInterest = this.calculateMonthlyInterest();
        const monthlyNetIncome = monthlyDividend - monthlyInterest;

        document.getElementById('dividendIncome').textContent = 
            `$${this.formatNumber(monthlyDividend)} / 月`;
        
        document.getElementById('interestExpense').textContent = 
            `-$${this.formatNumber(monthlyInterest)} / 月`;
        
        const netElement = document.getElementById('netIncome');
        netElement.textContent = `$${this.formatNumber(monthlyNetIncome)} / 月`;
        netElement.className = `income-value ${monthlyNetIncome >= 0 ? '' : 'negative'}`;
    }

    /**
     * 計算月度股息收入
     */
    calculateMonthlyDividend() {
        let totalDividend = 0;

        ['crypto', 'taiwanStocks', 'cash', 'forex'].forEach(category => {
                                const assets = this.config.assets[category] || [];
            assets.forEach(asset => {
                try {
                    if (asset.dividendRate && asset.dividendRate > 0) {
                        const currentValue = this.calculateAssetValue(asset, category);
                        if (!isNaN(currentValue) && currentValue > 0) {
                            // 年化利率除以12得到月利率
                            totalDividend += currentValue * (asset.dividendRate / 100 / 12);
                        }
                    }
                } catch (error) {
                    console.error(`計算 ${asset.symbol} 股息時發生錯誤：`, error);
                }
            });
        });

        return totalDividend;
    }

    /**
     * 計算月度利息支出
     */
    calculateMonthlyInterest() {
        let totalInterest = 0;

        const liabilities = this.config.assets.liabilities || [];
        liabilities.forEach(liability => {
            try {
                if (liability.interestRate && liability.interestRate > 0 && liability.amount) {
                    // 年化利率除以12得到月利率
                    totalInterest += liability.amount * (liability.interestRate / 100 / 12);
                }
            } catch (error) {
                console.error(`計算 ${liability.name} 利息時發生錯誤：`, error);
            }
        });

        return totalInterest;
    }

    /**
     * 初始化圖表
     */
    initCharts() {
        this.initAllocationChart();
        this.initPerformanceChart();
    }

    /**
     * 初始化資產配置圖表
     */
    initAllocationChart() {
        const ctx = document.getElementById('allocationChart').getContext('2d');
        
        this.charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['加密貨幣', '台股', '台幣現金', '外匯'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#ff9800', '#2196f3', '#4caf50', '#9c27b0'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        this.updateAllocationChart();
    }

    /**
     * 初始化歷史表現圖表
     */
    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '總資產價值',
                    data: [],
                    borderColor: '#64ffda',
                    backgroundColor: 'rgba(100, 255, 218, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#64ffda',
                    pointBorderColor: '#1a1a1a',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: 'rgba(176, 190, 197, 0.1)' }
                    },
                    y: {
                        ticks: { 
                            color: '#b0bec5',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(176, 190, 197, 0.1)' }
                    }
                }
            }
        });

        this.updatePerformanceChart();
    }

    /**
     * 更新資產配置圖表
     */
    updateAllocationChart() {
        if (!this.charts.allocation) return;

        const totals = this.calculateTotals();
        const values = [
            totals.crypto.value,
            totals.taiwanStocks.value,
            totals.cash.value,
            totals.forex.value
        ];

        this.charts.allocation.data.datasets[0].data = values;
        this.charts.allocation.update();
    }

    /**
     * 更新歷史表現圖表
     */
    updatePerformanceChart() {
        if (!this.charts.performance || this.priceHistory.length === 0) return;

        const period = this.getCurrentTimePeriod();
        const filteredHistory = this.filterHistoryByPeriod(this.priceHistory, period);

        const labels = filteredHistory.map(entry => {
            const date = new Date(entry.timestamp);
            return date.toLocaleDateString('zh-TW');
        });

        const values = filteredHistory.map(entry => entry.totalValue);

        this.charts.performance.data.labels = labels;
        this.charts.performance.data.datasets[0].data = values;
        this.charts.performance.update();
    }

    /**
     * 記錄價格快照
     */
    recordSnapshot() {
        const timestamp = new Date().toISOString();
        const totals = this.calculateTotals();

        const snapshot = {
            timestamp,
            totalValue: totals.netWorth, // 改為記錄淨資產
            totalAssets: totals.totalAssets,
            totalLiabilities: totals.totalLiabilities,
            categories: {
                crypto: totals.crypto.value,
                taiwanStocks: totals.taiwanStocks.value,
                cash: totals.cash.value,
                forex: totals.forex.value
            },
            monthlyDividend: this.calculateMonthlyDividend(),
            monthlyInterest: this.calculateMonthlyInterest()
        };

        this.priceHistory.push(snapshot);

        // 保留最近 365 筆記錄
        if (this.priceHistory.length > 365) {
            this.priceHistory = this.priceHistory.slice(-365);
        }

        this.saveHistoryData();
    }

    /**
     * 處理時間週期切換
     */
    handleTimeToggle(e) {
        const button = e.target;

        // 更新按鈕狀態
        button.parentElement.querySelectorAll('.time-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // 更新圖表
        this.updatePerformanceChart();
    }

    /**
     * 獲取當前時間週期
     */
    getCurrentTimePeriod() {
        const activeButton = document.querySelector('.time-toggle.active');
        return activeButton ? activeButton.dataset.period : '30d';
    }

    /**
     * 根據時間週期過濾歷史數據
     */
    filterHistoryByPeriod(history, period) {
        const now = new Date();
        const periodMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };

        const daysBack = periodMap[period] || 30;
        const cutoffTime = now.getTime() - (daysBack * 24 * 60 * 60 * 1000);
        
        return history.filter(entry => 
            new Date(entry.timestamp).getTime() >= cutoffTime
        );
    }

    /**
     * 開始自動更新
     */
    startAutoUpdate() {
        // 每 10 分鐘自動更新一次價格
        this.updateInterval = setInterval(() => {
            this.refreshData();
        }, 10 * 60 * 1000);
    }

    /**
     * 刷新數據
     */
    async refreshData() {
        this.checkAndProcessAutoPayments();  // 每次刷新時檢查還款
        await this.updateAllPrices();
        this.updateDisplay();
        this.updateCharts();
        this.recordSnapshot();
        this.showNotification('數據已更新', 'success');
    }

    /**
     * 顯示/隐藏配置模態框
     */
    showConfigModal() {
        document.getElementById('configInfoModal').classList.add('show');
    }

    closeConfigModal() {
        document.getElementById('configInfoModal').classList.remove('show');
    }

    /**
     * 下載配置範本
     */
    downloadConfigTemplate() {
        const template = this.getDefaultConfig();
        template.assets = {
            crypto: [{
                id: "btc_example",
                symbol: "BTC",
                name: "比特幣",
                quantity: 0.1,
                averageCost: 80000,
                priceCurrency: "USDT",
                purchaseDate: "2023-06-15",
                dividendRate: 0,
                useManualPrice: false,
                manualPrice: 0,
                notes: "範例資產 - USDT計價",
                platform: "交易所名稱"
            },{
                id: "max_example",
                symbol: "MAX",
                name: "MAX Token",
                quantity: 1000,
                averageCost: 0.32,
                priceCurrency: "USDT",
                purchaseDate: "2023-06-15",
                dividendRate: 2.5,
                useManualPrice: true,
                manualPrice: 0.37,
                notes: "台灣MAX交易所代幣 - 使用手動價格",
                platform: "MAX交易所"
            }],
            taiwanStocks: [{
                id: "tsmc_example",
                symbol: "2330.TW",
                name: "台積電",
                quantity: 10,
                averageCost: 480,
                purchaseDate: "2023-05-10",
                dividendRate: 2.8,
                notes: "範例股票",
                broker: "證券商名稱"
            }],
            cash: [{
                id: "twd_savings",
                symbol: "TWD",
                name: "台幣定存",
                quantity: 100000,
                averageCost: 1,
                purchaseDate: "2023-01-01",
                dividendRate: 1.5,
                notes: "定期存款",
                bank: "銀行名稱"
            }],
            forex: [{
                id: "usd_example",
                symbol: "USD",
                name: "美元",
                quantity: 1000,
                averageCost: 31.2,
                purchaseDate: "2023-04-15",
                dividendRate: 0,
                notes: "美元投資",
                platform: "銀行名稱"
            }],
            liabilities: [{
                id: "house_loan",
                symbol: "HOUSE_MORTGAGE",
                name: "房屋貸款",
                quantity: 1,
                amount: 5000000,
                interestRate: 2.1,
                startDate: "2022-03-01",
                termYears: 30,
                notes: "自住房屋貸款",
                bank: "銀行名稱"
            }]
        };

        const blob = new Blob([JSON.stringify(template, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-config-template.json';
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('配置範本已下載', 'success');
    }

    /**
     * 顯示配置指南
     */
    showConfigGuide() {
        window.open('https://github.com/eric0000567/juiyuan.liu/blob/main/CONFIG_GUIDE.md', '_blank');
    }

    /**
     * 工具函數
     */
    formatNumber(value) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 2000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        return colors[type] || colors.info;
    }

    /**
     * 數據持久化
     */
    saveHistoryData() {
        try {
            const data = {
                priceHistory: this.priceHistory,
                lastUpdate: this.lastUpdate,
                version: '2.0.0'
            };
            localStorage.setItem('portfolioHistoryData', JSON.stringify(data));
        } catch (error) {
            console.error('儲存歷史數據失敗：', error);
        }
    }

    loadHistoryData() {
        try {
            const data = localStorage.getItem('portfolioHistoryData');
            if (data) {
                const parsed = JSON.parse(data);
                this.priceHistory = parsed.priceHistory || [];
                this.lastUpdate = parsed.lastUpdate;
            }
        } catch (error) {
            console.error('載入歷史數據失敗：', error);
            this.priceHistory = [];
        }
    }
}

// 初始化系統
let portfolioManager;

document.addEventListener('DOMContentLoaded', () => {
    portfolioManager = new LocalPortfolioManager();
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// 全域函數
function closeConfigModal() {
    portfolioManager.closeConfigModal();
}

function downloadConfigTemplate() {
    portfolioManager.downloadConfigTemplate();
}

function showConfigGuide() {
    portfolioManager.showConfigGuide();
} 