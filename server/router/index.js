const Router = require('koa-router') // 路由中间件
const router = new Router()  // 实例化
// mock
const mock = require('../mock')

// 授权页
router.get('/oauth2/authorize', async ctx => {
	await ctx.render('auth', {
		AppName: mock.app_info.AppName
	})
})

// 获取access_token
router.get('/oauth2/access_token', async ctx => {
	ctx.body = {
		"access_token": "2YotnFZFEjr1zCsicMWpAA",
		"token_type": "authorize",
		"expires_in": 3600,
		"refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
		"scope": "SCOPE"
	}
})

module.exports = router.routes();
