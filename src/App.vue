<template>
  <div class="wrap">
    <vbt-table border
               stripe
               row-key="id"
               size="mini"
               isBigData
               isTreeTable
               show-summary
               highlight-hover-row
               max-height="600"
               :data="tableData">
      <vbt-table-column type="index"
                        width="100">
      </vbt-table-column>
      <vbt-table-column v-for="item in columns"
                        show-overflow-tooltip
                        :key="item.value"
                        :prop="item.value"
                        :label="item.label"
                        :width="item.width"
                        :fixed="item.value === 'id'">
        <template slot-scope="scope">
          <el-input v-if="item.value === 'name'"
                    size="mini"
                    v-model="scope.row[item.value]"
                    placeholder="name"></el-input>
          <span v-else>{{scope.row[item.value]}}</span>
        </template>
      </vbt-table-column>
    </vbt-table>

  </div>
</template>

<script>
import vbtTable from './bigTreeTable/table'
import vbtTableColumn from './bigTreeTable/table-column.js'

let _id = 0

function mockData(num, deep = 0) {
  const list = []

  for (let index = 0; index < num; index++) {
    const id = ++_id
    const mokeObj = {
      id,
      role: 'role_' + id,
      language: index % 2 === 0 ? 'zh_CN' : 'en_US',
      name: 'name_' + id,
      sex: index % 3 ? '男' : '女',
      age: 18,
      rate: 5,
      address: `地址 地址地址 地址地址 址地址址地址 址地址 址地址  址地址 址地址  址地址 址地址址地址址地址 地址${id}`
    }
    if (deep > 0) {
      mokeObj.children = mockData(10, deep - 1)
    }
    list.push(mokeObj)
  }
  return list
}

export default {
  components: { vbtTable, vbtTableColumn },

  data() {
    return {
      tableData: [],
      columns: [
        {
          label: 'ID',
          value: 'id',
          width: '200'
        },
        {
          label: 'Name',
          value: 'name',
          width: '200'
        },
        {
          label: 'sex',
          value: 'sex',
          width: '200'
        },
        {
          label: 'age',
          value: 'age',
          width: '200'
        },
        {
          label: 'role',
          value: 'role',
          width: '200'
        },
        {
          label: 'language',
          value: 'language',
          width: '200'
        },
        {
          label: 'Address',
          value: 'address',
          width: '300'
        }
      ]
    }
  },

  created() {
    setTimeout(() => {
        this.tableData = mockData(100, 2)
      }, 0)
  },

  methods: {
    // 设置父级初始值
    initParentFunc(row, treeData) {
      console.log(row, treeData)
    },

    formateChildFunc(row, parent, treeData) {
      console.log(row, parent, treeData)
    },

    load(row, resolve) {
      setTimeout(() => {
        resolve(mockData(15, 2))
      }, 100)

    }
  }
}
</script>

<style scoped>
.wrap {
  width: 100%;
  margin: 20px auto;
}
</style>

