# 🚗 两地距离计算器

一个基于Matrix API的智能网页工具，用于计算两地之间的实际行驶距离和行驶时间。

## ✨ 功能特性

- 🗺️ **智能距离计算**: 使用Matrix API计算两地间的实际行驶距离和时间
- 📋 **结果复制**: 一键复制计算结果，方便粘贴到其他应用
- 📊 **历史记录**: 自动保存计算历史，支持查看和管理
- 📁 **Excel导入**: 支持批量导入Excel文件中的两地数据
- 📤 **Excel导出**: 将计算结果导出为Excel文件
- 💾 **本地存储**: 数据保存在本地，保护隐私
- 📱 **响应式设计**: 支持各种设备，移动端友好

## 🚀 快速开始

### 1. 获取API密钥

本项目使用OpenRouteService的Matrix API，你需要：

1. 访问 [OpenRouteService](https://openrouteservice.org/)
2. 注册账号并获取API密钥
3. 将API密钥填入应用中的"Matrix API密钥"字段

### 2. 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 3. 使用说明

#### 单次计算
1. 在"起点位置"输入起点名称或地址
2. 在"终点位置"输入终点名称或地址
3. 输入你的Matrix API密钥
4. 点击"🚀 计算距离"按钮
5. 查看计算结果并可以复制或保存

#### 批量处理
1. 准备Excel文件，第一行包含列标题：起点、终点
2. 点击"📥 导入Excel"选择文件
3. 导入成功后，可以逐个计算或批量处理
4. 完成后点击"📤 导出结果"下载Excel文件

## 📁 Excel模板格式

你的Excel文件应该按以下格式准备：

| 起点 | 终点 |
|------|------|
| 北京 | 上海 |
| 广州 | 深圳 |
| 杭州 | 南京 |

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **构建工具**: Vite
- **Excel处理**: SheetJS (XLSX)
- **API**: OpenRouteService Matrix API
- **样式**: 自定义CSS，支持响应式设计

## 📝 API说明

### OpenRouteService Matrix API

- **端点**: `https://api.openrouteservice.org/v2/matrix/driving-car`
- **方法**: POST
- **认证**: Bearer Token
- **参数**: 
  - `locations`: 位置数组
  - `metrics`: 计算指标 (distance, duration)
  - `units`: 单位 (km)

## 🎨 自定义配置

你可以修改 `main.js` 中的API配置来使用其他服务：

```javascript
// 修改API端点
const baseUrl = '你的API端点';

// 修改请求头
headers: {
    'Authorization': `Bearer ${apiKey}`,
    // 其他自定义头部
}
```

## 📱 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

**bleem781** - 781000931@qq.com

---

## 🆘 常见问题

### Q: API密钥无效怎么办？
A: 请检查你的OpenRouteService账号状态，确保API密钥正确且有效。

### Q: 为什么计算结果不准确？
A: 距离计算基于实际道路网络，可能与直线距离有差异。确保输入的位置名称准确。

### Q: 如何批量处理大量数据？
A: 使用Excel导入功能，可以一次性导入多行数据，然后逐个计算。

### Q: 支持哪些位置格式？
A: 支持城市名称、完整地址、地标名称等多种格式，建议使用详细地址获得更准确的结果。
