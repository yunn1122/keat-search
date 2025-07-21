import { createRouter, createWebHistory } from 'vue-router'

import Front from '@/views/Front/index.vue'
import MyCourse from '@/views/MyCourse/index.vue'
import FindCourse from '@/views/FindCourse/index.vue'
import SearchResult from '@/views/SearchResult/index.vue'
import LearnCourse from '@/views/LearnCourse/index.vue'

import NotFound from '@/views/PageNotFound/index.vue'

import Test from '@/views/Test/index.vue'
import UserStudyForm from '@/views/UserStudyForm/index.vue'
import Instruction from '@/views/Instruction/index.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      //name: 'home',
      component: Front,
      children:[
        {
          path:'mycourse',
          component: MyCourse
        },
        // {
        //   path:'findcourse',
        //   component: FindCourse
        // },
        
      ]
    },
    {
      path:'/search',
      name: 'SearchView',
      component: SearchResult,
    },
    {
           path:'/course/:id',
          //path:'/course',
          name: 'CourseDetail',
          component:LearnCourse
        },
        {
          path:'/courses',
          name:'CoursesList',
          component:FindCourse,
        },
        {
          path:'/test',
          component:Test,
        },
        {
          path:'/questionnaire',
          component:UserStudyForm,
        },
        {
          path:'/instruction',
          component:Instruction,
        },
          {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: NotFound,
          }

    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],

  // scrollBehavior(to, from, savedPosition) {
  //   if (savedPosition) {
  //     return savedPosition
  //   }
  //   if (to.hash) {
  //     return new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve({ el: to.hash, behavior: 'smooth' })
  //       }, 500)
  //     })
  //   }
  //   return { top: 0 }
  // },
});




export default router
