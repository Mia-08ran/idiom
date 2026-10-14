# 成语智灵 · 成语星河

静态网站部署于 GitHub Pages：https://mia-08ran.github.io/idiom/

## 当前内容

- 首页：星河国风视觉，成语百科、既有绘本、创作说明入口。
- 成语百科：邯郸学步释义与典故插画；东施效颦、生搬硬套、独辟蹊径、自成一家站内解释页。
- AI故事绘本：已有《如果邯郸学步发生在2026》，四幅插画、八幕翻页阅读。
- 我们来创作：项目定位与共创空间入口。
- 我们来创作页内的宣纸卡片：点击“共创故事”在原卡片内切换，上方输入、下方阅读，可返回介绍且保留输入。支持“输入成语”“说说困惑”两种起点，自动或手动选择青年成长主题；展示成语内核、现代意义、当代故事、行动建议与相关成语，可复制和下载文本。
- 原共读对话框保留三个明确标注的预设编辑解读，并提供卡片创作入口。
- create.html：旧独立页面地址现重定向至原“我们来创作”页面。

## AI接入状态

创作页已填写公开后台地址和 Turnstile Site key；后台已部署，真实生成尚待配置完整并验证。编辑示例始终标注为示例，不代表用户输入的生成结果。
DeepSeek 后台源码和部署说明见 [backend/README.md](backend/README.md)。健康检查会返回 ready 和缺失配置的名称，不返回密钥内容。
后台地址：https://idiomm.tianran200806.workers.dev 。API 密钥只放后台 Secret，不能写入 HTML、前端配置、公开仓库或聊天。

第一版只生成成语故事，不新增绘本生成。首页已有绘本继续保留。

## 文件与检查

- index.html：现有网站与路由。
- assets/creation.js、assets/creation-card.css：宣纸卡片的创作交互及局部样式。
- create.html：兼容旧链接的重定向入口。
- assets/creation-config.js：仅包含公开的后台地址与验证站点公钥。
- backend/worker.mjs、backend/wrangler.jsonc：DeepSeek 调用、服务端验证和频率限制。
- qa/worker.test.mjs：使用模拟验证服务和模型输出验证后台边界；运行 node --test qa/worker.test.mjs，不调用真实 API。

浏览器已检查桌面及 320/390/799 像素布局、入口跳转、输入模式、相关推荐、复制下载和模拟生成成功/失败。模拟测试不代表真实 DeepSeek 调用已成功。

## 资源

- assets/galaxy.webp：原创星河国风背景。
- assets/scenes.webp：同一位现代大学生的四格故事插画。
- assets/handan-classical.webp：古代典故想象插画，不作为历史复原。
- assets/spirit-avatar.webp：国风书灵头像。
- assets/image-prompts.txt：ImageGen 原始提示词。
- assets/fonts/star-brush.woff2：Ma Shan Zheng 字体子集；授权见 assets/fonts/OFL.txt。

现代故事均为创意改编。邯郸学步原意参考：https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=5867&la=0&webMd=1
