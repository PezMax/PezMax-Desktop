<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户账号" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户账号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="queryParams.password"
          placeholder="请输入密码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="头像地址" prop="avatar">
        <el-input
          v-model="queryParams.avatar"
          placeholder="请输入头像地址"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="上传文件数量" prop="count">
        <el-input
          v-model="queryParams.count"
          placeholder="请输入上传文件数量"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建者" prop="creatBy">
        <el-input
          v-model="queryParams.creatBy"
          placeholder="请输入创建者"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['datum:user:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['datum:user:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['datum:user:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['datum:user:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户id" align="center" prop="userId" />
      <el-table-column label="用户账号" align="center" prop="userName" />
      <el-table-column label="密码" align="center" prop="password" />
      <el-table-column label="头像地址" align="center" prop="avatar" />
      <el-table-column label="上传文件数量" align="center" prop="count" />
      <el-table-column label="账号状态" align="center" prop="status" />
      <el-table-column label="创建者" align="center" prop="creatBy" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['datum:user:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['datum:user:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改平台用户对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="userRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="用户账号" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户账号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入密码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="头像地址" prop="avatar">
              <el-input v-model="form.avatar" placeholder="请输入头像地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="上传文件数量" prop="count">
              <el-input v-model="form.count" placeholder="请输入上传文件数量" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="创建者" prop="creatBy">
              <el-input v-model="form.creatBy" placeholder="请输入创建者" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="User">
import { ref, reactive, toRefs } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const userRef = ref(null)
const queryRef = ref(null)

const userList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: null,
    password: null,
    avatar: null,
    count: null,
    status: null,
    creatBy: null,
  },
  rules: {
    userName: [
      { required: true, message: "用户账号不能为空", trigger: "blur" }
    ],
    password: [
      { required: true, message: "密码不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询平台用户列表 */
async function getList() {
  loading.value = true
  const data = await window.electronAPI.callApi('listUser', JSON.parse(JSON.stringify(queryParams.value)))
  userList.value = data.rows || []
  total.value = data.total || 0
  loading.value = false
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    userId: null,
    userName: null,
    password: null,
    avatar: null,
    count: null,
    status: null,
    creatBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  userRef.value?.resetFields()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryRef.value?.resetFields()
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加平台用户"
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset()
  const _userId = row.userId || ids.value
  const response = await window.electronAPI.callApi('getUser', _userId)
  form.value = response.data
  open.value = true
  title.value = "修改平台用户"
}

/** 提交按钮 */
function submitForm() {
  userRef.value?.validate(async valid => {
    if (valid) {
      if (form.value.userId != null) {
        await window.electronAPI.callApi('updateUser', JSON.parse(JSON.stringify(form.value)))
        ElMessage.success("修改成功")
      } else {
        await window.electronAPI.callApi('addUser', JSON.parse(JSON.stringify(form.value)))
        ElMessage.success("新增成功")
      }
      open.value = false
      getList()
    }
  })
}

/** 删除按钮操作 */
async function handleDelete(row) {
  const _userIds = row.userId || ids.value
  try {
    await ElMessageBox.confirm('是否确认删除平台用户编号为"' + _userIds + '"的数据项？')
    await window.electronAPI.callApi('delUser', _userIds)
    getList()
    ElMessage.success("删除成功")
  } catch {}
}

/** 导出按钮操作 */
function handleExport() {
  // TODO: 导出功能待实现
  ElMessage.info('导出功能暂未实现')
}

getList()
</script>
