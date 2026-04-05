<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="通知标题" prop="title">
        <el-input
            v-model="queryParams.title"
            placeholder="请输入通知标题"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="排序/优先级" prop="sort">
        <el-input
            v-model="queryParams.sort"
            placeholder="请输入排序/优先级"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="展示形态" prop="displayMode">
        <el-input
            v-model="queryParams.displayMode"
            placeholder="请输入展示形态"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="需要的最低版本号" prop="appVersionMin">
        <el-input
            v-model="queryParams.appVersionMin"
            placeholder="请输入需要的最低版本号"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="最新版本号" prop="latestVersion">
        <el-input
            v-model="queryParams.latestVersion"
            placeholder="请输入最新版本号"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否强制更新" prop="forceUpdate">
        <el-input
            v-model="queryParams.forceUpdate"
            placeholder="请输入是否强制更新"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="故障开始时间" prop="faultStartTime">
        <el-date-picker clearable
                        v-model="queryParams.faultStartTime"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择故障开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="故障结束时间" prop="faultEndTime">
        <el-date-picker clearable
                        v-model="queryParams.faultEndTime"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择故障结束时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="维护开始时间" prop="maintenanceStartTime">
        <el-date-picker clearable
                        v-model="queryParams.maintenanceStartTime"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择维护开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="维护结束时间" prop="maintenanceEndTime">
        <el-date-picker clearable
                        v-model="queryParams.maintenanceEndTime"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择维护结束时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="维护提前提醒分钟数" prop="remindBeforeMinutes">
        <el-input
            v-model="queryParams.remindBeforeMinutes"
            placeholder="请输入维护提前提醒分钟数"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="接收被举报下架通知用户的id" prop="uploadUserId">
        <el-input
            v-model="queryParams.uploadUserId"
            placeholder="请输入接收被举报下架通知用户的id"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="被举报下架的资料的id" prop="materialId">
        <el-input
            v-model="queryParams.materialId"
            placeholder="请输入被举报下架的资料的id"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="滚动日常通知展示开始时间，可为空即立即开始" prop="publishStart">
        <el-date-picker clearable
                        v-model="queryParams.publishStart"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择滚动日常通知展示开始时间，可为空即立即开始">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="滚动日常通知展示结束时间，可为空，一直到管理员手动关" prop="publishEnd">
        <el-date-picker clearable
                        v-model="queryParams.publishEnd"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择滚动日常通知展示结束时间，可为空，一直到管理员手动关">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="滚动时间间隔" prop="scrollTimeInterval">
        <el-input
            v-model="queryParams.scrollTimeInterval"
            placeholder="请输入滚动时间间隔"
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
            v-hasPermi="['datum:notification:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['datum:notification:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['datum:notification:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['datum:notification:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="notificationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="通知主键" align="center" prop="notifyId" />
      <el-table-column label="通知类型" align="center" prop="notifyType" />
      <el-table-column label="通知标题" align="center" prop="title" />
      <el-table-column label="通知正文" align="center" prop="content" />
      <el-table-column label="配置状态" align="center" prop="status" />
      <el-table-column label="排序/优先级" align="center" prop="sort" />
      <el-table-column label="展示形态" align="center" prop="displayMode" />
      <el-table-column label="需要的最低版本号" align="center" prop="appVersionMin" />
      <el-table-column label="最新版本号" align="center" prop="latestVersion" />
      <el-table-column label="是否强制更新" align="center" prop="forceUpdate" />
      <el-table-column label="更新下载地址" align="center" prop="updateDownloadUrl" />
      <el-table-column label="故障开始时间" align="center" prop="faultStartTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.faultStartTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="故障结束时间" align="center" prop="faultEndTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.faultEndTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="维护开始时间" align="center" prop="maintenanceStartTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.maintenanceStartTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="维护结束时间" align="center" prop="maintenanceEndTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.maintenanceEndTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="维护提前提醒分钟数" align="center" prop="remindBeforeMinutes" />
      <el-table-column label="接收被举报下架通知用户的id" align="center" prop="uploadUserId" />
      <el-table-column label="被举报下架的资料的id" align="center" prop="materialId" />
      <el-table-column label="保存下架资料的标题，防止原资料删除后无法展示" align="center" prop="materialTitleSnapshot" />
      <el-table-column label="滚动日常通知展示开始时间，可为空即立即开始" align="center" prop="publishStart" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.publishStart, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="滚动日常通知展示结束时间，可为空，一直到管理员手动关" align="center" prop="publishEnd" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.publishEnd, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="滚动时间间隔" align="center" prop="scrollTimeInterval" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['datum:notification:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['datum:notification:remove']">删除</el-button>
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

    <!-- 添加或修改通知对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="notificationRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="通知标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入通知标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="通知正文">
              <editor v-model="form.content" :min-height="192"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="排序/优先级" prop="sort">
              <el-input v-model="form.sort" placeholder="请输入排序/优先级" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="展示形态" prop="displayMode">
              <el-input v-model="form.displayMode" placeholder="请输入展示形态" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="需要的最低版本号" prop="appVersionMin">
              <el-input v-model="form.appVersionMin" placeholder="请输入需要的最低版本号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="最新版本号" prop="latestVersion">
              <el-input v-model="form.latestVersion" placeholder="请输入最新版本号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="是否强制更新" prop="forceUpdate">
              <el-input v-model="form.forceUpdate" placeholder="请输入是否强制更新" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="更新下载地址" prop="updateDownloadUrl">
              <el-input v-model="form.updateDownloadUrl" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="故障开始时间" prop="faultStartTime">
              <el-date-picker clearable
                              v-model="form.faultStartTime"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择故障开始时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="故障结束时间" prop="faultEndTime">
              <el-date-picker clearable
                              v-model="form.faultEndTime"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择故障结束时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维护开始时间" prop="maintenanceStartTime">
              <el-date-picker clearable
                              v-model="form.maintenanceStartTime"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择维护开始时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维护结束时间" prop="maintenanceEndTime">
              <el-date-picker clearable
                              v-model="form.maintenanceEndTime"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择维护结束时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维护提前提醒分钟数" prop="remindBeforeMinutes">
              <el-input v-model="form.remindBeforeMinutes" placeholder="请输入维护提前提醒分钟数" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="接收被举报下架通知用户的id" prop="uploadUserId">
              <el-input v-model="form.uploadUserId" placeholder="请输入接收被举报下架通知用户的id" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="被举报下架的资料的id" prop="materialId">
              <el-input v-model="form.materialId" placeholder="请输入被举报下架的资料的id" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="保存下架资料的标题，防止原资料删除后无法展示" prop="materialTitleSnapshot">
              <el-input v-model="form.materialTitleSnapshot" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="滚动日常通知展示开始时间，可为空即立即开始" prop="publishStart">
              <el-date-picker clearable
                              v-model="form.publishStart"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择滚动日常通知展示开始时间，可为空即立即开始">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="滚动日常通知展示结束时间，可为空，一直到管理员手动关" prop="publishEnd">
              <el-date-picker clearable
                              v-model="form.publishEnd"
                              type="date"
                              value-format="YYYY-MM-DD"
                              placeholder="请选择滚动日常通知展示结束时间，可为空，一直到管理员手动关">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="滚动时间间隔" prop="scrollTimeInterval">
              <el-input v-model="form.scrollTimeInterval" placeholder="请输入滚动时间间隔" />
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

<script setup name="Notification">
import { listNotification, getNotification, delNotification, addNotification, updateNotification } from "@main/api/datum/notification"

const { proxy } = getCurrentInstance()

const notificationList = ref([])
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
    notifyType: null,
    title: null,
    content: null,
    status: null,
    sort: null,
    displayMode: null,
    appVersionMin: null,
    latestVersion: null,
    forceUpdate: null,
    updateDownloadUrl: null,
    faultStartTime: null,
    faultEndTime: null,
    maintenanceStartTime: null,
    maintenanceEndTime: null,
    remindBeforeMinutes: null,
    uploadUserId: null,
    materialId: null,
    materialTitleSnapshot: null,
    publishStart: null,
    publishEnd: null,
    scrollTimeInterval: null,
  },
  rules: {
    notifyType: [
      { required: true, message: "通知类型不能为空", trigger: "change" }
    ],
    title: [
      { required: true, message: "通知标题不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "配置状态不能为空", trigger: "change" }
    ],
    sort: [
      { required: true, message: "排序/优先级不能为空", trigger: "blur" }
    ],
    displayMode: [
      { required: true, message: "展示形态不能为空", trigger: "blur" }
    ],
    forceUpdate: [
      { required: true, message: "是否强制更新不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询通知列表 */
function getList() {
  loading.value = true
  listNotification(queryParams.value).then(response => {
    notificationList.value = response.rows
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
    notifyId: null,
    notifyType: null,
    title: null,
    content: null,
    status: null,
    sort: null,
    displayMode: null,
    appVersionMin: null,
    latestVersion: null,
    forceUpdate: null,
    updateDownloadUrl: null,
    faultStartTime: null,
    faultEndTime: null,
    maintenanceStartTime: null,
    maintenanceEndTime: null,
    remindBeforeMinutes: null,
    uploadUserId: null,
    materialId: null,
    materialTitleSnapshot: null,
    publishStart: null,
    publishEnd: null,
    scrollTimeInterval: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("notificationRef")
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
  ids.value = selection.map(item => item.notifyId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加通知"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _notifyId = row.notifyId || ids.value
  getNotification(_notifyId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改通知"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["notificationRef"].validate(valid => {
    if (valid) {
      if (form.value.notifyId != null) {
        updateNotification(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addNotification(form.value).then(() => {
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
  const _notifyIds = row.notifyId || ids.value
  proxy.$modal.confirm('是否确认删除通知编号为"' + _notifyIds + '"的数据项？').then(function() {
    return delNotification(_notifyIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('datum/notification/export', {
    ...queryParams.value
  }, `notification_${new Date().getTime()}.xlsx`)
}

getList()
</script>
