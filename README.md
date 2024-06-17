# cloudflare-docker-proxy

## Deploy
```
创建api token:
https://dash.cloudflare.com/profile/api-tokens
选择 -> "编辑 Cloudflare Workers" -> "使用模板" 记录好生成token
github action 配置:
settings->"secrets and variables"->Actions->"New repository secret" 添加如下变量：
CF_API_TOKEN = your token 就是上面生成的token
CLOUDFLARE_ACCOUNT_ID = your account id 就是cloudflare的account id

点击actions 激活github action 自动构建部署
然后修改src/index.js 修改routes 配置 提交到github 会自动构建部署到cloudflare workers
域名解析设置
cloudflare workers 域名设置 设置->触发器->添加自定义域 把所以域名添加到自定义域就可以了
${workername}.${username}.workers.dev 返回的routes json
cf 优选ip https://github.com/XIU2/CloudflareSpeedTest
```
## Config tutorial

1. use cloudflare worker host: only support proxy one registry
   ```javascript
   const routes = {
     "${workername}.${username}.workers.dev/": "https://registry-1.docker.io",
   };
   ```
2. use custom domain: support proxy multiple registries route by host
   - host your domain DNS on cloudflare
   - add `A` record of xxx.example.com to `192.0.2.1`
   - deploy this project to cloudflare workers
   - add `xxx.example.com/*` to HTTP routes of workers
   - add more records and modify the config as you need
   ```javascript
   const routes = {
     "docker.tycng.com": "https://registry-1.docker.io",
     "quay.tycng.com": "https://quay.io",
     "gcr.tycng.com": "https://k8s.gcr.io",
     "k8s-gcr.tycng.com": "https://k8s.gcr.io",
     "ghcr.tycng.com": "https://ghcr.io",
   };
   ```

