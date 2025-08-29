// 用户认证检查
function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'main.html';
        return false;
    }
    return JSON.parse(currentUser);
}

// 显示用户信息
function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const adminBtn = document.getElementById('adminBtn');
    const currentUser = checkAuthentication();
    
    if (currentUser) {
        userInfo.style.display = 'block';
        userName.textContent = `欢迎，${currentUser.name} (${currentUser.username})`;
        
        // 如果是管理员，显示用户管理按钮
        if (currentUser.username === 'admin') {
            adminBtn.style.display = 'inline-block';
        }
    }
}

// 退出登录
window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// 导入依赖
import * as XLSX from 'xlsx';
// 导入数据库模块
import { insertCalculation, getAllHistory, deleteHistory as dbDeleteHistory } from './db.js';

// 全局变量
let calculationHistory = [];
let importedData = [];
let batchProcessing = false;
let batchPaused = false;
let batchStopped = false;
let currentBatchIndex = 0;
let batchStats = {
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0
};

// DOM元素
const elements = {
    origin: document.getElementById('origin'),
    destination: document.getElementById('destination'),
    calculateBtn: document.getElementById('calculateBtn'),
    resultSection: document.getElementById('resultSection'),
    originResult: document.getElementById('originResult'),
    destinationResult: document.getElementById('destinationResult'),
    distanceResult: document.getElementById('distanceResult'),
    timeResult: document.getElementById('timeResult'),
    timestampResult: document.getElementById('timestampResult'),
    copyBtn: document.getElementById('copyBtn'),
    saveBtn: document.getElementById('saveBtn'),
    // 结果面板切换相关元素
    singleResultTab: document.getElementById('singleResultTab'),
    batchResultTab: document.getElementById('batchResultTab'),
    singleResultContent: document.getElementById('singleResultContent'),
    batchResultContent: document.getElementById('batchResultContent'),
    batchResultTableBody: document.getElementById('batchResultTableBody'),
    // 内联结果显示元素
    singleResultDisplay: document.getElementById('singleResultDisplay'),
    originResultInline: document.getElementById('originResultInline'),
    destinationResultInline: document.getElementById('destinationResultInline'),
    distanceResultInline: document.getElementById('distanceResultInline'),
    timeResultInline: document.getElementById('timeResultInline'),
    copyInlineBtn: document.getElementById('copyInlineBtn'),
    saveInlineBtn: document.getElementById('saveInlineBtn'),
    excelFile: document.getElementById('excelFile'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    clearBtn: document.getElementById('clearBtn'),
    dataSection: document.getElementById('dataSection'),
    dataTableBody: document.getElementById('dataTableBody'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    // API选择器
    apiSelector: document.getElementById('apiSelector'),
    // 批量处理相关元素
    downloadTemplateBtn: document.getElementById('downloadTemplateBtn'),
    batchCalculateBtn: document.getElementById('batchCalculateBtn'),
    pauseCalculateBtn: document.getElementById('pauseCalculateBtn'),
    stopCalculateBtn: document.getElementById('stopCalculateBtn'),
    exportSummaryBtn: document.getElementById('exportSummaryBtn'),
    progressContainer: document.getElementById('progressContainer'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    progressFill: document.getElementById('progressFill'),
    successCount: document.getElementById('successCount'),
    failCount: document.getElementById('failCount'),
    totalCount: document.getElementById('totalCount'),
    // 数据汇总元素
    summaryTotal: document.getElementById('summaryTotal'),
    summaryPending: document.getElementById('summaryPending'),
    summaryCompleted: document.getElementById('summaryCompleted'),
    summaryFailed: document.getElementById('summaryFailed'),
    // 车辆配置相关元素
    powerType: document.getElementById('powerType'),
    truckType: document.getElementById('truckType'),
    etc: document.getElementById('etc'),
    axleCount: document.getElementById('axleCount'),
    totalWeight: document.getElementById('totalWeight'),
    ratedLoad: document.getElementById('ratedLoad'),
    truckLength: document.getElementById('truckLength'),
    truckWidth: document.getElementById('truckWidth'),
    truckHeight: document.getElementById('truckHeight'),
    // 车辆配置相关元素
    vehicleConfigBtn: document.getElementById('vehicleConfigToggle'),
    vehicleConfigPanel: document.getElementById('vehicleConfigContent'),
    closeVehicleConfig: document.getElementById('closeVehicleConfig')
};

// 获取车辆配置参数的函数
function getVehicleConfiguration() {
    // 获取下拉框中选中的值
    const powerType = elements.powerType.value;
    const truckType = elements.truckType.value;
    const etc = elements.etc.value;
    const axleCount = elements.axleCount.value;
    // 获取重量和尺寸参数
    const totalWeight = parseFloat(elements.totalWeight.value);
    const ratedLoad = parseFloat(elements.ratedLoad.value);
    const truckLength = parseFloat(elements.truckLength.value);
    const truckWidth = parseFloat(elements.truckWidth.value);
    const truckHeight = parseFloat(elements.truckHeight.value);

    return {
        powerType,
        truckType,
        etc,
        axleCount,
        totalWeight,
        ratedLoad,
        truckLength,
        truckWidth,
        truckHeight
    };
}

// API配置
const API_CONFIG = {
    distanceMatrix: {
        key: 'BVTlkoMx6Vuii9XpttgERo0cOi4AORTo2uos12bUxYqIVaBydj0cSFFhPXLrktyd',
        name: 'DistanceMatrix.ai'
    },
    amap: {
        key: '40f24bd146c6d32b98c581f885281125',
        name: '高德地图'
    }
};

// 当前使用的API
let currentAPI = 'amap'; // 默认使用高德地图

// 初始化应用
async function initApp() {
    await loadHistory();
    bindEvents();
    showAlert(`欢迎使用两地距离计算器！当前使用${API_CONFIG[currentAPI].name}API。`, 'info');
    
    // 初始化完成
    console.log('应用初始化完成');
}

// 切换车辆配置面板
function toggleVehicleConfig() {
    elements.vehicleConfigPanel.classList.toggle('show');
}

// 关闭车辆配置面板
function closeVehicleConfig() {
    elements.vehicleConfigPanel.classList.remove('show');
}

// 绑定事件
function bindEvents() {
    elements.calculateBtn.addEventListener('click', handleCalculate);
    elements.copyBtn.addEventListener('click', copyResult);
    elements.saveBtn.addEventListener('click', saveToHistory);
    elements.importBtn.addEventListener('click', importExcel);
    elements.exportBtn.addEventListener('click', exportExcel);
    elements.clearBtn.addEventListener('click', clearData);
    
    // 显示历史记录按钮
    const showHistoryBtn = document.getElementById('showHistoryBtn');
    if (showHistoryBtn) {
        showHistoryBtn.addEventListener('click', () => {
            elements.historySection.style.display = 'block';
            switchDataTab('history');
        });
    }
    
    // 内联结果按钮事件
    if (elements.copyInlineBtn) {
        elements.copyInlineBtn.addEventListener('click', copyInlineResult);
    }
    if (elements.saveInlineBtn) {
        elements.saveInlineBtn.addEventListener('click', saveInlineToHistory);
    }
    
    // 文件选择事件
    if (elements.excelFile) {
        elements.excelFile.addEventListener('change', handleFileSelect);
    }
    
    // 结果面板切换事件
    if (elements.singleResultTab) {
        elements.singleResultTab.addEventListener('click', () => switchResultTab('single'));
    }
    if (elements.batchResultTab) {
        elements.batchResultTab.addEventListener('click', () => switchResultTab('batch'));
    }
    
    // 数据管理面板切换事件
    const historyTab = document.getElementById('historyTab');
    const dataListTab = document.getElementById('dataListTab');
    if (historyTab) {
        historyTab.addEventListener('click', () => switchDataTab('history'));
    }
    if (dataListTab) {
        dataListTab.addEventListener('click', () => switchDataTab('dataList'));
    }
    
    // 批量处理事件
    if (elements.downloadTemplateBtn) {
        elements.downloadTemplateBtn.addEventListener('click', downloadTemplate);
    }
    if (elements.batchCalculateBtn) {
        elements.batchCalculateBtn.addEventListener('click', startBatchCalculation);
    }
    if (elements.pauseCalculateBtn) {
        elements.pauseCalculateBtn.addEventListener('click', pauseBatchCalculation);
    }
    if (elements.stopCalculateBtn) {
        elements.stopCalculateBtn.addEventListener('click', stopBatchCalculation);
    }
    if (elements.exportSummaryBtn) {
        elements.exportSummaryBtn.addEventListener('click', exportSummaryReport);
    }
    
    // API选择器事件
    if (elements.apiSelector) {
        elements.apiSelector.addEventListener('change', handleAPIChange);
        elements.apiSelector.value = currentAPI; // 设置默认值
    }
    
    // 车辆配置面板事件
    if (elements.vehicleConfigBtn) {
        elements.vehicleConfigBtn.addEventListener('click', toggleVehicleConfig);
    }
    if (elements.closeVehicleConfig) {
        elements.closeVehicleConfig.addEventListener('click', closeVehicleConfig);
    }
    
    // 点击面板外部关闭面板
    document.addEventListener('click', (e) => {
        if (elements.vehicleConfigPanel && 
            !elements.vehicleConfigPanel.contains(e.target) && 
            !elements.vehicleConfigBtn.contains(e.target) &&
            elements.vehicleConfigPanel.classList.contains('show')) {
            closeVehicleConfig();
        }
    });
    
    // 回车键触发计算
    elements.origin.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.destination.focus();
    });
    elements.destination.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCalculate();
    });
}

// 切换结果面板标签
function switchResultTab(tabType) {
    if (tabType === 'single') {
        elements.singleResultTab.classList.add('active');
        elements.batchResultTab.classList.remove('active');
        elements.singleResultContent.style.display = 'block';
        elements.batchResultContent.style.display = 'none';
    } else if (tabType === 'batch') {
        elements.singleResultTab.classList.remove('active');
        elements.batchResultTab.classList.add('active');
        elements.singleResultContent.style.display = 'none';
        elements.batchResultContent.style.display = 'block';
        updateBatchResultTable();
    }
}

// 切换数据管理面板标签
function switchDataTab(tabType) {
    const historyTab = document.getElementById('historyTab');
    const dataListTab = document.getElementById('dataListTab');
    const historyContent = document.getElementById('historyContent');
    const dataListContent = document.getElementById('dataListContent');
    
    if (tabType === 'history') {
        historyTab.classList.add('active');
        dataListTab.classList.remove('active');
        historyContent.style.display = 'block';
        dataListContent.style.display = 'none';
    } else if (tabType === 'dataList') {
        historyTab.classList.remove('active');
        dataListTab.classList.add('active');
        historyContent.style.display = 'none';
        dataListContent.style.display = 'block';
        updateDataListTable();
        // 显示历史记录面板
        elements.historySection.style.display = 'block';
    }
}

// 更新数据列表表格
function updateDataListTable() {
    const dataTableBody = document.getElementById('dataTableBody');
    if (!dataTableBody) return;
    
    dataTableBody.innerHTML = '';
    
    if (importedData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">暂无导入数据</td>';
        dataTableBody.appendChild(row);
        return;
    }
    
    importedData.forEach((item, index) => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(item.status);
        row.className = statusClass;
        
        row.innerHTML = `
            <td>${item.origin}</td>
            <td>${item.destination}</td>
            <td>${item.distance || '-'}</td>
            <td>${item.duration || '-'}</td>
            <td>${item.timestamp || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="calculateSingle(${index})">
                    ${item.status === '待计算' ? '🚀 计算' : '🔄 重新计算'}
                </button>
            </td>
        `;
        dataTableBody.appendChild(row);
    });
}


// 更新批量结果表格
function updateBatchResultTable() {
    if (!elements.batchResultTableBody) return;
    
    elements.batchResultTableBody.innerHTML = '';
    
    if (importedData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="no-data">暂无批量处理数据</td>';
        elements.batchResultTableBody.appendChild(row);
        return;
    }
    
    importedData.forEach((item, index) => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(item.status);
        row.className = statusClass;
        
        row.innerHTML = `
            <td>${item.origin}</td>
            <td>${item.destination}</td>
            <td>${item.distance || '-'}</td>
            <td>${item.duration || '-'}</td>
            <td><span class="status-badge ${getStatusBadgeClass(item.status)}">${item.status}</span></td>
        `;
        elements.batchResultTableBody.appendChild(row);
    });
}

// 获取状态对应的行样式类
function getStatusClass(status) {
    switch (status) {
        case '待计算': return 'table-row-pending';
        case '计算中...': return 'table-row-calculating';
        case '已完成': return 'table-row-completed';
        case '计算失败': return 'table-row-failed';
        default: return '';
    }
}

// 获取状态徽章样式类
function getStatusBadgeClass(status) {
    switch (status) {
        case '待计算': return 'status-pending';
        case '计算中...': return 'status-calculating';
        case '已完成': return 'status-completed';
        case '计算失败': return 'status-failed';
        default: return 'status-pending';
    }
}

// 下载Excel模板
function downloadTemplate() {
    // 创建模板数据
    const templateData = [
        ['起点', '终点', '备注'],
        ['北京市', '上海市', '这是示例数据，请删除此行后添加您的数据']
    ];

    // 创建工作簿
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    
    // 设置列宽
    worksheet['!cols'] = [
        { width: 20 },
        { width: 20 },
        { width: 40 }
    ];
    
    // 设置表头样式
    worksheet['A1'].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "667eea" } },
        alignment: { horizontal: "center" }
    };
    worksheet['B1'].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "667eea" } },
        alignment: { horizontal: "center" }
    };
    worksheet['C1'].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "667eea" } },
        alignment: { horizontal: "center" }
    };
    
    // 设置示例数据行为红色
    worksheet['A2'].s = {
        font: { color: { rgb: "FF0000" } },
        fill: { fgColor: { rgb: "FFE6E6" } }
    };
    worksheet['B2'].s = {
        font: { color: { rgb: "FF0000" } },
        fill: { fgColor: { rgb: "FFE6E6" } }
    };
    worksheet['C2'].s = {
        font: { color: { rgb: "FF0000" } },
        fill: { fgColor: { rgb: "FFE6E6" } }
    };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '距离计算模板');

    // 导出文件
    const fileName = `距离计算模板_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showAlert('Excel模板下载成功！红色示例行请删除后添加您的数据。', 'success');
}

// 开始批量计算
async function startBatchCalculation() {
    if (importedData.length === 0) {
        showAlert('请先导入Excel数据！', 'error');
        return;
    }

    // 检查是否有待计算的数据
    const pendingItems = importedData.filter(item => item.status === '待计算' || item.status === '计算失败');
    if (pendingItems.length === 0) {
        showAlert('没有需要计算的数据！', 'info');
        return;
    }

    batchProcessing = true;
    batchPaused = false;
    batchStopped = false;
    currentBatchIndex = 0;

    // 更新UI状态
    elements.batchCalculateBtn.style.display = 'none';
    elements.pauseCalculateBtn.style.display = 'inline-block';
    elements.stopCalculateBtn.style.display = 'inline-block';
    elements.progressContainer.style.display = 'block';

    // 初始化统计
    updateBatchStats();
    
    showAlert('开始批量计算...', 'info');
    
    // 开始处理
    await processBatchCalculation();
}

// 暂停批量计算
function pauseBatchCalculation() {
    batchPaused = !batchPaused;
    
    if (batchPaused) {
        elements.pauseCalculateBtn.innerHTML = '▶️ 继续计算';
        elements.pauseCalculateBtn.className = 'btn btn-success';
        showAlert('批量计算已暂停', 'info');
    } else {
        elements.pauseCalculateBtn.innerHTML = '⏸️ 暂停计算';
        elements.pauseCalculateBtn.className = 'btn btn-warning';
        showAlert('继续批量计算...', 'info');
        processBatchCalculation(); // 继续处理
    }
}

// 停止批量计算
function stopBatchCalculation() {
    batchStopped = true;
    batchProcessing = false;
    
    // 恢复UI状态
    elements.batchCalculateBtn.style.display = 'inline-block';
    elements.pauseCalculateBtn.style.display = 'none';
    elements.stopCalculateBtn.style.display = 'none';
    elements.pauseCalculateBtn.innerHTML = '⏸️ 暂停计算';
    elements.pauseCalculateBtn.className = 'btn btn-warning';
    
    showAlert('批量计算已停止', 'warning');
    updateBatchStats();
}

// 处理批量计算 - 增强版本（降低失败率，添加自动重试）
async function processBatchCalculation() {
    // 配置参数
    const MAX_PARALLEL = 3;           // 最大并行处理数量（降低以减少失败率）
    const REQUEST_DELAY = 300;        // 请求间隔延迟(毫秒)（增加以减少API限制）
    const MAX_RETRIES = 3;            // 最大重试次数
    const RETRY_DELAY = 1000;         // 重试间隔(毫秒)
    
    // 重试函数
    async function calculateWithRetry(item, origin, destination, vehicleConfig = null, retries = 0) {
        try {
            // 使用当前选择的API进行计算，传递车辆配置参数
            let result;
            if (currentAPI === 'amap') {
                result = await calculateDistanceWithAmap(origin, destination, vehicleConfig);
            } else {
                result = await calculateDistanceWithDistanceMatrix(origin, destination, vehicleConfig);
            }
            
            return result;
        } catch (error) {
            // 如果还有重试次数，则等待后重试
            if (retries < MAX_RETRIES) {
                console.log(`第 ${retries + 1} 次重试计算: ${origin} 到 ${destination}`);
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                // 尝试切换API进行重试
                if (retries >= 1) {
                    // 第二次重试时尝试切换API
                    currentAPI = currentAPI === 'amap' ? 'distanceMatrix' : 'amap';
                    console.log(`切换到备用API: ${API_CONFIG[currentAPI].name}`);
                }
                return calculateWithRetry(item, origin, destination, vehicleConfig, retries + 1);
            }
            
            // 重试次数用完，抛出错误
            throw error;
        }
    }
    
    while (batchProcessing && !batchStopped) {
        if (batchPaused) {
            return; // 暂停时退出循环
        }
        
        // 获取待处理的项目
        const pendingItems = [];
        for (let i = currentBatchIndex; i < importedData.length && pendingItems.length < MAX_PARALLEL; i++) {
            const item = importedData[i];
            if (item.status === '待计算' || item.status === '计算失败') {
                pendingItems.push({item, index: i});
                item.status = '计算中...';
                item.retryCount = 0; // 初始化重试计数
            }
        }
        
        // 如果没有待处理项目，说明已完成
        if (pendingItems.length === 0) {
            break;
        }
        
        // 更新UI
        updateDataTable();
        updateProgress();
        
        // 并行处理多个请求
        const promises = pendingItems.map(({item, index}, i) => {
            // 添加错开延迟，避免同时发送大量请求
            return new Promise(resolve => setTimeout(resolve, i * REQUEST_DELAY))
                .then(() => {
                    return calculateWithRetry(item, item.origin, item.destination, getVehicleConfiguration());
                })
                .then(result => {
                    // 处理成功结果
                    item.distance = `${result.distance} 公里`;
                    item.duration = `${result.duration} 分钟`;
                    item.timestamp = result.timestamp;
                    item.status = '已完成';
                    batchStats.completed++;
                    batchStats.pending--;
                    return {success: true, index};
                })
                .catch(error => {
                    // 处理错误
                    item.status = '计算失败';
                    item.error = error.message;
                    batchStats.failed++;
                    batchStats.pending--;
                    console.error(`第 ${index + 1} 条数据计算失败(已重试${MAX_RETRIES}次):`, error);
                    return {success: false, index};
                });
        });
        
        // 等待所有请求完成
        await Promise.all(promises);
        
        // 更新当前处理索引
        if (pendingItems.length > 0) {
            currentBatchIndex = Math.max(...pendingItems.map(({index}) => index)) + 1;
        }
        
        // 更新UI
        updateDataTable();
        updateProgress();
    }

    // 批量计算完成后，检查是否有失败项，如果有则提示可以重试
    if (batchProcessing && !batchStopped) {
        batchProcessing = false;
        
        // 恢复UI状态
        elements.batchCalculateBtn.style.display = 'inline-block';
        elements.pauseCalculateBtn.style.display = 'none';
        elements.stopCalculateBtn.style.display = 'none';
        elements.pauseCalculateBtn.innerHTML = '⏸️ 暂停计算';
        elements.pauseCalculateBtn.className = 'btn btn-warning';
        
        const completedCount = batchStats.completed;
        const failedCount = batchStats.failed;
        
        if (failedCount > 0) {
            showAlert(`批量计算完成！成功: ${completedCount} 条，失败: ${failedCount} 条。可点击"开始批量计算"重试失败项。`, 'warning');
        } else {
            showAlert(`批量计算完成！全部 ${completedCount} 条数据计算成功！`, 'success');
        }
    }
}

// 更新进度显示
function updateProgress() {
    const total = batchStats.total;
    const processed = batchStats.completed + batchStats.failed;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    if (elements.progressText) {
        elements.progressText.textContent = `正在处理第 ${currentBatchIndex + 1} / ${total} 条数据`;
    }
    if (elements.progressPercent) {
        elements.progressPercent.textContent = `${percentage}%`;
    }
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percentage}%`;
    }
    if (elements.successCount) {
        elements.successCount.textContent = batchStats.completed;
    }
    if (elements.failCount) {
        elements.failCount.textContent = batchStats.failed;
    }
    if (elements.totalCount) {
        elements.totalCount.textContent = total;
    }
}

// 更新批量统计
function updateBatchStats() {
    batchStats.total = importedData.length;
    batchStats.completed = importedData.filter(item => item.status === '已完成').length;
    batchStats.failed = importedData.filter(item => item.status === '计算失败').length;
    batchStats.pending = importedData.filter(item => item.status === '待计算' || item.status === '计算中...').length;

    // 更新汇总显示
    if (elements.summaryTotal) elements.summaryTotal.textContent = batchStats.total;
    if (elements.summaryCompleted) elements.summaryCompleted.textContent = batchStats.completed;
    if (elements.summaryFailed) elements.summaryFailed.textContent = batchStats.failed;
    if (elements.summaryPending) elements.summaryPending.textContent = batchStats.pending;

    updateProgress();
}

// 导出汇总报告
function exportSummaryReport() {
    if (importedData.length === 0) {
        showAlert('没有数据可导出！', 'error');
        return;
    }

    // 只导出已完成的数据，过滤掉脏数据
    const completedData = importedData.filter(item => item.status === '已完成');
    
    if (completedData.length === 0) {
        showAlert('没有已完成的数据可导出！', 'warning');
        return;
    }

    // 准备汇总数据
    const summaryData = [
        ['距离计算汇总报告'],
        ['生成时间', new Date().toLocaleString('zh-CN')],
        ['使用API', API_CONFIG[currentAPI].name],
        [''],
        ['统计信息'],
        ['总计', batchStats.total],
        ['已完成', batchStats.completed],
        ['计算失败', batchStats.failed],
        ['待计算', batchStats.pending],
        [''],
        ['已完成数据详情'],
        ['序号', '起点', '终点', '距离', '时间', '计算时间']
    ];

    // 只添加已完成的数据，清理格式
    completedData.forEach((item, index) => {
        // 清理距离和时间数据，去掉单位
        const cleanDistance = item.distance ? item.distance.replace(' 公里', '') : '';
        const cleanDuration = item.duration ? item.duration.replace(' 分钟', '') : '';
        
        summaryData.push([
            index + 1,
            item.origin,
            item.destination,
            cleanDistance,
            cleanDuration,
            item.timestamp || ''
        ]);
    });

    // 创建工作簿
    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    
    // 设置列宽
    worksheet['!cols'] = [
        { width: 8 },   // 序号
        { width: 25 },  // 起点
        { width: 25 },  // 终点
        { width: 12 },  // 距离
        { width: 12 },  // 时间
        { width: 20 }   // 计算时间
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '汇总报告');

    // 导出文件
    const fileName = `距离计算汇总报告_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showAlert(`汇总报告导出成功！包含${completedData.length}条已完成数据`, 'success');
}

// 处理API切换
function handleAPIChange() {
    currentAPI = elements.apiSelector.value;
    showAlert(`已切换到${API_CONFIG[currentAPI].name}API`, 'info');
    console.log(`API切换到: ${API_CONFIG[currentAPI].name}`);
}

// 处理计算请求
async function handleCalculate() {
    const origin = elements.origin.value.trim();
    const destination = elements.destination.value.trim();

    if (!origin || !destination) {
        showAlert('请填写起点和终点！', 'error');
        return;
    }

    try {
        elements.calculateBtn.disabled = true;
        elements.calculateBtn.innerHTML = '<span class="loading"></span> 计算中...';
        
        let result;
        if (currentAPI === 'amap') {
            result = await calculateDistanceWithAmap(origin, destination, getVehicleConfiguration());
        } else {
            result = await calculateDistanceWithDistanceMatrix(origin, destination, getVehicleConfiguration());
        }
        
        displayResult(result);
        showAlert(`计算完成！使用${API_CONFIG[currentAPI].name}`, 'success');
    } catch (error) {
        console.error('计算错误:', error);
        // 如果当前API失败，尝试切换到备用API
        try {
            showAlert(`${API_CONFIG[currentAPI].name}计算失败，尝试使用备用API...`, 'info');
            const backupAPI = currentAPI === 'amap' ? 'distanceMatrix' : 'amap';
            let result;
            if (backupAPI === 'amap') {
                result = await calculateDistanceWithAmap(origin, destination, getVehicleConfiguration());
            } else {
                result = await calculateDistanceWithDistanceMatrix(origin, destination, getVehicleConfiguration());
            }
            displayResult(result);
            showAlert(`计算完成！使用备用${API_CONFIG[backupAPI].name}`, 'success');
        } catch (backupError) {
            showAlert(`计算失败: ${error.message}`, 'error');
        }
    } finally {
        elements.calculateBtn.disabled = false;
        elements.calculateBtn.innerHTML = '🚀 计算距离';
    }
}

// 高德地图API计算距离
async function calculateDistanceWithAmap(origin, destination, vehicleConfig = null) {
    const apiKey = API_CONFIG.amap.key;
    
    try {
        // 第一步：地理编码，获取起点和终点的坐标
        const originCoords = await geocodeWithAmap(origin, apiKey);
        const destCoords = await geocodeWithAmap(destination, apiKey);
        
        // 第二步：路径规划，计算距离和时间
        const routeResult = await calculateRouteWithAmap(originCoords, destCoords, apiKey, vehicleConfig);
        
        return {
            origin: originCoords.formatted_address || origin,
            destination: destCoords.formatted_address || destination,
            distance: routeResult.distance,
            duration: routeResult.duration,
            timestamp: new Date().toLocaleString('zh-CN')
        };
    } catch (error) {
        throw new Error(`高德地图API错误: ${error.message}`);
    }
}

// 高德地图地理编码
async function geocodeWithAmap(address, apiKey) {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1') {
        throw new Error(`地址解析失败: ${data.info}`);
    }
    
    if (!data.geocodes || data.geocodes.length === 0) {
        throw new Error(`无法找到地址: ${address}`);
    }
    
    const geocode = data.geocodes[0];
    return {
        location: geocode.location,
        formatted_address: geocode.formatted_address
    };
}

// 高德地图路径规划
async function calculateRouteWithAmap(originCoords, destCoords, apiKey, vehicleConfig = null) {
    // 使用传入的车辆配置参数，如果没有传入则获取默认配置
    if (!vehicleConfig) {
        vehicleConfig = getVehicleConfiguration();
    }
    
    // 根据车辆类型选择路径规划策略
    let strategy = '0'; // 默认：速度优先
    
    // 货车专用路线策略
    if (vehicleConfig.truckType === 'heavy') {
        strategy = '2'; // 货车路线（避开限行、限高、限重路段）
    } else if (vehicleConfig.truckType === 'medium') {
        strategy = '3'; // 不走高速（适合中型货车）
    } else if (vehicleConfig.truckType === 'light') {
        strategy = '4'; // 多策略（速度优先+避免收费）
    }
    
    // 调试信息：输出车辆配置和策略选择
    console.log('🚚 高德地图API - 车辆配置参数:', vehicleConfig);
    
    // 详细的策略描述
    const strategyDescriptions = {
        '0': '速度优先',
        '2': '货车路线（避开限行、限高、限重路段）',
        '3': '不走高速（适合中型货车）',
        '4': '多策略（速度优先+避免收费）'
    };
    console.log('🛣️ 高德地图API - 选择策略:', strategy, `(${strategyDescriptions[strategy]})`);
    console.log('📍 高德地图API - 请求URL:', `origin=${originCoords.location}&destination=${destCoords.location}&strategy=${strategy}`);
    
    // 构建高德地图API请求URL
    let url = `https://restapi.amap.com/v3/direction/driving?key=${apiKey}&origin=${originCoords.location}&destination=${destCoords.location}&strategy=${strategy}&extensions=base`;
    
    // 添加货车专用参数（仅对货车类型生效）
    if (vehicleConfig.truckType !== 'micro') {
        // 高德地图API货车专用参数
        url += `&cartype=2`; // 2表示货车
        url += `&carweight=${vehicleConfig.totalWeight * 1000}`; // 转换为公斤
        url += `&carheight=${vehicleConfig.truckHeight * 100}`; // 转换为厘米
        url += `&carwidth=${vehicleConfig.truckWidth * 100}`; // 转换为厘米
        url += `&carlength=${vehicleConfig.truckLength * 100}`; // 转换为厘米
        url += `&axlenum=${vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount)}`;
        
        // 调试信息：输出货车参数
        console.log('🚛 高德地图API - 货车专用参数:', {
            cartype: '货车',
            carweight: `${vehicleConfig.totalWeight * 1000}公斤`,
            carheight: `${vehicleConfig.truckHeight * 100}厘米`,
            carwidth: `${vehicleConfig.truckWidth * 100}厘米`,
            carlength: `${vehicleConfig.truckLength * 100}厘米`,
            axlenum: `${vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount)}轴`
        });
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    // 调试信息：输出完整的API响应
    console.log('📊 高德地图API - 完整响应:', data);
    
    if (data.status !== '1') {
        throw new Error(`路径规划失败: ${data.info}`);
    }
    
    if (!data.route || !data.route.paths || data.route.paths.length === 0) {
        throw new Error('无法找到可行路线');
    }
    
    const path = data.route.paths[0];
    const distance = (parseInt(path.distance) / 1000).toFixed(2); // 转换为公里
    const duration = Math.round(parseInt(path.duration) / 60); // 转换为分钟
    
    // 调试信息：输出路线详情
    console.log('🛣️ 高德地图API - 路线详情:', {
        distance: `${distance}公里`,
        duration: `${duration}分钟`,
        strategy: path.strategy,
        tolls: path.tolls ? `${path.tolls}元` : '无收费',
        steps: path.steps ? path.steps.length : 0
    });
    
    return {
        distance,
        duration
    };
}

// DistanceMatrix.ai API计算距离（备用）
async function calculateDistanceWithDistanceMatrix(origin, destination, vehicleConfig = null) {
    const apiKey = API_CONFIG.distanceMatrix.key;
    const baseUrl = 'https://api.distancematrix.ai/maps/api/distancematrix/json';
    
    // 使用传入的车辆配置参数，如果没有传入则获取默认配置
    if (!vehicleConfig) {
        vehicleConfig = getVehicleConfiguration();
    }
    
    // 构建查询参数
    const params = new URLSearchParams({
        origins: origin,
        destinations: destination,
        key: apiKey
    });
    
    // 货车专用参数（仅对货车类型生效）
    if (vehicleConfig.truckType !== 'micro') {
        params.append('vehicleType', vehicleConfig.truckType === 'heavy' ? 'truck' : 'car');
        params.append('weight', vehicleConfig.totalWeight);
        params.append('height', vehicleConfig.truckHeight);
        params.append('width', vehicleConfig.truckWidth);
        params.append('length', vehicleConfig.truckLength);
        params.append('axles', vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount));
    }

    // 调试信息：输出车辆配置和API参数
    console.log('🚚 DistanceMatrix API - 车辆配置参数:', vehicleConfig);
    
    // 根据车辆类型显示不同的参数信息
    if (vehicleConfig.truckType !== 'micro') {
        console.log('🔧 DistanceMatrix API - 货车参数:', {
            vehicleType: vehicleConfig.truckType === 'heavy' ? 'truck' : 'car',
            weight: vehicleConfig.totalWeight + '吨',
            height: vehicleConfig.truckHeight + '米',
            width: vehicleConfig.truckWidth + '米', 
            length: vehicleConfig.truckLength + '米',
            axles: (vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount)) + '轴'
        });
    } else {
        console.log('🔧 DistanceMatrix API - 微型车，使用默认参数');
    }
    console.log('📡 DistanceMatrix API - 请求URL:', `${baseUrl}?${params}`);

    const response = await fetch(`${baseUrl}?${params}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
        throw new Error(data.error_message || 'API请求失败');
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
        let errorMessage = `无法计算距离: ${element.status}`;
        if (element.status === 'ZERO_RESULTS') {
            errorMessage = '无法找到路线';
        } else if (element.status === 'NOT_FOUND') {
            errorMessage = '地址无法识别';
        }
        throw new Error(errorMessage);
    }

    const distance = (element.distance.value / 1000).toFixed(2);
    const duration = Math.round(element.duration.value / 60);
    
    return {
        origin: data.origin_addresses[0],
        destination: data.destination_addresses[0],
        distance,
        duration,
        timestamp: new Date().toLocaleString('zh-CN')
    };
}

// 显示计算结果
function displayResult(result) {
    const vehicleConfig = getVehicleConfiguration();
    const vehicleTypeNames = {
        'micro': '微型',
        'light': '轻型',
        'medium': '中型', 
        'heavy': '重型'
    };
    
    // 更新右侧面板的结果
    elements.originResult.textContent = result.origin;
    elements.destinationResult.textContent = result.destination;
    elements.distanceResult.textContent = `${result.distance} 公里`;
    elements.timeResult.textContent = `${result.duration} 分钟`;
    elements.timestampResult.textContent = result.timestamp;
    
    // 添加车辆类型信息到结果中
    if (vehicleConfig.truckType !== 'micro') {
        elements.distanceResult.textContent += ` (${vehicleTypeNames[vehicleConfig.truckType]}货车)`;
        elements.timeResult.textContent += ` (${vehicleTypeNames[vehicleConfig.truckType]}货车)`;
    }
    
    // 更新计算模块底部的内联结果
    elements.originResultInline.textContent = result.origin;
    elements.destinationResultInline.textContent = result.destination;
    elements.distanceResultInline.textContent = `${result.distance} 公里`;
    elements.timeResultInline.textContent = `${result.duration} 分钟`;
    
    // 添加车辆类型信息到内联结果中
    if (vehicleConfig.truckType !== 'micro') {
        elements.distanceResultInline.textContent += ` (${vehicleTypeNames[vehicleConfig.truckType]}货车)`;
        elements.timeResultInline.textContent += ` (${vehicleTypeNames[vehicleConfig.truckType]}货车)`;
    }
    
    // 显示内联结果
    elements.singleResultDisplay.style.display = 'block';
    
    // 确保结果面板可见，并切换到单次计算标签
    elements.resultSection.style.display = 'block';
    switchResultTab('single');
    
    // 滚动到内联结果显示位置
    elements.singleResultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 复制结果
async function copyResult() {
    const vehicleConfig = getVehicleConfiguration();
    const vehicleTypeNames = {
        'micro': '微型',
        'light': '轻型',
        'medium': '中型', 
        'heavy': '重型'
    };
    
    let vehicleInfo = '';
    if (vehicleConfig.truckType !== 'micro') {
        vehicleInfo = `\n车辆类型: ${vehicleTypeNames[vehicleConfig.truckType]}货车`;
    }
    
    const resultText = `起点: ${elements.originResult.textContent}
终点: ${elements.destinationResult.textContent}
距离: ${elements.distanceResult.textContent}
时间: ${elements.timeResult.textContent}
计算时间: ${elements.timestampResult.textContent}${vehicleInfo}`;

    try {
        await navigator.clipboard.writeText(resultText);
        showAlert('结果已复制到剪贴板！', 'success');
    } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = resultText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('结果已复制到剪贴板！', 'success');
    }
}

// 保存到历史记录
async function saveToHistory() {
    const origin = elements.originResult.textContent;
    const destination = elements.destinationResult.textContent;
    const distanceText = elements.distanceResult.textContent;
    const durationText = elements.timeResult.textContent;
    const timestamp = elements.timestampResult.textContent;

    // 提取数字值
    const distance = parseFloat(distanceText);
    const duration = parseInt(durationText);

    // 获取车辆配置参数
    const vehicleConfig = getVehicleConfiguration();

    try {
        // 保存到用户数据
        const result = {
            origin,
            destination,
            distance: distanceText,
            duration: durationText,
            timestamp
        };

        await saveUserCalculation(result);
        
        // 更新历史显示
        calculationHistory = getUserCalculations();
        updateHistoryDisplay();
        showAlert('已保存到历史记录！', 'success');
    } catch (error) {
        console.error('保存历史记录失败:', error);
        showAlert('保存历史记录失败: ' + error.message, 'error');
    }
}

// 导入Excel文件
function importExcel() {
    const file = elements.excelFile.files[0];
    if (!file) {
        showAlert('请先选择Excel文件！', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 处理数据
            importedData = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row[0] && row[1]) { // 确保起点和终点都有值
                    importedData.push({
                        origin: row[0],
                        destination: row[1],
                        distance: '',
                        duration: '',
                        timestamp: '',
                        status: '待计算'
                    });
                }
            }

            // 更新数据但不显示数据表格，保持当前布局
            updateBatchResultTable();
            updateBatchStats();
            
            // 导入数据后自动切换到批量处理结果面板和数据列表
            if (importedData.length > 0) {
                switchResultTab('batch');
                // 确保结果面板可见
                elements.resultSection.style.display = 'block';
                // 显示历史记录面板并切换到数据列表标签
                elements.historySection.style.display = 'block';
                switchDataTab('dataList');
            }
            showAlert(`成功导入 ${importedData.length} 条数据！数据列表已显示在右侧面板`, 'success');
        } catch (error) {
            console.error('Excel解析错误:', error);
            showAlert('Excel文件解析失败！', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 更新数据表格
function updateDataTable() {
    // 更新批量结果面板
    updateBatchResultTable();
    updateBatchStats();
    
    // 更新数据列表表格
    updateDataListTable();
}

// 计算单条数据
async function calculateSingle(index) {
    const item = importedData[index];

    try {
        item.status = '计算中...';
        updateDataTable();

        let result;
        if (currentAPI === 'amap') {
            result = await calculateDistanceWithAmap(item.origin, item.destination, getVehicleConfiguration());
        } else {
            result = await calculateDistanceWithDistanceMatrix(item.origin, item.destination, getVehicleConfiguration());
        }
        
        item.distance = `${result.distance} 公里`;
        item.duration = `${result.duration} 分钟`;
        item.timestamp = result.timestamp;
        item.status = '已完成';

        updateDataTable();
        showAlert(`第 ${index + 1} 条数据计算完成！使用${API_CONFIG[currentAPI].name}`, 'success');
    } catch (error) {
        item.status = '计算失败';
        updateDataTable();
        showAlert(`第 ${index + 1} 条数据计算失败: ${error.message}`, 'error');
    }
}

// 导出Excel
function exportExcel() {
    if (importedData.length === 0) {
        showAlert('没有数据可导出！', 'error');
        return;
    }

    // 准备导出数据
    const exportData = [
        ['起点', '终点', '距离(公里)', '时间(分钟)', '计算时间', '状态']
    ];

    importedData.forEach(item => {
        exportData.push([
            item.origin,
            item.destination,
            item.distance || '',
            item.duration || '',
            item.timestamp || '',
            item.status
        ]);
    });

    // 创建工作簿
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '距离计算结果');

    // 导出文件
    const fileName = `距离计算结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showAlert('Excel文件导出成功！', 'success');
}

// 清空数据
function clearData() {
    if (confirm('确定要清空所有导入的数据吗？')) {
        importedData = [];
        updateDataTable();
        showAlert('数据已清空！', 'info');
    }
}

// 更新历史记录显示
function updateHistoryDisplay() {
    if (calculationHistory.length === 0) {
        elements.historySection.style.display = 'none';
        return;
    }

    elements.historySection.style.display = 'block';
    elements.historyList.innerHTML = '';

    calculationHistory.forEach((item) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-time">${item.timestamp}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteHistory('${item.id}')">🗑️</button>
            </div>
            <div class="history-details">
                <div class="history-detail">
                    <span class="label">起点:</span>
                    <span class="value">${item.origin}</span>
                </div>
                <div class="history-detail">
                    <span class="label">终点:</span>
                    <span class="value">${item.destination}</span>
                </div>
                <div class="history-detail">
                    <span class="label">距离:</span>
                    <span class="value">${item.distance}</span>
                </div>
                <div class="history-detail">
                    <span class="label">时间:</span>
                    <span class="value">${item.duration}</span>
                </div>
            </div>
        `;
        elements.historyList.appendChild(historyItem);
    });
}

// 删除历史记录
async function deleteHistory(id) {
    if (confirm('确定要删除这条历史记录吗？')) {
        try {
            deleteUserCalculation(id);
            calculationHistory = calculationHistory.filter(item => item.id !== id);
            updateHistoryDisplay();
            showAlert('历史记录已删除！', 'success');
        } catch (error) {
            console.error('删除历史记录失败:', error);
            showAlert('删除历史记录失败: ' + error.message, 'error');
        }
    }
}

// 保存历史记录到数据库
function saveHistory() {
    // 由于我们已经在saveToHistory中直接保存到数据库，这里不需要额外操作
    // 保持此函数是为了兼容性
}

// 从数据库加载历史记录
async function loadHistory() {
    try {
        calculationHistory = getUserCalculations();
        updateHistoryDisplay();
    } catch (error) {
        console.error('加载历史记录失败:', error);
        showAlert('加载历史记录失败，请刷新页面重试', 'error');
    }
}

// 注意：此函数已被上面的新实现替换
// 此处为了避免重复定义，留空
function oldLoadHistory() {
    // 已废弃，使用新的异步loadHistory函数
}

// 显示提示信息
function showAlert(message, type = 'info') {
    // 移除现有的提示
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // 插入到页面顶部
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    // 自动移除提示
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    const selectedFileInfo = document.getElementById('selectedFileInfo');
    const selectedFileName = document.getElementById('selectedFileName');
    
    if (file) {
        selectedFileName.textContent = file.name;
        selectedFileInfo.style.display = 'flex';
        showAlert(`已选择文件: ${file.name}`, 'info');
    } else {
        selectedFileInfo.style.display = 'none';
    }
}

// 清除选中的文件
function clearSelectedFile() {
    const excelFile = document.getElementById('excelFile');
    const selectedFileInfo = document.getElementById('selectedFileInfo');
    
    excelFile.value = '';
    selectedFileInfo.style.display = 'none';
    showAlert('已清除选中的文件', 'info');
}

// 复制内联结果
async function copyInlineResult() {
    const resultText = `起点: ${elements.originResultInline.textContent}
终点: ${elements.destinationResultInline.textContent}
距离: ${elements.distanceResultInline.textContent}
时间: ${elements.timeResultInline.textContent}`;

    try {
        await navigator.clipboard.writeText(resultText);
        showAlert('结果已复制到剪贴板！', 'success');
    } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = resultText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('结果已复制到剪贴板！', 'success');
    }
}

// 保存内联结果到历史记录
async function saveInlineToHistory() {
    const origin = elements.originResultInline.textContent;
    const destination = elements.destinationResultInline.textContent;
    const distanceText = elements.distanceResultInline.textContent;
    const durationText = elements.timeResultInline.textContent;
    const timestamp = new Date().toLocaleString('zh-CN');

    // 提取数字值
    const distance = parseFloat(distanceText);
    const duration = parseInt(durationText);

    // 获取车辆配置参数
    const vehicleConfig = getVehicleConfiguration();

    try {
        // 保存到用户数据
        const result = {
            origin,
            destination,
            distance: distanceText,
            duration: durationText,
            timestamp
        };

        await saveUserCalculation(result);
        
        // 更新历史显示
        calculationHistory = getUserCalculations();
        updateHistoryDisplay();
        showAlert('已保存到历史记录！', 'success');
    } catch (error) {
        console.error('保存历史记录失败:', error);
        showAlert('保存失败，请重试', 'error');
    }
}

// 将全局函数暴露到window对象
window.calculateSingle = calculateSingle;
window.deleteHistory = deleteHistory;
window.clearSelectedFile = clearSelectedFile;
window.copyInlineResult = copyInlineResult;
window.saveInlineToHistory = saveInlineToHistory;

// 用户数据管理函数
function getUserDataKey(username) {
    return `user_data_${username}`;
}

// 保存用户计算数据
async function saveUserCalculation(data) {
    const currentUser = checkAuthentication();
    if (!currentUser) return null;

    const userDataKey = getUserDataKey(currentUser.username);
    let userData = JSON.parse(localStorage.getItem(userDataKey)) || { calculations: [] };
    
    const calculation = {
        id: Date.now().toString(),
        ...data,
        timestamp: new Date().toISOString(),
        username: currentUser.username
    };
    
    userData.calculations.unshift(calculation);
    localStorage.setItem(userDataKey, JSON.stringify(userData));
    
    return calculation.id;
}

// 获取用户计算历史
function getUserCalculations() {
    const currentUser = checkAuthentication();
    if (!currentUser) return [];

    const userDataKey = getUserDataKey(currentUser.username);
    const userData = JSON.parse(localStorage.getItem(userDataKey)) || { calculations: [] };
    return userData.calculations;
}

// 删除用户计算记录
function deleteUserCalculation(id) {
    const currentUser = checkAuthentication();
    if (!currentUser) return false;

    const userDataKey = getUserDataKey(currentUser.username);
    const userData = JSON.parse(localStorage.getItem(userDataKey)) || { calculations: [] };
    
    const initialLength = userData.calculations.length;
    userData.calculations = userData.calculations.filter(calc => calc.id !== id);
    
    if (userData.calculations.length !== initialLength) {
        localStorage.setItem(userDataKey, JSON.stringify(userData));
        return true;
    }
    return false;
}

// 管理员面板功能
window.showAdminPanel = function() {
    // 获取用户数据
    const users = JSON.parse(localStorage.getItem('system_users')) || {};
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #4a5568; margin-bottom: 20px; text-align: center;">👑 用户管理系统</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #4a5568; margin-bottom: 15px;">添加新用户</h3>
                <div style="display: grid; gap: 12px;">
                    <input type="text" id="newUsername" placeholder="用户名" style="padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                    <input type="password" id="newPassword" placeholder="密码" style="padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                    <input type="text" id="newName" placeholder="显示名称" style="padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                    <select id="newRole" style="padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px;">
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                        <option value="guest">访客</option>
                    </select>
                    <button onclick="addNewUser()" style="padding: 10px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">添加用户</button>
                </div>
            </div>

            <div>
                <h3 style="color: #4a5568; margin-bottom: 15px;">用户列表</h3>
                <div id="userList" style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;"></div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="closeAdminPanel()" style="padding: 8px 16px; background: #f56565; color: white; border: none; border-radius: 6px; cursor: pointer;">关闭</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    updateUserList(users);
}

// 更新用户列表
window.updateUserList = function(usersParam) {
    const userList = document.getElementById('userList');
    if (!userList) return;

    const users = usersParam || JSON.parse(localStorage.getItem('system_users')) || {};
    userList.innerHTML = '';
    
    Object.entries(users).forEach(([username, user]) => {
        const userItem = document.createElement('div');
        userItem.style.cssText = 'padding: 12px; border-bottom: 1px solid #e2e8f0;';
        
        userItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                    <strong style="font-size: 16px;">${username}</strong>
                    <div style="color: #666; font-size: 14px; margin-top: 4px;">
                        ${user.name} · <span style="color: #888;">${user.role}</span>
                    </div>
                </div>
                <button onclick="deleteUser('${username}')" style="padding: 4px 8px; background: #f56565; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
            </div>
            <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 13px; color: #495057;">
                <strong>密码:</strong> ${user.password}
            </div>
        `;
        
        userList.appendChild(userItem);
    });
}

// 添加新用户
window.addNewUser = function() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !password || !name) {
        alert('请填写所有字段！');
        return;
    }

    const users = JSON.parse(localStorage.getItem('system_users')) || {};
    if (users[username]) {
        alert('用户名已存在！');
        return;
    }

    users[username] = { password, name, role };
    localStorage.setItem('system_users', JSON.stringify(users));
    
    alert('用户添加成功！');
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newName').value = '';
    updateUserList(users);
}

// 删除用户
window.deleteUser = function(username) {
    if (username === 'admin') {
        alert('不能删除管理员账号！');
        return;
    }

    if (confirm(`确定要删除用户 ${username} 吗？`)) {
        const users = JSON.parse(localStorage.getItem('system_users')) || {};
        delete users[username];
        localStorage.setItem('system_users', JSON.stringify(users));
        updateUserList(users);
        alert('用户已删除！');
    }
}

// 关闭管理员面板
window.closeAdminPanel = function() {
    const modal = document.querySelector('div[style*="position: fixed; top: 0"]');
    if (modal) {
        modal.remove();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户认证
    const currentUser = checkAuthentication();
    if (!currentUser) return;

    // 显示用户信息
    displayUserInfo();
    
    initApp().catch(error => {
        console.error('应用初始化失败:', error);
        showAlert('应用初始化失败，请刷新页面重试', 'error');
    });
});
