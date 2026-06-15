import initSqlJs from 'sql.js'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs'

let db = null
let dbPath = null

async function getDb() {
  if (db) return db
  dbPath = join(app.getPath('userData'), 'ptmj-downloads.db')
  console.log('[download-db] 数据库路径:', dbPath)

  const SQL = await initSqlJs()

  // 尝试从已有文件加载，不存在则创建空库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
    console.log('[download-db] 从文件加载成功, 大小:', buffer.length)
  } else {
    db = new SQL.Database()
    console.log('[download-db] 文件不存在，已创建新数据库')
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run(`
    CREATE TABLE IF NOT EXISTS download_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      file_format TEXT DEFAULT '',
      file_subject TEXT DEFAULT '',
      file_year INTEGER DEFAULT NULL,
      file_type INTEGER DEFAULT NULL,
      local_path TEXT DEFAULT '',
      user_id INTEGER DEFAULT NULL,
      download_time TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  saveDb()
  console.log('[download-db] 数据库初始化完成')
  return db
}

// 持久化到磁盘（导出整个 DB 为 buffer 后写入文件）
function saveDb() {
  if (!db || !dbPath) return
  try {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  } catch (e) {
    console.error('[download-db] 保存数据库失败:', e)
  }
}

// 供外部显式调用：批量写入完成后一次性刷盘
export function flushDb() {
  saveDb()
  console.log('[download-db] 手动刷盘完成')
}

// 将 SELECT 结果转为对象数组
function execSelect(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// 插入一条下载记录
export async function insertDownloadRecord(record) {
  await getDb()
  const fileId = Number(record.fileId) || 0
  const userId = Number(record.userId) || null
  console.log('[download-db] 插入记录: fileId=', fileId, 'fileName=', record.fileName, 'userId=', userId)
  db.run(
    `INSERT INTO download_records (file_id, file_name, file_url, file_size, file_format, file_subject, file_year, file_type, local_path, user_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      fileId,
      record.fileName || '',
      record.fileUrl || '',
      Number(record.fileSize) || 0,
      record.fileFormat || '',
      record.fileSubject || '',
      record.fileYear != null ? Number(record.fileYear) : null,
      record.fileType != null ? Number(record.fileType) : null,
      record.localPath || '',
      userId
    ]
  )
  console.log('[download-db] 插入成功 (内存)')
}

// 查询下载记录（按 file_id 去重，保留最新一条），按时间倒序
export async function listDownloadRecords(userId) {
  await getDb()
  const uid = Number(userId) || null
  console.log('[download-db] 查询记录: userId=', uid)
  let rows
  if (uid) {
    rows = execSelect(
      `SELECT * FROM download_records
       WHERE id IN (SELECT MAX(id) FROM download_records WHERE user_id = ? GROUP BY file_id)
       ORDER BY download_time DESC`,
      [uid]
    )
  } else {
    rows = execSelect(
      `SELECT * FROM download_records
       WHERE id IN (SELECT MAX(id) FROM download_records GROUP BY file_id)
       ORDER BY download_time DESC`
    )
  }
  console.log('[download-db] 查询结果:', rows.length, '条')
  return rows
}

// 删除下载记录（通过 file_id 和 user_id）
export async function deleteDownloadRecord(userId, fileId) {
  await getDb()
  const uid = Number(userId) || null
  const fid = Number(fileId) || 0
  console.log('[download-db] 删除记录: userId=', uid, 'fileId=', fid)
  db.run('DELETE FROM download_records WHERE user_id = ? AND file_id = ?', [uid, fid])
  saveDb()
  const remaining = execSelect('SELECT COUNT(*) as cnt FROM download_records WHERE user_id = ? AND file_id = ?', [uid, fid])
  console.log('[download-db] 删除后剩余匹配:', remaining[0]?.cnt || 0)
}

// 检查本地文件是否存在
export function checkLocalFileExists(filePath) {
  if (!filePath) return false
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

// 通过 file_id 查询记录
export async function getRecordByFileId(userId, fileId) {
  await getDb()
  const uid = Number(userId) || null
  const fid = Number(fileId) || 0
  const rows = execSelect('SELECT * FROM download_records WHERE user_id = ? AND file_id = ?', [uid, fid])
  return rows[0] || null
}

// 关闭数据库连接（app quit 时调用）
export function closeDatabase() {
  if (db) {
    console.log('[download-db] 关闭数据库')
    saveDb()
    db.close()
    db = null
  }
}
