const Koa = require('koa');
const views = require('koa-views') // 模版渲染中间件
const serve = require('koa-static') // 静态资源中间件
const path = require('path') // 路径解析
const bodyParser = require('koa-bodyparser') //parse中间件
const router = require('./router')

// 构建koa实例
const app = new Koa();
// 指定端口
const port = 8000;

// 加载模版引擎
app.use(views(path.join(__dirname, './views'), {
	extension: 'ejs'
}))

//使用解析上下文插件
app.use(bodyParser())

// 静态资源配置
app.use(serve(path.join(__dirname)))


// 路由配置
app.use(router)


app.listen(port, () => {
	console.log(`server is running at port ${port}`)
});
