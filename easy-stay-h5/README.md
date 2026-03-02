# 易宿酒店预订平台（C 端移动 H5）

## 1. 项目介绍
- 技术栈：`React 18 + TypeScript + Vite + React Router + json-server`
- 目标：从 0 重写 C 端移动 H5，并与现有 B 端（`Easy-stay-admin-master`）实现共享数据联动
- 共享数据源：`json-server`（演示阶段唯一数据源）

### 页面功能清单
- 首页 `/`
  - 推荐酒店
  - 查询区（城市、关键词、日期范围弹层、星级、价格、标签）
  - 查询条件写入 URL 并跳转列表页
- 列表页 `/list`
  - `useSearchParams` 作为查询状态源
  - 筛选抽屉（星级/价格/标签）
  - 上滑自动加载（IntersectionObserver）
  - `loading / empty / error` 三态 + 重试
  - 仅展示可预订酒店（`auditStatus=APPROVED && isOnline=true`）
- 详情页 `/hotel/:id`
  - 轮播图
  - 酒店信息、日期与间夜
  - 房型价格升序 + 已选房型
  - 未通过审核/已下线的不可预订提示

## 2. 本地启动

### 2.1 安装依赖
```bash
cd F:\front-end\yisu\easy-stay-h5
npm install
```

### 2.2 生成扩展 mock 数据（32 家酒店）
```bash
npm run mock:seed
```

### 2.3 启动 mock（端口 4000）
```bash
npm run mock
```

### 2.4 启动前端（端口 5173）
```bash
npm run dev
```

### 2.5 可选环境变量
创建 `.env`：
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 3. 数据模型说明

### 3.1 hotel
- `id: string`
- `name: string`
- `city: string`
- `district: string`
- `address: string`
- `description: string`
- `starRating: number`
- `minPrice: number`
- `maxPrice: number`
- `auditStatus: "PENDING" | "APPROVED" | "REJECTED"`
- `isOnline: boolean`
- `offlineReason?: string`
- `tagIds: string[]`
- `facilities: string[]`
- `images: string[]`
- `rooms: Room[]`
- `updatedAt: string`

### 3.2 room
- `id: string`
- `name: string`
- `price: number`
- `breakfast: boolean`
- `cancelPolicy: string`
- `stock: number`

### 3.3 tag
- `id: string`
- `name: string`

## 4. json-server API 约定
- `GET /hotels?_page=1&_per_page=10`（json-server v1 分页）
- `GET /hotels?id=h-001` 或 `GET /hotels/:id`
- `POST /hotels`
- `PUT/PATCH /hotels/:id`
- `GET /tags`

支持过滤参数（可前端二次过滤）：
- `city_like`
- `keyword_like`
- `tagIds_like`
- `starRating`
- `minPrice_gte`
- `maxPrice_lte`

## 5. 与 B 端最小改动接入手册

目标：不重写 B 端页面逻辑，仅在数据访问层接入共享数据源。

### 已采用的最小改动
- 新增 `src/lib/apiClient.ts`
  - 支持 `VITE_ADMIN_API_BASE_URL`（默认 `http://localhost:4000`）
- 修改 `src/store/useHotelStore.ts`
  - 商户新增酒店：`POST /hotels`
  - 审核/发布/下线：`PATCH /hotels/:id`
  - 酒店列表：`GET /hotels`
- 页面仅做最小适配（调用 store 的异步方法）
  - `src/pages/Merchant/HotelForm.tsx`
  - `src/pages/Admin/HotelList.tsx`

### B 端可选环境变量
在 `Easy-stay-admin-master` 下创建 `.env`：
```env
VITE_ADMIN_API_BASE_URL=http://localhost:4000
```

## 6. 数据刷新/同步策略（答辩可用）
- C 端：列表页支持手动“刷新” + 上滑加载
- B 端：新增/审核后会重新拉取 `hotels`，保证当前端最新
- C/B 端共享同一份 `db.json`，因此 B 端写入后 C 端刷新即见

## 7. 2-3 分钟演示脚本
1. 启动三个进程
   - `backend`: `npm run dev`
   - `easy-stay-h5`: `npm run dev`
   - `Easy-stay-admin-master`: `npm run dev`
2. 打开 C 端首页，展示推荐酒店与日期弹层查询
3. 进入列表页，展示 URL 驱动筛选、上滑加载、三态
4. 进入详情页，展示轮播、房型价格升序、已选房型
5. 切到 B 端：
   - 注册商户账号并登录
   - 新增酒店并提交审核
   - 管理员账号登录，审核通过并发布
6. 回到 C 端列表页点击“刷新”，展示新酒店出现（共享数据联动成功）
