// 货车运输距离计算测试
// 专门测试重型货车参数是否正确传递和高德地图API响应

// 模拟车辆配置（重型货车）
const vehicleConfig = {
    truckType: 'heavy',
    axleCount: '4',
    totalWeight: 40.00,
    truckLength: 14.70,
    truckWidth: 2.50,
    truckHeight: 4.00
};

// 测试地址
const testOrigin = "湖南省长沙市长沙县江背镇福田村坦塘组188号赫茗尚仓";
const testDestination = "南昌市青山湖区湖坊镇";

console.log('🚛 货车运输距离计算测试');
console.log('========================');

console.log('📋 测试参数配置:');
console.log('- 货车类型:', vehicleConfig.truckType);
console.log('- 轴数:', vehicleConfig.axleCount + '轴');
console.log('- 总重量:', vehicleConfig.totalWeight + '吨 → ' + (vehicleConfig.totalWeight * 1000) + '公斤');
console.log('- 车长:', vehicleConfig.truckLength + '米 → ' + (vehicleConfig.truckLength * 100) + '厘米');
console.log('- 车宽:', vehicleConfig.truckWidth + '米 → ' + (vehicleConfig.truckWidth * 100) + '厘米');
console.log('- 车高:', vehicleConfig.truckHeight + '米 → ' + (vehicleConfig.truckHeight * 100) + '厘米');

console.log('\n📍 测试路线:');
console.log('- 起点:', testOrigin);
console.log('- 终点:', testDestination);

console.log('\n🛣️ 高德地图API参数构建:');

// 构建高德地图API请求URL（模拟）
const apiKey = "your_amap_api_key_here";
let strategy = '2'; // 货车路线策略

let url = `https://restapi.amap.com/v3/direction/driving?key=${apiKey}&origin=模拟坐标&destination=模拟坐标&strategy=${strategy}&extensions=base`;

// 添加货车专用参数
if (vehicleConfig.truckType !== 'micro') {
    url += `&cartype=2`; // 2表示货车
    url += `&carweight=${vehicleConfig.totalWeight * 1000}`; // 转换为公斤
    url += `&carheight=${vehicleConfig.truckHeight * 100}`; // 转换为厘米
    url += `&carwidth=${vehicleConfig.truckWidth * 100}`; // 转换为厘米
    url += `&carlength=${vehicleConfig.truckLength * 100}`; // 转换为厘米
    url += `&axlenum=${vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount)}`;
}

console.log('📡 API请求URL:');
console.log(url);

console.log('\n🔍 货车专用参数详情:');
console.log('- cartype: 2 (货车)');
console.log('- carweight:', vehicleConfig.totalWeight * 1000 + '公斤');
console.log('- carheight:', vehicleConfig.truckHeight * 100 + '厘米');
console.log('- carwidth:', vehicleConfig.truckWidth * 100 + '厘米');
console.log('- carlength:', vehicleConfig.truckLength * 100 + '厘米');
console.log('- axlenum:', (vehicleConfig.axleCount === '6+' ? 6 : parseInt(vehicleConfig.axleCount)) + '轴');

console.log('\n📊 预期行为:');
console.log('1. 使用策略2: 货车路线（避开限行、限高、限重路段）');
console.log('2. 传递完整的货车参数给高德地图API');
console.log('3. 返回货车专用路线距离（应该与小轿车路线不同）');
console.log('4. 避开不适合货车的路段');

console.log('\n⚠️ 常见问题排查:');
console.log('1. 检查高德地图API密钥是否正确配置');
console.log('2. 确认API支持货车路线规划功能');
console.log('3. 验证地址解析是否准确');
console.log('4. 查看控制台输出的完整API响应');

console.log('\n✅ 测试完成 - 请在实际应用中验证参数传递和API响应');