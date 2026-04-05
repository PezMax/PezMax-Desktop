<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="文件名称" prop="fileName">
        <el-input
            v-model="queryParams.fileName"
            placeholder="请输入文件名称"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文件大小" prop="fileSize">
        <el-input
            v-model="queryParams.fileSize"
            placeholder="请输入文件大小"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文件格式，如：pdf、doc、docx、zip等" prop="fileFormat">
        <el-input
            v-model="queryParams.fileFormat"
            placeholder="请输入文件格式，如：pdf、doc、docx、zip等"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文件年份，如：2024" prop="fileYear">
        <el-input
            v-model="queryParams.fileYear"
            placeholder="请输入文件年份，如：2024"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="科目" prop="fileSubject">
        <el-input
            v-model="queryParams.fileSubject"
            placeholder="请输入科目"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审核人" prop="reviewer">
        <el-input
            v-model="queryParams.reviewer"
            placeholder="请输入审核人"
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
            v-hasPermi="['datum:file:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['datum:file:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['datum:file:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['datum:file:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="fileList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文件ID，主键" align="center" prop="fileId" />
      <el-table-column label="上传用户ID" align="center" prop="userId" />
      <el-table-column label="文件名称" align="center" prop="fileName" />
      <el-table-column label="文件URL" align="center" prop="fileUrl" />
      <el-table-column label="文件大小" align="center" prop="fileSize" />
      <el-table-column label="文件格式，如：pdf、doc、docx、zip等" align="center" prop="fileFormat" />
      <el-table-column label="文件年份，如：2024" align="center" prop="fileYear" />
      <el-table-column label="文件类型：1-期末，2-期中，3-资料，4-补考，5-其他学校" align="center" prop="fileType" />
      <el-table-column label="科目" align="center" prop="fileSubject" />
      <el-table-column label="审核人" align="center" prop="reviewer" />
      <el-table-column label="文件状态：0-未审核，1-通过，2-未通过，3-被举报" align="center" prop="fileStatus" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['datum:file:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['datum:file:remove']">删除</el-button>
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

    <!-- 添加或修改试卷文件对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="fileRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="文件名称" prop="fileName">
              <el-input v-model="form.fileName" placeholder="请输入文件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="文件URL" prop="fileUrl">
              <el-input v-model="form.fileUrl" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="文件大小" prop="fileSize">
              <el-input v-model="form.fileSize" placeholder="请输入文件大小" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="文件格式，如：pdf、doc、docx、zip等" prop="fileFormat">
              <el-input v-model="form.fileFormat" placeholder="请输入文件格式，如：pdf、doc、docx、zip等" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="文件年份，如：2024" prop="fileYear">
              <el-input v-model="form.fileYear" placeholder="请输入文件年份，如：2024" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="科目" prop="fileSubject">
              <el-input v-model="form.fileSubject" placeholder="请输入科目" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="审核人" prop="reviewer">
              <el-input v-model="form.reviewer" placeholder="请输入审核人" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="删除标记：0-未删除，1-已删除" prop="delFlag">
              <el-input v-model="form.delFlag" placeholder="请输入删除标记：0-未删除，1-已删除" />
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

<script setup name="File">
import { listFile, getFile, delFile, addFile, updateFile } from "@main/api/datum/file"

const { proxy } = getCurrentInstance()

const fileList = ref([])
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
    fileName: null,
    fileUrl: null,
    fileSize: null,
    fileFormat: null,
    fileYear: null,
    fileType: null,
    fileSubject: null,
    reviewer: null,
    fileStatus: null,
  },
  rules: {
    fileName: [
      { required: true, message: "文件名称不能为空", trigger: "blur" }
    ],
    fileUrl: [
      { required: true, message: "文件URL不能为空", trigger: "blur" }
    ],
    fileSubject: [
      { required: true, message: "科目不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询试卷文件列表 */
function getList() {
  loading.value = true
  listFile(queryParams.value).then(response => {
    fileList.value = response.rows
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
    fileId: null,
    userId: null,
    fileName: null,
    fileUrl: null,
    fileSize: null,
    fileFormat: null,
    fileYear: null,
    fileType: null,
    fileSubject: null,
    reviewer: null,
    fileStatus: null,
    delFlag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("fileRef")
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
  ids.value = selection.map(item => item.fileId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加试卷文件"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _fileId = row.fileId || ids.value
  getFile(_fileId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改试卷文件"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["fileRef"].validate(valid => {
    if (valid) {
      if (form.value.fileId != null) {
        updateFile(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addFile(form.value).then(() => {
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
  const _fileIds = row.fileId || ids.value
  proxy.$modal.confirm('是否确认删除试卷文件编号为"' + _fileIds + '"的数据项？').then(function() {
    return delFile(_fileIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('datum/file/export', {
    ...queryParams.value
  }, `file_${new Date().getTime()}.xlsx`)
}

getList()
</script>
