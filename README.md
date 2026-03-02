# Easy-Stay 酒店预订与管理系统

Easy-Stay 是一个功能齐全的全栈项目，涵盖了移动端预订、商家入驻管理及后台审核流。本项目已完成后端架构整合，统一采用 Express 框架与 MongoDB 数据库驱动。

## 项目结构

* **`backend/`**: 统一的后端核心。基于 Node.js (Express) 构建，使用 MongoDB 进行持久化存储。
* **`easy-stay-h5/`**: 移动端用户界面。基于 React + Vite 构建，支持酒店搜索和详情展示。
* **`Easy-stay-admin-master/`**: 管理员控制台。用于酒店入驻审核、发布及下架管理。

## 快速开始

### 1. 环境依赖
* Node.js (建议 v16+)
* MongoDB (需确保服务已在本地或云端运行)

### 2. 后端配置 (`backend`)
1. **安装依赖**:
   ```bash
   cd backend
   npm install
   ```
2. 配置环境变量:在 backend 目录下创建 .env 文件：
    ```bash
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/easy_stay
    JWT_SECRET=your_custom_secret_key
    ```
3. 导入初始数据 (可选):    
    如果你需要从原 api/data/hotels.json 迁移数据，运行：
    ```Bash
    node importData.js
    ```
4. 启动开发服务器:
    ```Bash
    npm run dev
    ```
    服务将运行在: http://localhost:3000。
       
### 3. 前端启动 (H5 & Admin)
- 分别进入 easy-stay-h5 和 Easy-stay-admin-master 目录。
- 安装依赖：npm install。
- 检查代理: 确保各目录下的 vite.config.ts 代理目标指向 http://localhost:3000。
- 运行：npm run dev。
   
## 技术实现说明
### 后端逻辑
- **整合数据模型**: 采用 Mongoose 定义 Hotel 模型，支持房型嵌套数组 (roomTypes) 及状态流转枚举。
- **API 兼容性**:
    - **H5 接口**: /api/h5/hotels 现在通过 MongoDB 聚合查询实现分页与多条件筛选（星级、价格、城市）。
    - **审核逻辑**: 管理端通过 /api/admin/hotels/:id/review 等接口控制酒店从 auditing 到 published 的状态转换。
- **权限安全**: 全局采用 JWT 校验中间件，通过 Header 中的 Authorization 令牌识别 merchant 或 admin 角色。
   