import vbtTable from './bigTreeTable/table.vue'
import vbtTableColumn from './bigTreeTable/table-column'

const components = [vbtTable,vbtTableColumn]

const install = function(Vue) {
  components.forEach(component => {
    Vue.component(component.name, component);
  })
};

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default {
  install,
  vbtTable,
  vbtTableColumn
}