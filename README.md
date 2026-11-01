# 物理学（师范） · 学习中心

一个面向 **物理学（师范）** 专业的轻量学习网站原型：

- 课程资料浏览：按年级、学科筛选
- 课程表导入：Excel / 教务系统粘贴 / JSON / 手动添加
- 日程计划：周历 + 任务清单 + 完成勾选
- 电脑 / 手机响应式，支持 PWA
- 首页品牌幕布开场动画（约 0.75 秒，可跳过）

> 本仓库只包含**公开演示数据**。个人课表、日程、真实课程资料和截图不会提交到 GitHub。

## 快速开始

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

## 当前功能

- 首页：本周课程、近期任务、最新资料、快速入口
- 课程表：周视图 / 手机日视图、周次切换、单双周、课程增删改
- 课程资料：按年级 / 学科 / 名称 / 标签筛选，资料详情
- 日程计划：周历、任务清单、完成进度
- 设置：学期、开学日期、总周数、JSON 导出/导入
- PWA：可添加到手机主屏幕（需要 HTTPS 或 localhost）

## 数据与隐私

- 课表和任务保存在浏览器 `localStorage`，不会上传服务器。
- 每个浏览器、每个地址/端口的数据是独立的。
- `data.js` 里是**演示课程、演示课表和演示任务**，不是任何人的真实课表。
- 真实资料放在本地 `资料/` 目录，不提交到 GitHub。
- `资料/`、`materials-data.js`、`screenshots/`、`tmp/` 已加入 `.gitignore`。

## 接入自己的真实资料

在本地创建：

```text
资料/
  大一 上/
    高等数学/
      课件.pdf
  大二 上/
    教育学基础/
      题库.pdf
```

然后运行：

```powershell
python scripts/build-materials.py
```

脚本会生成 `materials-data.js`，按年级和学科建立索引。

> 注意：本仓库为了公开演示，默认没有加载 `materials-data.js`。如果你在本地生成了它，需要在 `index.html` 中重新加入：
>
> ```html
> <script src="materials-data.js"></script>
> ```
>
> 并且不要把 `materials-data.js` 和 `资料/` 提交到公开仓库。

## 部署到 GitHub Pages

这是一个纯静态站点，可以直接用 GitHub Pages：

1. 把本仓库推到 GitHub
2. Settings → Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，目录选 `/ (root)`
5. 保存后等待生成 HTTPS 地址

GitHub Pages 上会显示演示数据；真实 `资料/` 仍然只保留在本地。

## 文件结构

```text
index.html              页面骨架、导航、开场幕布
styles.css              全站样式和响应式
data.js                 演示课程、资料、课表、任务
js/core.js              状态、存储、周次计算、路由、弹窗
js/home.js              首页
js/timetable.js         课程表、导入、课程编辑
js/materials.js         课程资料列表与详情
js/planner.js           日程计划
js/app.js               初始化、设置、备份、开场动画
scripts/build-materials.py  扫描本地资料目录并生成索引
manifest.webmanifest    PWA 配置
sw.js                   离线缓存
design-animations.html  三种开场动画示意
design-options.html     早期风格对比页
```

## 当前限制

- 没有账号登录
- 没有云端同步
- 没有资料上传 / 审核
- 没有全文搜索
- 没有管理员后台
- 真实资料的版权和公开范围需要自行确认

## 说明

这是一个学习类网站原型，不是正式教务系统。课程表数据请通过导出文件、复制表格或手动录入获得，不要保存或填写教务系统账号密码。
