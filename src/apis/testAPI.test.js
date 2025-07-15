const httpInstance = require ('../utils/http')

const MockAdapter = require('axios-mock-adapter')

describe('httpInstance axios 封装测试', () => {
  const mock = new MockAdapter(httpInstance)

  afterEach(() => {
    mock.reset()
  })

  test('应返回拦截器处理后的响应数据', async () => {
    mock.onGet('/hello').reply(200, { msg: 'hi' })

    const data = await httpInstance.get('/hello')

    expect(data).toEqual({ msg: 'hi' }) // 因为响应拦截器返回了 response.data
  })

  test('应捕获网络错误', async () => {
    mock.onGet('/fail').networkError()

    await expect(httpInstance.get('/fail')).rejects.toThrow()
  })
})