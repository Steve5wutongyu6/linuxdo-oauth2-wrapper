# linuxdo-oauth2-wrapper

将原本的 `PHP` 兼容层重写为可直接部署到 `Cloudflare Workers` 的 `Node.js` Worker。

这个 Worker 仍然只做一件事：作为 `userinfo` 中间层请求 `Linux.do` 的用户接口，再按配置改写返回结果，因此可以继续用于替换 OAuth2 的 userinfo 端点。

## 当前支持的能力

1. 将 `username` 转为小写。
2. 限制最低 `trust_level`。
3. 通过白名单绕过最低信任等级限制。
4. 通过 Workers 环境变量控制行为，不再依赖 PHP 文件内硬编码。

## 环境变量

下面这些变量都可以在 Cloudflare Workers 的环境变量中配置，Worker 代码通过 `env` 读取：

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `TARGET_URL` | 上游 userinfo 接口地址 | `https://connect.linux.do/api/user` |
| `FORCE_STRTOLOWER` | 是否强制把 `username` 转小写，支持 `true/false/1/0/yes/no/on/off` | `false` |
| `FORCE_MINLEVEL` | 最低信任等级，必须是数字 | 未设置 |
| `WHITELIST_MINLEVEL_USERNAME` | 信任等级白名单，支持 `["user1","user2"]` 或 `user1,user2` | 空 |

配置优先级如下：

1. Workers 环境变量
2. URL 查询参数

其中查询参数仅保留以下两个，便于兼容旧用法：

| 查询参数 | 说明 |
| --- | --- |
| `force_strtolower` | 只要出现就启用小写转换 |
| `force_minlevel` | 动态指定最低信任等级 |

## 本地开发

```bash
npm install
npm run dev
```

如果需要本地注入变量，可以使用 `.dev.vars`：

```env
TARGET_URL=https://connect.linux.do/api/user
FORCE_STRTOLOWER=true
FORCE_MINLEVEL=3
WHITELIST_MINLEVEL_USERNAME=["admin","trusted_user"]
```

## 部署到 Cloudflare Workers

1. 安装依赖：

```bash
npm install
```

2. 登录 Cloudflare：

```bash
npx wrangler login
```

3. 在 Cloudflare Dashboard 或通过 Wrangler 配置变量。

非敏感变量可以直接在 Dashboard 的 Worker Settings 中配置为环境变量。

4. 部署：

```bash
npm run deploy
```

## 调用示例

将你的 OAuth2 `userinfo` 端点指向部署后的 Worker 地址，例如：

```text
https://linuxdo-oauth2-wrapper.your-subdomain.workers.dev
```

带动态参数的示例：

```text
https://linuxdo-oauth2-wrapper.your-subdomain.workers.dev?force_strtolower=true&force_minlevel=3
```

健康检查：

```text
GET /health
```
