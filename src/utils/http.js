// //axios基础封装
// import axios from "axios";

//  const httpInstance = axios.create({
//     baseURL: '',
//     timeout: 5000
//  })

//  //拦截器

//  //axios请求拦截器
//  httpInstance.interceptors.request.use(config => {
//     return config
//  }, e => Promise.reject(e))

//  //axios响应式拦截器
//  httpInstance.interceptors.response.use(res => res.data, e => {
//     return Promise.reject(e)
//  })

 
//  export default httpInstance

const axios = require("axios")

const httpInstance = axios.create({
  baseURL: '',
  timeout: 5000
})

// 请求拦截器
httpInstance.interceptors.request.use(config => {
  return config
}, e => Promise.reject(e))

// 响应拦截器
httpInstance.interceptors.response.use(res => res.data, e => {
  return Promise.reject(e)
})

module.exports = httpInstance
