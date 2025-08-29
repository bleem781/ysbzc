// IndexedDB数据库管理模块

// 数据库名称和版本
const DB_NAME = 'distanceCalculatorDB';
const DB_VERSION = 2; // 升级数据库版本以支持车辆配置信息
const STORE_NAME = 'calculationHistory';

// 打开数据库连接
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 数据库升级或首次创建
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // 创建对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error(`数据库打开失败: ${event.target.error.message}`));
    };
  });
}

// 插入计算记录
async function insertCalculation(origin, destination, distance, duration, timestamp, vehicleConfig) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 格式化车辆配置信息以便存储
    const formattedVehicleConfig = {
      powerType: vehicleConfig.powerType,
      truckType: vehicleConfig.truckType,
      etc: vehicleConfig.etc,
      axleCount: vehicleConfig.axleCount,
      totalWeight: vehicleConfig.totalWeight,
      ratedLoad: vehicleConfig.ratedLoad,
      truckLength: vehicleConfig.truckLength,
      truckWidth: vehicleConfig.truckWidth,
      truckHeight: vehicleConfig.truckHeight
    };

    const request = store.add({
      origin,
      destination,
      distance,
      duration,
      timestamp,
      vehicleConfig: formattedVehicleConfig,
      created_at: new Date().toISOString()
    });

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error(`插入记录失败: ${event.target.error.message}`));
    };
  });
}

// 获取所有计算历史
async function getAllHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      // 按创建时间降序排序
      const history = event.target.result.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      resolve(history);
    };

    request.onerror = (event) => {
      reject(new Error(`查询历史记录失败: ${event.target.error.message}`));
    };
  });
}

// 删除指定ID的历史记录
async function deleteHistory(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(new Error(`删除记录失败: ${event.target.error.message}`));
    };
  });
}

// 导出函数
export {
  insertCalculation,
  getAllHistory,
  deleteHistory
};