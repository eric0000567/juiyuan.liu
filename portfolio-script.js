/**
 * 個人資產組合管理系統
 * 功能：資產管理、實時價格獲取、歷史數據記錄、圖表展示
 */

class PortfolioManager {
    constructor() {
        this.assets = [];
        this.priceHistory = [];
        this.charts = {};
        this.apiKey = null; // 可以設置 API Key
        this.lastUpdate = null;
        this.updateInterval = null;
        
        this.init();
    }

    /**
     * 初始化系統
     */
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.initCharts();
        this.startAutoUpdate();
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 新增資產按鈕
        document.getElementById('addAssetBtn').addEventListener('click', () => {
            this.openAddAssetModal();
        });

        // 資產表單提交
        document.getElementById('assetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAssetFormSubmit();
        });

        // 模態框關閉
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAddAssetModal();
            }
        });

        // 圖表控制按鈕
        document.querySelectorAll('.chart-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleChartToggle(e);
            });
        });

        document.querySelectorAll('.time-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleTimeToggle(e);
            });
        });

        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddAssetModal();
            }
        });
    }

    /**
     * 開啟新增資產模態框
     */
    openAddAssetModal() {
        const modal = document.getElementById('addAssetModal');
        modal.classList.add('show');
        
        // 設定今天為預設日期
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
        
        // 聚焦到第一個輸入框
        setTimeout(() => {
            document.getElementById('assetType').focus();
        }, 100);
    }

    /**
     * 關閉新增資產模態框
     */
    closeAddAssetModal() {
        const modal = document.getElementById('addAssetModal');
        modal.classList.remove('show');
        document.getElementById('assetForm').reset();
    }

    /**
     * 處理資產表單提交
     */
    async handleAssetFormSubmit() {
        const formData = {
            type: document.getElementById('assetType').value,
            symbol: document.getElementById('assetSymbol').value.toUpperCase(),
            name: document.getElementById('assetName').value,
            quantity: parseFloat(document.getElementById('quantity').value),
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            purchaseDate: document.getElementById('purchaseDate').value,
            notes: document.getElementById('notes').value,
            id: Date.now().toString(),
            addedAt: new Date().toISOString()
        };

        // 驗證數據
        if (!this.validateAssetData(formData)) {
            return;
        }

        // 顯示載入動畫
        this.showLoading();

        try {
            // 嘗試獲取當前價格
            const currentPrice = await this.fetchCurrentPrice(formData.symbol, formData.type);
            formData.currentPrice = currentPrice;
            formData.lastPriceUpdate = new Date().toISOString();

            // 新增資產
            this.assets.push(formData);
            this.saveData();
            this.updateDisplay();
            this.updateCharts();
            
            // 記錄歷史數據
            this.recordPriceHistory();

            this.closeAddAssetModal();
            this.hideLoading();
            this.showNotification('資產新增成功！', 'success');

        } catch (error) {
            console.error('新增資產時發生錯誤：', error);
            this.hideLoading();
            this.showNotification('獲取價格失敗，請稍後再試', 'error');
        }
    }

    /**
     * 驗證資產數據
     */
    validateAssetData(data) {
        if (!data.type || !data.symbol || !data.name) {
            this.showNotification('請填寫所有必要欄位', 'error');
            return false;
        }

        if (data.quantity <= 0 || data.purchasePrice <= 0) {
            this.showNotification('數量和價格必須大於 0', 'error');
            return false;
        }

        // 檢查是否已存在相同資產
        const exists = this.assets.some(asset => 
            asset.symbol === data.symbol && asset.type === data.type
        );

        if (exists) {
            this.showNotification('此資產已存在，請使用編輯功能修改數量', 'warning');
            return false;
        }

        return true;
    }

    /**
     * 獲取當前價格
     */
    async fetchCurrentPrice(symbol, type) {
        try {
            let price = null;

            switch (type) {
                case 'crypto':
                    price = await this.fetchCryptoPrice(symbol);
                    break;
                case 'stock':
                    price = await this.fetchStockPrice(symbol);
                    break;
                case 'forex':
                    price = await this.fetchForexPrice(symbol);
                    break;
                default:
                    // 對於其他類型，返回購入價格作為預設
                    price = null;
            }

            return price;

        } catch (error) {
            console.error(`獲取 ${symbol} 價格失敗：`, error);
            return null;
        }
    }

    /**
     * 獲取加密貨幣價格
     */
    async fetchCryptoPrice(symbol) {
        try {
            // 使用 CoinGecko 免費 API
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

            const coinId = coinGeckoMap[symbol] || symbol.toLowerCase();
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
            );

            if (!response.ok) throw new Error('API 響應失敗');

            const data = await response.json();
            return data[coinId]?.usd || null;

        } catch (error) {
            console.error('獲取加密貨幣價格失敗：', error);
            return null;
        }
    }

    /**
     * 獲取股票價格（使用免費 API）
     */
    async fetchStockPrice(symbol) {
        try {
            // 使用 Alpha Vantage 免費 API (需要註冊)
            // 或者使用 Yahoo Finance API 替代方案
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
            );

            if (!response.ok) throw new Error('股票 API 響應失敗');

            const data = await response.json();
            const result = data.chart.result[0];
            const price = result.meta.regularMarketPrice;
            
            return price || null;

        } catch (error) {
            console.error('獲取股票價格失敗：', error);
            return null;
        }
    }

    /**
     * 獲取外匯價格
     */
    async fetchForexPrice(symbol) {
        try {
            // 解析外匯對 (例: USD/TWD)
            const [base, quote] = symbol.split('/');
            if (!base || !quote) return null;

            const response = await fetch(
                `https://api.exchangerate-api.com/v4/latest/${base}`
            );

            if (!response.ok) throw new Error('外匯 API 響應失敗');

            const data = await response.json();
            return data.rates[quote] || null;

        } catch (error) {
            console.error('獲取外匯價格失敗：', error);
            return null;
        }
    }

    /**
     * 更新所有資產價格
     */
    async updateAllPrices() {
        if (this.assets.length === 0) return;

        this.showLoading();

        for (const asset of this.assets) {
            try {
                const currentPrice = await this.fetchCurrentPrice(asset.symbol, asset.type);
                if (currentPrice !== null) {
                    asset.currentPrice = currentPrice;
                    asset.lastPriceUpdate = new Date().toISOString();
                }
                
                // 避免 API 限制，添加延遲
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`更新 ${asset.symbol} 價格失敗：`, error);
            }
        }

        this.lastUpdate = new Date().toISOString();
        this.saveData();
        this.updateDisplay();
        this.recordPriceHistory();
        this.updateCharts();
        this.hideLoading();
    }

    /**
     * 記錄價格歷史
     */
    recordPriceHistory() {
        const timestamp = new Date().toISOString();
        const totalValue = this.calculateTotalValue();

        const historyEntry = {
            timestamp,
            totalValue,
            assets: this.assets.map(asset => ({
                symbol: asset.symbol,
                type: asset.type,
                price: asset.currentPrice || asset.purchasePrice,
                quantity: asset.quantity,
                value: (asset.currentPrice || asset.purchasePrice) * asset.quantity
            }))
        };

        this.priceHistory.push(historyEntry);

        // 保留最近 1000 筆記錄
        if (this.priceHistory.length > 1000) {
            this.priceHistory = this.priceHistory.slice(-1000);
        }

        this.saveData();
    }

    /**
     * 計算總資產價值
     */
    calculateTotalValue() {
        return this.assets.reduce((total, asset) => {
            const currentPrice = asset.currentPrice || asset.purchasePrice;
            return total + (currentPrice * asset.quantity);
        }, 0);
    }

    /**
     * 計算總資產變化
     */
    calculateTotalChange() {
        let totalCost = 0;
        let totalValue = 0;

        this.assets.forEach(asset => {
            totalCost += asset.purchasePrice * asset.quantity;
            totalValue += (asset.currentPrice || asset.purchasePrice) * asset.quantity;
        });

        const change = totalValue - totalCost;
        const changePercent = totalCost > 0 ? (change / totalCost) * 100 : 0;

        return { change, changePercent };
    }

    /**
     * 更新顯示
     */
    updateDisplay() {
        this.updateSummaryCards();
        this.updateAssetList();
    }

    /**
     * 更新摘要卡片
     */
    updateSummaryCards() {
        const totalValue = this.calculateTotalValue();
        const { change, changePercent } = this.calculateTotalChange();
        const assetTypes = new Set(this.assets.map(asset => asset.type)).size;

        // 總資產價值
        document.getElementById('totalValue').textContent = 
            `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // 變化指標
        const changeIndicator = document.getElementById('totalChange');
        const changeSign = changePercent >= 0 ? '+' : '';
        changeIndicator.textContent = `${changeSign}${changePercent.toFixed(2)}%`;
        
        changeIndicator.className = 'change-indicator ' + 
            (changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral');

        // 資產項目數量
        document.getElementById('assetCount').textContent = this.assets.length;
        document.getElementById('assetTypes').textContent = `${assetTypes} 種類型`;

        // 最後更新時間
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (this.lastUpdate) {
            const updateTime = new Date(this.lastUpdate);
            lastUpdateEl.textContent = updateTime.toLocaleString('zh-TW');
        }
    }

    /**
     * 更新資產列表
     */
    updateAssetList() {
        const assetList = document.getElementById('assetList');
        const emptyState = document.getElementById('emptyState');

        if (this.assets.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const assetsHTML = this.assets.map(asset => {
            const currentPrice = asset.currentPrice || asset.purchasePrice;
            const totalValue = currentPrice * asset.quantity;
            const change = ((currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100;
            const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';

            return `
                <div class="asset-item">
                    <div class="asset-icon ${asset.type}">
                        ${this.getAssetTypeIcon(asset.type)}
                    </div>
                    <div class="asset-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol} • ${this.getAssetTypeName(asset.type)}</p>
                    </div>
                    <div class="asset-quantity">
                        <span class="label">數量</span>
                        <span class="value">${asset.quantity.toLocaleString()}</span>
                    </div>
                    <div class="asset-price">
                        <span class="label">現價</span>
                        <span class="value">$${currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="asset-value">
                        <span class="label">總值</span>
                        <span class="value">$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span class="change-indicator ${changeClass}">
                            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                        </span>
                    </div>
                    <div class="asset-actions">
                        <button class="btn-icon btn-edit" onclick="portfolioManager.editAsset('${asset.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="portfolioManager.deleteAsset('${asset.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        assetList.innerHTML = assetsHTML;
    }

    /**
     * 獲取資產類型圖標
     */
    getAssetTypeIcon(type) {
        const icons = {
            stock: '📈',
            crypto: '₿',
            forex: '💱',
            commodity: '🥇',
            bond: '📜',
            'real-estate': '🏠',
            other: '💼'
        };
        return icons[type] || '💼';
    }

    /**
     * 獲取資產類型名稱
     */
    getAssetTypeName(type) {
        const names = {
            stock: '股票',
            crypto: '加密貨幣',
            forex: '外匯',
            commodity: '商品',
            bond: '債券',
            'real-estate': '房地產',
            other: '其他'
        };
        return names[type] || '其他';
    }

    /**
     * 刪除資產
     */
    deleteAsset(assetId) {
        if (confirm('確定要刪除此資產嗎？')) {
            this.assets = this.assets.filter(asset => asset.id !== assetId);
            this.saveData();
            this.updateDisplay();
            this.updateCharts();
            this.showNotification('資產已刪除', 'success');
        }
    }

    /**
     * 編輯資產
     */
    editAsset(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        // 填充表單
        document.getElementById('assetType').value = asset.type;
        document.getElementById('assetSymbol').value = asset.symbol;
        document.getElementById('assetName').value = asset.name;
        document.getElementById('quantity').value = asset.quantity;
        document.getElementById('purchasePrice').value = asset.purchasePrice;
        document.getElementById('purchaseDate').value = asset.purchaseDate;
        document.getElementById('notes').value = asset.notes || '';

        this.openAddAssetModal();

        // 修改表單提交處理
        const form = document.getElementById('assetForm');
        const submitHandler = async (e) => {
            e.preventDefault();
            
            asset.type = document.getElementById('assetType').value;
            asset.symbol = document.getElementById('assetSymbol').value;
            asset.name = document.getElementById('assetName').value;
            asset.quantity = parseFloat(document.getElementById('quantity').value);
            asset.purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
            asset.purchaseDate = document.getElementById('purchaseDate').value;
            asset.notes = document.getElementById('notes').value;

            this.saveData();
            this.updateDisplay();
            this.updateCharts();
            this.closeAddAssetModal();
            this.showNotification('資產已更新', 'success');

            form.removeEventListener('submit', submitHandler);
        };

        form.removeEventListener('submit', this.handleAssetFormSubmit);
        form.addEventListener('submit', submitHandler);
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
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#64ffda', '#00bcd4', '#2196f3', '#ff9800',
                        '#4caf50', '#9c27b0', '#f44336', '#795548'
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
                        labels: {
                            color: '#ffffff'
                        }
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
     * 更新圖表
     */
    updateCharts() {
        this.updateAllocationChart();
        this.updatePerformanceChart();
    }

    /**
     * 更新資產配置圖表
     */
    updateAllocationChart() {
        if (!this.charts.allocation) return;

        const assetValues = this.assets.map(asset => ({
            name: asset.name,
            value: (asset.currentPrice || asset.purchasePrice) * asset.quantity
        }));

        this.charts.allocation.data.labels = assetValues.map(a => a.name);
        this.charts.allocation.data.datasets[0].data = assetValues.map(a => a.value);
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
     * 獲取當前時間週期
     */
    getCurrentTimePeriod() {
        const activeButton = document.querySelector('.time-toggle.active');
        return activeButton ? activeButton.dataset.period : '7d';
    }

    /**
     * 根據時間週期過濾歷史數據
     */
    filterHistoryByPeriod(history, period) {
        const now = new Date();
        const periodMap = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000
        };

        const cutoffTime = now.getTime() - periodMap[period];
        return history.filter(entry => 
            new Date(entry.timestamp).getTime() >= cutoffTime
        );
    }

    /**
     * 處理圖表切換
     */
    handleChartToggle(e) {
        const button = e.target;
        const chartType = button.dataset.chart;

        // 更新按鈕狀態
        button.parentElement.querySelectorAll('.chart-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // 更新圖表類型
        if (this.charts.allocation) {
            this.charts.allocation.config.type = chartType;
            this.charts.allocation.update();
        }
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
     * 開始自動更新
     */
    startAutoUpdate() {
        // 每 5 分鐘自動更新一次價格
        this.updateInterval = setInterval(() => {
            this.updateAllPrices();
        }, 5 * 60 * 1000);
    }

    /**
     * 停止自動更新
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * 顯示載入動畫
     */
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    /**
     * 隱藏載入動畫
     */
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // 添加樣式
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

        // 3 秒後自動移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 獲取通知圖標
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * 獲取通知顏色
     */
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
     * 儲存數據到 localStorage
     */
    saveData() {
        const data = {
            assets: this.assets,
            priceHistory: this.priceHistory,
            lastUpdate: this.lastUpdate,
            version: '1.0.0'
        };

        try {
            localStorage.setItem('portfolioData', JSON.stringify(data));
        } catch (error) {
            console.error('儲存數據失敗：', error);
            this.showNotification('資料儲存失敗', 'error');
        }
    }

    /**
     * 從 localStorage 載入數據
     */
    loadData() {
        try {
            const data = localStorage.getItem('portfolioData');
            if (data) {
                const parsed = JSON.parse(data);
                this.assets = parsed.assets || [];
                this.priceHistory = parsed.priceHistory || [];
                this.lastUpdate = parsed.lastUpdate;
            }
        } catch (error) {
            console.error('載入數據失敗：', error);
            this.showNotification('資料載入失敗', 'error');
        }
    }

    /**
     * 匯出數據
     */
    exportData() {
        const data = {
            assets: this.assets,
            priceHistory: this.priceHistory,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('資料匯出成功', 'success');
    }

    /**
     * 匯入數據
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.assets && Array.isArray(data.assets)) {
                    this.assets = data.assets;
                }
                
                if (data.priceHistory && Array.isArray(data.priceHistory)) {
                    this.priceHistory = data.priceHistory;
                }

                this.saveData();
                this.updateDisplay();
                this.updateCharts();
                this.showNotification('資料匯入成功', 'success');

            } catch (error) {
                console.error('匯入數據失敗：', error);
                this.showNotification('資料匯入失敗', 'error');
            }
        };

        reader.readAsText(file);
    }
}

// 初始化資產組合管理器
let portfolioManager;

document.addEventListener('DOMContentLoaded', () => {
    portfolioManager = new PortfolioManager();
    
    // 添加一些動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

// 全域函數（供 HTML 調用）
function openAddAssetModal() {
    portfolioManager.openAddAssetModal();
}

function closeAddAssetModal() {
    portfolioManager.closeAddAssetModal();
} 