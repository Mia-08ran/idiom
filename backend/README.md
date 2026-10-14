# 成语智灵 · DeepSeek 故事后台

状态：后台已部署至 https://idiomm.tianran200806.workers.dev，前端已配置公开地址与 Turnstile Site key；真实生成仍需确认运行时配置齐全并验证。源代码已通过模拟响应测试，没有密钥写入本目录。

## 网站能力

- 原“我们来创作”页内点击“共创故事”，在宣纸卡片上方输入成语或描述困惑，由后台匹配成语和青年成长主题。
- 输出：成语本义、现代意义、与困惑的联系、四段完整故事、三条行动建议、三个相关成语。
- 不生成绘本图片。首页已有的《邯郸学步2026》绘本保持可读。

## 在 Cloudflare 部署（GitHub 连接方式）

1. Cloudflare → Workers & Pages → Create application → 导入 GitHub 仓库 Mia-08ran/idiom。若列表里没有仓库，在 GitHub 授权页面允许 Cloudflare 访问 idiom。
2. Worker 名称使用 idiomm（与当前已创建的项目一致，末尾两个 m）；根目录设为 backend；构建命令留空；部署命令设为 npm run deploy。平台会安装 package.json 中的 Wrangler。配置文件 backend/wrangler.jsonc 含两个频率限制绑定，不能遗漏。不要选择仅发布静态网页的模式。
3. 在该 Worker 的 Settings → Variables and Secrets 添加两个 Secret：
   - DEEPSEEK_API_KEY：用户自己填入 DeepSeek API 密钥。
   - TURNSTILE_SECRET_KEY：用户自己填入下一步创建的 Turnstile Secret key。
   不要把这两项发到聊天、提交 GitHub 或写在前端配置文件里。
4. Cloudflare → Turnstile → Add widget。取名 idiom-creation，允许的主机名为 mia-08ran.github.io（不加协议和 /idiom/ 路径），选 Managed 模式。创建后有公开 Site key 和保密 Secret key。公开 Site key 可以提供给网站维护者；Secret key 只填上一步 Worker 的 Secret。
5. 保存并部署 Worker。访问 https://你的Worker地址/health，应返回 ready:true；若为 false，missing 数组会列出缺少的配置名称，不包含任何密钥值。
6. 将公开的 Worker 地址、Turnstile Site key 交给网站维护者；不交任何密钥。维护者在 assets/creation-config.js 中填写：
   endpoint = https://你的Worker地址/api/story
   turnstileSiteKey = 公开 Site key
   发布前做一次真实生成验证。

如果账号界面的导入流程名称不同，按 Cloudflare 最新向导选择 Worker 并配置 backend 根目录。不要在不确定时把密钥粘进代码编辑区。

## 频率和费用边界

- IP_RATE_LIMITER：同一 IP 每分钟约 3 次；SITE_RATE_LIMITER：同一 Cloudflare 节点每分钟约 10 次。共享校园网络的用户可能共享额度。
- Cloudflare Rate Limiting 是按节点执行且最终一致，不是精确的全球日额度，不能保证账单上限。需要结合 DeepSeek 余额与后台用量观察；小额试用后再扩大开放。
- 每次生成须通过服务端 Turnstile 校验 hostname 和 action；只有验证通过才调用 DeepSeek。
- Origin 限制只约束浏览器跨站访问，不视为身份认证。Turnstile 和频率限制降低滥用风险，也不保证完全消除滥用。
- 后台限制输入体积、文字长度和 3500 输出 token；没有自动重试，不记录输入和密钥，不把供应商错误原文返回访客。
- 用户输入只在点击生成后发送给 DeepSeek；网站不使用 localStorage 保存私人困惑，不创建故事数据库。云平台及模型供应商自身的数据政策需另行查看。

## 模型与内容

当前配置 DEEPSEEK_MODEL = deepseek-flash，使用非思考模式和 JSON Output。以后更换模型时须核对 DeepSeek 官方文档。
生成释义需核对权威词典；不让模型编造古籍引文。故事及人物是虚构现代改编，不是心理诊断，也不承诺解决全部困境。

## 本地验证

使用 Node.js 运行：
- node --test qa/worker.test.mjs

测试中的验证服务和模型输出都是模拟数据，不调用真实密钥、不计入真实生成验证。

参考：
- https://api-docs.deepseek.com/api/create-chat-completion/
- https://api-docs.deepseek.com/guides/json_mode/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
