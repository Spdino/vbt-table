
<h1 align="center">Welcome to vbt-Table  👋</h1>
<p align="center">一款基于element-ui(2.9.1)扩展的支持树形表格的大数据表格组件</p> 
<p align="center">
 <img src="https://img.shields.io/bundlephobia/minzip/vbt-table.svg" />
 <img src="https://img.shields.io/david/Spdino/vbt-table.svg" />
</p>

<h1></h1>

### 📅 说明
- 渲染树形数据时，必须要指定 row-key和isTreeTable属性， row 中包含 children字段。
- 支持子节点数据异步加载。设置 Table 的 lazy 属性为 true 与加载函数 load 。通过指定 row 中的 hasChildren 字段来指定哪些行是包含子节点。
- children 与 hasChildren 都可以通过 tree-props 配置。
- 大数据滚动渲染需指定isBigData属性,支持树形表格大数据.
- 其它用法和elment-ui的table组件一样


## 🎲 新增 Table Attributes
| 参数      | 说明          | 参数 | 类型      | 可选值                           | 默认值  |
|---------- |-------------- | ---- |---------- |--------------------------------  |-------- |
| initParentFunc | 用于初始化父级树形表格数据时处理数据| row,treeData | Function | — | — |
| formateChildFunc  | 展示子级树形表格数据时处理数据 | row,parentRow,treeData | Function | — | — |
| isBigData | 大数据滚动渲染| — | Boolean | — | — |
| isTreeTable  | 树形表格 | — | Boolean | — | — |
| scrollYRenderConfig  | 大数据滚动的配置选项 | — | Object | renderSize：一次渲染多少条数据；offsetSize：预渲染多少条数据 | { renderSize: 30, offsetSize: 10 } |

- initParentFunc方法，用于初始化父级树形表格数据时处理数据，抛出当前处理的父级rowData和树形设置属性对象（当传入的data发生变化时执行）

```
 // 设置父级初始值
    initParentFunc(row,treeData) {
      console.log(row，treeData)
        row.disabled = true
    },
```

- formateChildFunc方法，用于初始化子级树形表格数据时处理数据，抛出当前处理的子级rowData和parentRow，treeData（当展开子级动作发生时执行）


```
    formateChildFunc(row, parent，treeData) {
     console.log(row,parent，treeData)
     if(parent.name) row.name = parent.name
    },
```



## ✨ Demo
##### 1.大数据支持
- 效果
![images command](public/1.gif)

##### 2.大数据树形表格支持
- 效果
![images command](public/2.gif)


##### 3.大数据树形表格懒加载支持
- 效果
![images command](public/3.gif)

## 🐶 code
```
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
      <vbt-table-column v-for="item in columns"
                        show-overflow-tooltip
                        expanded
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

function mockData(num,deep=0) {
  const list = []

  for (let index = 0; index < num; index++) {
    const id = ++_id
    const mokeObj = {
      id,
      role: 'role_' + id,
      language: index % 2 === 0 ? 'zh_CN' : 'en_US',
      name: 'name_' + id ,
      sex: index % 3 ? '男' : '女',
      age: 18,
      rate: 5,
      address: `地址 地址地址 地址地址 址地址址地址 址地址 址地址  址地址 址地址  址地址 址地址址地址址地址 地址${id}`
    }
    if(deep>0) {
      mokeObj.children = mockData(10,deep-1)
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
    this.tableData = mockData(10,2)
  },

  methods: {
    // 设置父级初始值
    initParentFunc(row,treeData) {
      console.log(row,treeData)
    },

    formateChildFunc(row, parent,treeData) {
      console.log(row,parent,treeData)
    },


    load(row, resolve) {
      setTimeout(() => {
        resolve(mockData(15, 2))
      }, 100)

    }
  }
}
</script>

```
## Show your support

Give a ⭐️ if this project helped you!
