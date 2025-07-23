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

        const detailsHTML = assets.map(asset => {
            const currentPrice = this.getCurrentPrice(asset, category);
            const totalValue = this.calculateAssetValue(asset, category);
            const change = this.calculateAssetChange(asset, currentPrice, category);
            
            return `
                <div class="asset-detail">
                    <div class="asset-detail-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol} • ${this.formatQuantity(asset.quantity, category)}</p>
                    </div>
                    <div class="asset-detail-value">
                        <div class="price">$${this.formatNumber(totalValue)}</div>
                        <div class="change ${change.className}">${change.text}</div>
                    </div>
                </div>
            `;
        }).join('');

        detailsContainer.innerHTML = detailsHTML;
    }

    /**
     * 獲取當前價格
     */
    getCurrentPrice(asset, category) {
        if (category === 'cash') {
            return asset.averageCost; // 現金價格固定為1
        }
        
        if (category === 'liabilities') {
            return asset.amount; // 負債金額
        }

        return this.currentPrices[asset.symbol] || asset.averageCost;
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
    formatQuantity(quantity, category) {
        switch (category) {
            case 'crypto':
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
                    'AVAX': 'avalanche-2'
                };
                return coinGeckoMap[asset.symbol] || asset.symbol.toLowerCase();
            }).join(',');

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd`
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
                    'AVAX': 'avalanche-2'
                };
                
                const coinId = coinGeckoMap[asset.symbol] || asset.symbol.toLowerCase();
                if (data[coinId]?.usd) {
                    // 轉換為台幣
                    this.currentPrices[asset.symbol] = data[coinId].usd * (this.exchangeRates.USD || 31.5);
                }
            });

        } catch (error) {
            console.error('更新加密貨幣價格失敗：', error);
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
        
        // 總資產價值
        document.getElementById('totalValue').textContent = 
            `$${this.formatNumber(totals.totalAssets)}`;

        // 總變化
        const totalChange = ((totals.totalAssets - totals.totalCost) / totals.totalCost) * 100;
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

        // 更新各類別
        this.updateCategoryCard('crypto', totals.crypto, totals.totalAssets);
        this.updateCategoryCard('taiwanStocks', totals.taiwanStocks, totals.totalAssets);
        this.updateCategoryCard('cash', totals.cash, totals.totalAssets);
        this.updateCategoryCard('forex', totals.forex, totals.totalAssets);
        this.updateCategoryCard('liabilities', totals.liabilities, totals.totalAssets, true);
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

        // 更新權重
        const weight = totalAssets > 0 ? (totals.value / totalAssets) * 100 : 0;
        weightElement.textContent = `${weight.toFixed(1)}%`;
    }

    /**
     * 計算各類別總計
     */
    calculateTotals() {
        const result = {
            totalAssets: 0,
            totalCost: 0,
            crypto: { value: 0, cost: 0, changePercent: 0 },
            taiwanStocks: { value: 0, cost: 0, changePercent: 0 },
            cash: { value: 0, cost: 0, changePercent: 0 },
            forex: { value: 0, cost: 0, changePercent: 0 },
            liabilities: { value: 0, avgRate: 0 }
        };

        // 計算各類別
        Object.keys(this.config.assets).forEach(category => {
            const assets = this.config.assets[category] || [];
            
            assets.forEach(asset => {
                const currentValue = this.calculateAssetValue(asset, category);
                const cost = category === 'liabilities' ? 0 : asset.averageCost * asset.quantity;

                if (category === 'liabilities') {
                    result.liabilities.value += currentValue;
                    if (asset.interestRate) {
                        result.liabilities.avgRate += asset.interestRate * (currentValue / result.liabilities.value || 0);
                    }
                } else {
                    result[category].value += currentValue;
                    result[category].cost += cost;
                    result.totalAssets += currentValue;
                    result.totalCost += cost;
                }
            });

            // 計算變化百分比
            if (category !== 'liabilities' && result[category].cost > 0) {
                result[category].changePercent = 
                    ((result[category].value - result[category].cost) / result[category].cost) * 100;
            }
        });

        return result;
    }

    /**
     * 更新股息收益區塊
     */
    updateDividendSection() {
        const dividendIncome = this.calculateAnnualDividend();
        const interestExpense = this.calculateAnnualInterest();
        const netIncome = dividendIncome - interestExpense;

        document.getElementById('dividendIncome').textContent = 
            `$${this.formatNumber(dividendIncome)} / 年`;
        
        document.getElementById('interestExpense').textContent = 
            `-$${this.formatNumber(interestExpense)} / 年`;
        
        const netElement = document.getElementById('netIncome');
        netElement.textContent = `$${this.formatNumber(netIncome)} / 年`;
        netElement.className = `income-value ${netIncome >= 0 ? '' : 'negative'}`;
    }

    /**
     * 計算年度股息收入
     */
    calculateAnnualDividend() {
        let totalDividend = 0;

        ['crypto', 'taiwanStocks', 'cash', 'forex'].forEach(category => {
            const assets = this.config.assets[category] || [];
            assets.forEach(asset => {
                if (asset.dividendRate && asset.dividendRate > 0) {
                    const currentValue = this.calculateAssetValue(asset, category);
                    totalDividend += currentValue * (asset.dividendRate / 100);
                }
            });
        });

        return totalDividend;
    }

    /**
     * 計算年度利息支出
     */
    calculateAnnualInterest() {
        let totalInterest = 0;

        const liabilities = this.config.assets.liabilities || [];
        liabilities.forEach(liability => {
            if (liability.interestRate && liability.interestRate > 0) {
                totalInterest += liability.amount * (liability.interestRate / 100);
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
            totalValue: totals.totalAssets,
            categories: {
                crypto: totals.crypto.value,
                taiwanStocks: totals.taiwanStocks.value,
                cash: totals.cash.value,
                forex: totals.forex.value
            },
            dividendIncome: this.calculateAnnualDividend(),
            interestExpense: this.calculateAnnualInterest()
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
                averageCost: 1200000,
                purchaseDate: "2023-06-15",
                dividendRate: 0,
                notes: "範例資產",
                platform: "交易所名稱"
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