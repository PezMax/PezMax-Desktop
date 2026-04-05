<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="被举报文件id" prop="fileId">
        <el-input
            v-model="queryParams.fileId"
            placeholder="请输入被举报文件id"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="举报用户id" prop="userId">
        <el-input
            v-model="queryParams.userId"
            placeholder="请输入举报用户id"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审核结果" prop="result">
        <el-input
            v-model="queryParams.result"
            placeholder="请输入审核结果"
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
            v-hasPermi="['datum:report:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['datum:report:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['datum:report:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['datum:report:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="reportList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="举报id" align="center" prop="reportId" />
      <el-table-column label="被举报文件id" align="center" prop="fileId" />
      <el-table-column label="举报用户id" align="center" prop="userId" />
      <el-table-column label="被举报原因" align="center" prop="reason" />
      <el-table-column label="审核结果" align="center" prop="result" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['datum:report:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['datum:report:remove']">删除</el-button>
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

    <!-- 添加或修改举报对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="reportRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="被举报文件id" prop="fileId">
              <el-input v-model="form.fileId" placeholder="请输入被举报文件id" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="举报用户id" prop="userId">
              <el-input v-model="form.userId" placeholder="请输入举报用户id" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="被举报原因" prop="reason">
              <el-input v-model="form.reason" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="审核结果" prop="result">
              <el-input v-model="form.result" placeholder="请输入审核结果" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="Report">
import { listReport, getReport, delReport, addReport, updateReport } from "@main/api/datum/report"

const { proxy } = getCurrentInstance()

const reportList = ref([])
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
    fileId: null,
    userId: null,
    reason: null,
    result: null,
  },
  rules: {
    fileId: [
      { required: true, message: "被举报文件id不能为空", trigger: "blur" }
    ],
    userId: [
      { required: true, message: "举报用户id不能为空", trigger: "blur" }
    ],
    reason: [
      { required: true, message: "被举报原因不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询举报列表 */
function getList() {
  loading.value = true
  listReport(queryParams.value).then(response => {
    reportList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    reportId: null,
    fileId: null,
    userId: null,
    reason: null,
    result: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("reportRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.reportId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加举报"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _reportId = row.reportId || ids.value
  getReport(_reportId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改举报"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["reportRef"].validate(valid => {
    if (valid) {
      if (form.value.reportId != null) {
        updateReport(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addReport(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _reportIds = row.reportId || ids.value
  proxy.$modal.confirm('是否确认删除举报编号为"' + _reportIds + '"的数据项？').then(function() {
    return delReport(_reportIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('datum/report/export', {
    ...queryParams.value
  }, `report_${new Date().getTime()}.xlsx`)
}

getList()
</script>
