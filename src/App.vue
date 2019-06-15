<template>
  <div class="wrap">
    <vbt-table border
               stripe
               row-key="id"
               size="mini"
               lazy
    :load="load"
               highlight-hover-row
               max-height="600"
               :data="tableData">
      <vbt-table-column prop="id"
                        label="ID"
                        width="200"
                        fixed="left">
      </vbt-table-column>
      <vbt-table-column prop="name"
                        label="Name"
                        width="200">
      </vbt-table-column>
      <vbt-table-column prop="sex"
                        label="Sex"
                        width="200">
        <template slot-scope="scoped">
          <el-input v-model="scoped.row['sex']"
                    size="mini"
                    placeholder="111"></el-input>
        </template>
      </vbt-table-column>
      <vbt-table-column prop="age"
                        label="Age"
                        width="200"></vbt-table-column>
      <vbt-table-column prop="role"
                        label="role"
                        width="200"></vbt-table-column>
      <vbt-table-column prop="language"
                        label="language"
                        width="200"></vbt-table-column>
      <vbt-table-column prop="rate"
                        label="rate"
                        width="200"></vbt-table-column>
      <vbt-table-column prop="address"
                        label="Address"
                        fixed="right"
                        show-overflow-tooltip
                        min-width="300"></vbt-table-column>
    </vbt-table>
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
      hasChildren: cId > 1000000 ? false :true,
      // children: !cId ? mockData(30, `${fullIndex}0000000`) : [],
      role: 'role_' + fullIndex,
      language: index % 2 === 0 ? 'zh_CN' : 'en_US',
      name: 'name_' + fullIndex,
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
      tableData: mockData(1000)
    }
  },

  methods:{
    load(row,resolve) {
      setTimeout(() => {
        resolve(mockData(30, `${row.id}000`))
      },1000)
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

