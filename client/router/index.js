const Router = require('koa-router') // 路由中间件
const router = new Router()  // 实例化
const request = require('request'); //发送请求

// 用户信息
let user_info = {}

// 首页
router.get('/', async ctx => {
	await ctx.render('index', {
		state: 'x2x',
		redirect_uri: 'http://localhost:8000/auth/callback'
	})
})

// 登录成功页
router.get('/home', async ctx => {
	await ctx.render('home', {
		...user_info
	})
})

// 授权成功后，回调地址，携带code
router.get('/auth/callback', async ctx => {
	// 获取服务器发放的code，并保存
	const { code, state } = ctx.query;

	if ( state !== 'x2x' ) return ctx.body = 'state 已被篡改'

	// 通过 code 向服务器换取 access_token
	let response = await get_access_token(code)
	const { access_token , user_id } = response;

	// 通过 access_token 和 用户 id 获取 用户信息
	user_info = await get_user_info({ access_token , user_id })

	// 重定向到首页
	ctx.redirect('/home')
})


// 获取服务端的 令牌
function get_access_token (code) {
	return new Promise(resolve => {
		request('http://localhost:3000/oauth2/access_token', {
			method: 'POST',
			headers: {//设置请求头
				"content-type": "application/json",
			},
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code,
				client_id: 'xc0218ng923jf73',
				client_secret: 'xcs38nhg302kg9sdf2l8g',
				redirect_uri: 'http://localhost:8000/auth/callback'
			})
		}, function (error, response, body) {
			body = JSON.parse(body)
			const { err_code } = body;
			// 异常处理
			if ( err_code !== 0 ) return body.msg;
			// 获取返回结果
			resolve(body.data)
		})
	})
}

// 请求获取用户信息
function get_user_info(data){
	return new Promise(resolve => {
		request('http://localhost:3000/user/user_info',{
			method: 'POST',
			headers: {//设置请求头
				"content-type": "application/json",
			},
			body: JSON.stringify({
				access_token : data.access_token ,
				user_id : data.user_id
			})
		},function (error, response, body) {

			body = JSON.parse(body)
			const { err_code } = body;
			// 异常处理
			if ( err_code !== 0 ) return body.msg;
			// 获取返回结果
			resolve(body.data)
		})
	})
}


module.exports = router.routes();
