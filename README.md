# cloudflare-proxy

## Deploy
```
创建api token:
https://dash.cloudflare.com/profile/api-tokens
选择 -> "编辑 Cloudflare Workers" -> "使用模板"->帐户资源选择自己的用户->区域资源选择自己需要部署的域名-> 记录好生成token
github action 配置:
点你的右上角头像->Your profile->选择你fork的项目cloudflare-proxy
在Code那个栏目里，待会儿Actions也是点击那里，
settings->"secrets and variables"->Actions->(选择密钥Secrets，不要选择Variables)
->"New repository secret" 添加如下变量：
YOUR_SECRET_NAME里填写 CF_API_TOKEN， Secret里填写你在cloudflare上申请的token 
就是上面生成的token->Add secrets,别着急，
还要添加一个变量 CLOUDFLARE_ACCOUNT_ID,Secret里就是cloudflare的account id，就是登陆id，
我是用邮箱登陆，这里用xxx@xxx.com->Add secrets
回到在Code那个栏目里就在旁边的Actions也是点击那里点击actions 激活github action 自动构建部署
然后修改src/index.js 修改routes 配置 提交到github 会自动构建部署到cloudflare workers，
routes里修改为你的域名比如"docker.xxx.com": "https://registry-1.docker.io",后面的"https://registry-1.docker.io不用修改，
把下面几个常用的仓库都修改了。点保存提交。
域名解析设置
https://dash.cloudflare.com/ 回到cf首页
点击左边的栏目Workers和Pages->概述->cloudflare-proxy->设置->触发器->添加自定义域
把src/index.js里改的docker.xxx.com，你添加了几个仓库就写几个域名上去，填写完等5-10分钟就行了
cf 优选ip https://github.com/XIU2/CloudflareSpeedTest
将162.159.136.57添加到本地hosts里，自己根据上面cf优选找IP，不一定我这个IP适合大家，挑一个延时最小的就行了。
docker 用法：官方的镜像就是我们pull的时候不用添加任何多余的层的镜像如下面的nginx需要添加library
例子1：
原：docker pull nginx
现：docker pull docker.xxx.com/nginx
例子2：
原：docker pull osixia/keepalived
现：docker pull docker.xxx.com/osixia/keepalived

${workername}.${username}.workers.dev 返回的routes json

```
## Config tutorial

只转发一个可用使用下面配置
   ```javascript
   const routes = {
     "${workername}.${username}.workers.dev/": "https://registry-1.docker.io",
   };
   ```
多个转发需求配置必须要有自己的域名
```javascript
   const routes = {
    "docker.boown.com": "https://registry-1.docker.io",
    "quay.boown.com": "https://quay.io",
    "gcr.boown.com": "https://gcr.io",
    "k8s-gcr.boown.com": "https://k8s.gcr.io",
    "k8s.boown.com": "https://registry.k8s.io",
    "ghcr.boown.com": "https://ghcr.io",
    "cloudsmith.boown.com": "https://docker.cloudsmith.io",
    "pypi.boown.com": "https://pypi.org",
    "npmjs.boown.com": "https://registry.npmjs.org",
    "cnpmjs.boown.com": "http://r.cnpmjs.org",
   };
```

