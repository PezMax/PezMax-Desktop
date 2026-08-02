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
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="MagicStick"
            :loading="summarizingReports"
            @click="handleAISummarize()"
        >AI 摘要</el-button>
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
          <el-button link type="primary" icon="MagicStick" @click="handleAISummarize(scope.row)">AI 分析</el-button>
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

    <el-drawer v-model="summaryDrawerVisible" title="AI 举报审核摘要" size="480px" append-to-body>
      <div class="report-summary-panel">
        <el-alert
            v-if="reportSummary.summary"
            :title="reportSummary.summary"
            type="info"
            show-icon
            :closable="false"
        />
        <div class="risk-line">
          <span>整体风险</span>
          <el-tag :type="riskTagType(reportSummary.riskLevel)">
            {{ riskText(reportSummary.riskLevel) }}
          </el-tag>
        </div>
        <section v-for="item in reportSummary.reports || []" :key="item.report.reportId" class="summary-card">
          <div class="summary-head">
            <div>
              <h4>举报 #{{ item.report.reportId }}</h4>
              <p>文件 #{{ item.report.fileId || '-' }} / 用户 #{{ item.report.userId || '-' }}</p>
            </div>
            <el-tag :type="riskTagType(item.audit?.riskLevel)">
              {{ riskText(item.audit?.riskLevel) }}
            </el-tag>
          </div>
          <div class="summary-file" v-if="item.file">
            <strong>{{ item.file.fileName || '未知文件' }}</strong>
            <span>{{ item.file.fileSchool || '-' }} / {{ item.file.fileSubject || '未分类' }} / {{ item.file.fileYear || '未知年份' }}</span>
          </div>
          <div class="summary-block">
            <h5>审核建议</h5>
            <p>{{ item.audit?.reviewComment || item.audit?.suggestedAction || '暂无建议' }}</p>
          </div>
          <div class="summary-block" v-if="item.clues?.length">
            <h5>线索</h5>
            <p v-for="clue in item.clues" :key="clue">{{ clue }}</p>
          </div>
          <div class="summary-block" v-if="item.nextActions?.length">
            <h5>下一步</h5>
            <p v-for="action in item.nextActions" :key="action">{{ action }}</p>
          </div>
        </section>
        <div class="summary-block" v-if="reportSummary.suggestions?.length">
          <h5>处理建议</h5>
          <p v-for="tip in reportSummary.suggestions" :key="tip">{{ tip }}</p>
        </div>
        <el-empty v-if="!reportSummary.reports?.length" description="暂无摘要结果" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="Report">
import { listReport, getReport, delReport, addReport, updateReport } from "@/api/datum/report"
import { summarizeReportsByAgent } from "@/api/agent"

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
const summarizingReports = ref(false)
const summaryDrawerVisible = ref(false)
const reportSummary = ref({})

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

async function handleAISummarize(row) {
  summarizingReports.value = true
  try {
    const payload = row
      ? { reportId: Number(row.reportId) || 0 }
      : {
          fileId: queryParams.value.fileId ? Number(queryParams.value.fileId) : 0,
          userId: queryParams.value.userId ? Number(queryParams.value.userId) : 0,
          result: queryParams.value.result || '',
          pageNum: 1,
          pageSize: 10
        }
    const res = await summarizeReportsByAgent(payload)
    reportSummary.value = res.data || res
    summaryDrawerVisible.value = true
  } catch (error) {
    console.error('AI 举报摘要失败:', error)
  } finally {
    summarizingReports.value = false
  }
}

function riskTagType(level) {
  if (level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  if (level === 'low') return 'success'
  return 'info'
}

function riskText(level) {
  if (level === 'high') return '高风险'
  if (level === 'medium') return '中风险'
  if (level === 'low') return '低风险'
  return level || '未知'
}

getList()
</script>

<style scoped>
.report-summary-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.risk-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  font-weight: 650;
}
.summary-card {
  padding: 14px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
}
.summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.summary-head h4 {
  margin: 0 0 4px;
}
.summary-head p,
.summary-file span,
.summary-block p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}
.summary-file {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f7fa;
  margin-bottom: 12px;
}
.summary-block {
  margin-top: 12px;
}
.summary-block h5 {
  margin: 0 0 6px;
  color: #303133;
}
</style>
