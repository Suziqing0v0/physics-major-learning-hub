# Physics Major Learning Hub

> **Design prototype of a learning website for physics teacher-education majors — timetables, schedule planning, and course materials.**

> 项目状态：设计原型 / Demo，不是已经上线的生产网站。仓库内只包含通用演示数据，不包含个人课表、日程或真实课程资料。

## 项目简介

Physics Major Learning Hub 是一个面向 **物理学（师范）** 专业的学习网站设计原型。

它把三类内容放在同一套界面中：

- **课程表**：周视图、手机日视图、周次切换、单双周、课程导入
- **日程计划**：周历、任务清单、完成进度
- **学习资料**：按年级和学科分类、筛选、详情

这个项目主要用于验证：

- 信息结构是否清楚
- 视觉方向是否适合物理师范专业
- 电脑和手机上的使用体验
- 课程表、日程、资料三者如何组织在同一个学习入口里

## 设计方向

当前视觉方向是 **03 卡片目录**。

| 元素 | 取值 |
|---|---|
| 页面底色 | 暖灰 `#EFEDE7` |
| 卡片 | 纯白 `#FFFFFF` |
| 主色 | 墨绿 `#1E3B2F` |
| 强调色 | 陶土 `#B2613C`，只用于“今天/到期” |
| 正文 | 墨黑 `#22221F` |
| 辅助文字 | 灰 `#8C8A81` |
| 分隔线 | `#E2DFD6` |

设计特点：

- 顶部胶囊导航取代传统侧边栏
- 手机端使用底部图标导航
- 首页使用墨绿引导卡和大号周次数字
- 统计信息拆成独立白卡
- 课程列表用左侧 3px 色条表达课程身份
- 每个区块右上角带 `§ 01` 形式的编号，呼应“卡片目录”的意象
- 首页开场动画为品牌幕布：约 0.75 秒，可点击跳过，只播放一次

设计相关页面：

- `design-options.html`：五种视觉方向对比
- `design-animations.html`：三种开场动画示意

## 功能

### 首页

- 本周周次、日期范围、课程和待办概况
- 本周课程列表
- 近期任务
- 最新资料
- 实践课程卡片
- 快速入口：导入课表、添加任务

### 课程表

- 电脑端周视图，左侧为上午 / 下午 / 晚上分组
- 手机端日视图 + 周视图切换
- 自动计算第几周，支持左右切换、回到本周
- 单双周、多段周次（如 `1-8,10-16`）
- 添加、编辑、删除课程
- 点空白格子可直接添加对应节次的课程
- 实践课程单独展示
- 导入支持：教务系统整表粘贴（TSV）、JSON、每行一门课

### 课程资料

- 按年级筛选
- 按学科筛选
- 按资料名、学科、描述、标签筛选
- 资料详情弹窗
- 公开版本使用通用示例资料，不包含真实文件

### 日程计划

- 周一到周日周历
- 每天显示任务色块
- 本周任务清单
- 勾选完成
- 添加、编辑、删除任务
- 完成进度条
- 数据保存在浏览器本地

## 技术栈

| 层 | 技术 |
|---|---|
| 页面 | 原生 HTML |
| 样式 | 原生 CSS，响应式布局 |
| 交互 | 原生 JavaScript |
| 数据 | `data.js` + 浏览器 `localStorage` |
| 离线 | Service Worker + PWA manifest |
| 构建 | 无需构建，静态文件直接运行 |
| 部署 | 任意静态托管 / GitHub Pages |

项目没有使用 React、Vue 或后端框架，目的是保持原型轻量、易改、易讲。

## 运行方式

在项目目录运行：

```powershell
python -m http.server 8768 --bind 0.0.0.0
```

电脑打开：

```text
http://127.0.0.1:8768/
```

手机和电脑在同一个 Wi-Fi 时打开：

```text
http://<电脑的局域网 IP>:8768/
```

局域网 IP 以电脑 `ipconfig` 里的 IPv4 地址为准。

## 文件结构

```text
index.html                 页面骨架、顶部导航、弹窗、开场幕布
styles.css                 全站样式、响应式、动画
data.js                    通用演示课程、资料、课表、任务
js/core.js                 状态、存储、周次计算、路由、弹窗
js/home.js                 首页
js/timetable.js            课程表、导入、课程编辑
js/materials.js            课程资料列表与详情
js/planner.js              日程计划
js/app.js                  初始化、设置、备份、开场动画
scripts/build-materials.py 扫描本地资料目录并生成资料索引
manifest.webmanifest       PWA 配置
sw.js                      离线缓存
design-options.html        五种视觉方向对比
design-animations.html     三种开场动画示意
```

## 数据与隐私

- 课表和任务保存在浏览器 `localStorage`。
- 每个浏览器、每个地址/端口的数据是独立的。
- 仓库里的 `data.js` 是**通用演示数据**，不是任何人的真实课表。
- 真实课表、日程、课程资料和截图不提交到 GitHub。
- `.gitignore` 已排除：
  - `资料/`
  - `materials-data.js`
  - `screenshots/`
  - `tmp/`
  - `uploads/`

### 接入本地真实资料

真实资料只保留在本地，不上传仓库：

```text
资料/
  大一 上/
    高等数学/
      课件.pdf
  大二 上/
    教育学基础/
      题库.pdf
```

运行：

```powershell
python scripts/build-materials.py
```

脚本会生成 `materials-data.js`，按年级和学科建立索引。

> 公开演示版默认不加载 `materials-data.js`。如果你在本地生成了它，需要在 `index.html` 中本地加入：
>
> ```html
> <script src="materials-data.js"></script>
> ```
>
> 不要把这个文件和 `资料/` 提交到公开仓库。

## 部署

### GitHub Pages

这是纯静态站点，可以直接部署到 GitHub Pages：

1. 将仓库推到 GitHub
2. Settings → Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`
5. 目录选择 `/ (root)`
6. 保存后等待生成 HTTPS 地址

GitHub Pages 上显示的是通用演示数据；真实资料仍然只在本地。

### 其他静态托管

Cloudflare Pages、Vercel、Netlify 或国内云静态托管都可以，直接部署根目录即可。

## 当前不包含

- 账号登录与权限
- 云端同步
- 资料上传 / 审核
- 全文搜索
- 管理员后台
- 多学期管理
- 正式生产环境的数据库和后端

这些是后续阶段，不是当前设计原型的范围。

## 后续路线

### 阶段 1：设计原型（当前）

- 验证信息结构、视觉方向和主要交互
- 使用通用演示数据
- 收集同学和老师的反馈

### 阶段 2：可试用版本

- 首次使用引导
- 导入自己的课表
- 接入真实课程资料
- 部署到正式 HTTPS 地址
- 找 3–5 个同学试用

### 阶段 3：多用户版本

- 登录与权限
- 云端同步
- 资料上传 / 审核
- 全文搜索
- 管理员后台

### 阶段 4：专业级推广

- 全专业试用
- 内容维护流程
- 隐私政策、版权确认、备案等合规工作

## 说明

- 这是一个学习类网站设计原型，不是正式教务系统。
- 课程表数据应通过导出文件、复制表格或手动录入获得，不要保存或填写教务系统账号密码。
- 真实课程资料可能涉及教师版权，公开或分享前请确认授权。
- 当前仓库尚未选择开源许可证；如需复用、分发或商业使用，请先补充 LICENSE。

---

**Repository name:** `physics-major-learning-hub`  
**Project type:** Design prototype  
**Status:** Demo / not production-ready
