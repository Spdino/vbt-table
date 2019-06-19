<template>
  <div class="wrap">
    <vbt-table border
               stripe
               :initParentFunc="initParentFunc"
               :formateChildFunc="formateChildFunc"
               row-key="id"
               size="mini"
               isBigData
               lazy
               :load="load"
               highlight-hover-row
               max-height="600"
               :data="tableData">
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

    <el-button type="primary" @click="save">保存</el-button>
  </div>
</template>

<script>
import vbtTable from './bigTreeTable/table'
import vbtTableColumn from './bigTreeTable/table-column.js'

function mockData(num, cId) {
  let fullIndex = 0
  const list = []
  for (let index = 0; index < num; index++) {
    fullIndex++
    cId && (cId = Number(cId) + 1)
    list.push({
      id: cId || fullIndex,
      // hasChildren: cId ? false : true,
      children: !cId ? mockData(15, `${fullIndex}0000000`) : [],
      role: 'role_' + fullIndex,
      language: index % 2 === 0 ? 'zh_CN' : 'en_US',
      name: !cId ? 'name_' + fullIndex : '',
      sex: index % 3 ? '男' : '女',
      age: 18,
      rate: 5,
      address: `地址 地址地址 地址地址 址地址址地址 址地址 址地址  址地址 址地址  址地址 址地址址地址址地址 地址${index}`
    })
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
          value: 'Sex',
          width: '200'
        },
        {
          label: 'age',
          value: 'Age',
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
    this.tableData = mockData(1000)
  },

  methods: {
    save() {
      console.log(this.tableData)
    },
    // 设置父级初始值
    initParentFunc(row) {
      console.log(row)
    },

    formateChildFunc(row, parent) {
      if (parent.name) row.name = parent.name
    },

    load(row, resolve) {
      resolve(mockData(15, `${row.id}000`))
    }
  }
}
</script>

<style scoped>
.wrap {
  width: 1200px;
  margin: 20px auto;
}
</style>

