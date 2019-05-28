import Vue from 'vue'
import App from './App.vue'

import './plugins/element'
import './style/index.scss'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
