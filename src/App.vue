<template>
  <div class="wrap">
    <vxe-table border
               stripe
               :tree-config="{key: 'id', children: 'children',trigger:'cell'}"
               size="mini"
               highlight-hover-row
               show-all-overflow
               max-height="600"
               :data.sync="tableData">
      <vxe-table-column prop="name"
                        label="Name"
                        tree-node
                        width="200"
                        fixed="left"></vxe-table-column>
      <vxe-table-column prop="sex"
                        label="Sex"
                        width="200"></vxe-table-column>
      <vxe-table-column prop="age"
                        label="Age"
                        width="200"></vxe-table-column>
      <vxe-table-column prop="role"
                        label="role"
                        width="200"></vxe-table-column>
      <vxe-table-column prop="language"
                        label="language"
                        width="200"></vxe-table-column>
      <vxe-table-column prop="rate"
                        label="rate"
                        fixed="right"
                        width="200"></vxe-table-column>
      <vxe-table-column prop="address"
                        label="Address"
                        width="300"></vxe-table-column>
    </vxe-table>
  </div>
</template>

<script>
import vxeTable from './components/table/table.js'
import vxeTableColumn from './components/column/column.js'
import XEUtils from 'xe-utils'

function mockData(num, cId) {
  let fullIndex = 1
  const list = []
  for (let index = 0; index < num; index++) {
    fullIndex++
    cId && (cId = Number(cId) + 1)
    list.push({
      id: cId || fullIndex,
      children: !cId ? mockData(30, `${fullIndex}0000000`) : [],
      role: 'role_' + fullIndex,
      language: index % 2 === 0 ? 'zh_CN' : 'en_US',
      name: 'name_' + fullIndex,
      sex: index % 3 ? '0' : '1',
      age: XEUtils.random(18, 35),
      rate: XEUtils.random(0, 5),
      address: `地址 地址地址 地址地址 址地址址地址 址地址 址地址  址地址 址地址  址地址 址地址址地址址地址 地址${index}`
    })
  }
  return list
}
export default {
  components: { vxeTable, vxeTableColumn },
  data() {
    return {
      tableData: mockData(1000)
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

