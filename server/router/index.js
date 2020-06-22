const Router = require('koa-router') // 路由中间件
const router = new Router()  // 实例化
const uuid = require('uuid') // uuid
const moment = require('moment') // 时间工具
// mock
const mock = require('../mock')
// 模拟数据库
const CODES = {}
const ACCESS_TOKENS = {}

// 授权页
router.get('/oauth2/authorize', async ctx => {
	await ctx.render('auth', {
		AppName: mock.app_info.AppName
	})
})

/**
 * 用户点击确定
 * 1.生成一个授权码
 * 2.调用回调URL地址，并返回授权码（http://localhost:8000/auth/callback）
 * 链接格式：https://open.server-name.com/oauth2/authorize?response_type=code&client_id=AppID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
 * */

// 获取授权码
router.get('/oauth2/authorize_code', async ctx => {
	// 参数校验
	const { client_id, response_type, redirect_uri, scope, state } = ctx.query;

	if ( !response_type || !client_id || !redirect_uri || !scope || !state ) {
		return ctx.body = { err_code: 10000, msg: '参数缺失' }
	}

	// 生成授权码
	let code = uuid.v4();
	// 服务器保存 clientId 对应的 code 等信息
	CODES[client_id] = {
		code,				// code
		gen_time: moment(),	// 发放时间,
		scope
	}
	// 重定向回调地址，传递授权码
	ctx.redirect(`${redirect_uri}?code=${code}&state=${state}`)
})


/**
 * 客户端请求服务器，发送请求获取令牌
 * 参数如下：
 grant_type        授权类型，此值固定为authorization_code
 code            授权码
 client_id        客户端标识，一般是第三方分配的AppID
 client_secret    客户端密钥，一般是第三方分配的AppSecret
 redirect_uri    回调地址，与之前的 redirect_uri保持一致
 * */

// 获取 access_token
router.post('/oauth2/access_token', async ctx => {

	// 当前时间
	const curr_time = moment()
	// 获取请求参数
	const { grant_type, code, client_id, client_secret } = ctx.request.body;

	// 参数校验
	if ( !grant_type || !code || !client_id || !client_secret ) {
		return ctx.body = { err_code: 10000, msg: '参数缺失' }
	}

	if ( grant_type !== 'authorization_code' ) {
		return ctx.body = { err_code: 10006, msg: '请求授权类型不对' }
	}

	if ( CODES[client_id].code !== code ) {
		return ctx.body = { err_code: 10012, msg: 'code不正确' }
	}

	if ( curr_time.diff(CODES[client_id].gen_time, 'seconds') > 3600 ) {
		return ctx.body = { err_code: 10016, msg: 'code失效' }
	}

	if ( client_id === mock.app_info.AppId && client_secret !== mock.app_info.AppSecret ) {
		return ctx.body = { err_code: 10010, msg: '应用appSecret不正确' }
	}

	// 发放token
	let access_token = uuid.v4(),
		refresh_token = uuid.v4()

	// 缓存 token , 记录此 token 对应的一些数据，方便后面使用
	ACCESS_TOKENS[access_token] = {
		client_id,
		refresh_token,
		gen_time: curr_time,
		scope: CODES[client_id].scope
	}

	// 发送 token
	return ctx.body = {
		err_code: 0,
		data: {
			access_token,
			refresh_token,
			token_type: "authorize",
			expires_in: 3600,
			user_id: 1,
			scope: CODES[client_id].scope
		}
	}
})

// 获取用户信息
router.post('/user/user_info', async ctx => {

	const curr_time = moment();
	// 获取用户id
	const { access_token, user_id } = ctx.request.body;

	// 参数校验
	if ( !access_token || !user_id ) {
		return ctx.body = { err_code: 10000, msg: '参数缺失' }
	}

	// 令牌校验
	if ( curr_time.diff(ACCESS_TOKENS[access_token].gen_time, 'seconds') > 3600 ) {
		return ctx.body = { err_code: 12000, msg: '令牌失效' }
	}

	// 返回用户信息
	ctx.body = {
		err_code: 0,
		data: mock.user_info.find(u => u.id === user_id)
	}
})


module.exports = router.routes();
