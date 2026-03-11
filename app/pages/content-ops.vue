<template>
  <main class="page">
    <section class="hero card">
      <div>
        <p class="eyebrow">
          Methodist tools
        </p>
        <h1>Content Ops</h1>
        <p class="subtitle">
          Knowledge graph, content import and safe fixture cleanup in one place.
        </p>
      </div>
      <span
        class="badge"
        :class="isProdLike ? 'badge--prod' : 'badge--dev'"
      >
        {{ isProdLike ? 'prod-like' : 'dev/local' }}
      </span>
    </section>

    <section class="card">
      <header class="section-head">
        <h2>Knowledge Graph</h2>
        <button
          class="btn btn--ghost"
          :disabled="isBusy"
          @click="loadCatalog"
        >
          Refresh catalog
        </button>
      </header>

      <div class="triple-grid">
        <article class="sub-card">
          <h3>Subjects</h3>
          <form
            class="form"
            @submit.prevent="createSubject"
          >
            <input
              v-model="subjectCode"
              type="text"
              placeholder="code (math_v28)"
              required
            >
            <input
              v-model="subjectName"
              type="text"
              placeholder="name"
              required
            >
            <button
              class="btn"
              :disabled="isBusy"
              type="submit"
            >
              Create subject
            </button>
          </form>
          <ul class="list">
            <li
              v-for="item in subjects"
              :key="item.code"
            >
              <strong>{{ item.code }}</strong> · {{ item.name }}
            </li>
          </ul>
        </article>

        <article class="sub-card">
          <h3>Topics</h3>
          <form
            class="form"
            @submit.prevent="createTopic"
          >
            <input
              v-model="topicCode"
              type="text"
              placeholder="code (MV28-T1)"
              required
            >
            <input
              v-model="topicSubjectCode"
              type="text"
              placeholder="subject_code"
              required
            >
            <input
              v-model.number="topicGrade"
              type="number"
              min="1"
              max="11"
              placeholder="grade"
              required
            >
            <input
              v-model="topicName"
              type="text"
              placeholder="name"
              required
            >
            <button
              class="btn"
              :disabled="isBusy"
              type="submit"
            >
              Create topic
            </button>
          </form>
          <ul class="list">
            <li
              v-for="item in topics"
              :key="item.code"
            >
              <strong>{{ item.code }}</strong> · {{ item.subject_code }} · g{{ item.grade }}
            </li>
          </ul>
        </article>

        <article class="sub-card">
          <h3>Micro-skills</h3>
          <form
            class="form"
            @submit.prevent="createMicroSkill"
          >
            <input
              v-model="skillNodeId"
              type="text"
              placeholder="node_id (MV28-N1)"
              required
            >
            <input
              v-model="skillSubjectCode"
              type="text"
              placeholder="subject_code"
              required
            >
            <input
              v-model="skillTopicCode"
              type="text"
              placeholder="topic_code"
              required
            >
            <input
              v-model.number="skillGrade"
              type="number"
              min="1"
              max="11"
              placeholder="grade"
              required
            >
            <input
              v-model="skillSectionCode"
              type="text"
              placeholder="section_code"
              required
            >
            <input
              v-model="skillSectionName"
              type="text"
              placeholder="section_name"
              required
            >
            <input
              v-model="skillName"
              type="text"
              placeholder="micro_skill_name"
              required
            >
            <input
              v-model="skillPredecessorCsv"
              type="text"
              placeholder="predecessor_ids csv"
            >
            <div class="row">
              <select v-model="skillCriticality">
                <option value="low">
                  low
                </option>
                <option value="medium">
                  medium
                </option>
                <option value="high">
                  high
                </option>
              </select>
              <select v-model="skillStatus">
                <option value="draft">
                  draft
                </option>
                <option value="active">
                  active
                </option>
                <option value="archived">
                  archived
                </option>
              </select>
            </div>
            <button
              class="btn"
              :disabled="isBusy"
              type="submit"
            >
              Create micro-skill
            </button>
          </form>

          <form
            class="form link-form"
            @submit.prevent="linkPredecessors"
          >
            <input
              v-model="linkNodeId"
              type="text"
              placeholder="node_id to relink"
              required
            >
            <input
              v-model="linkPredecessorCsv"
              type="text"
              placeholder="predecessor_ids csv"
            >
            <button
              class="btn btn--ghost"
              :disabled="isBusy"
              type="submit"
            >
              Relink predecessors
            </button>
          </form>

          <ul class="list">
            <li
              v-for="item in microSkills"
              :key="item.node_id"
            >
              <strong>{{ item.node_id }}</strong> · {{ item.topic_code || '-' }} · v{{ item.version }}
            </li>
          </ul>
        </article>
      </div>

      <p
        v-if="catalogError"
        class="error"
      >
        {{ catalogError }}
      </p>
    </section>

    <section class="card">
      <header class="section-head">
        <h2>Import payload</h2>
        <button
          class="btn btn--ghost"
          :disabled="isBusy"
          @click="setTemplate"
        >
          Insert template v1.2
        </button>
      </header>

      <div class="grid">
        <label>
          source_id
          <input
            v-model="sourceId"
            type="text"
            placeholder="manual-ui"
            required
          >
        </label>
        <label>
          contract_version
          <input
            v-model="contractVersion"
            type="text"
            placeholder="v1.2"
            required
          >
        </label>
      </div>

      <label>
        payload (JSON)
        <textarea
          v-model="payloadText"
          class="code"
          rows="14"
        />
      </label>

      <div class="actions">
        <button
          class="btn"
          :disabled="isBusy"
          @click="runImport(true)"
        >
          Validate only
        </button>
        <button
          class="btn"
          :disabled="isBusy"
          @click="runImport(false)"
        >
          Apply import
        </button>
      </div>

      <p
        v-if="importError"
        class="error"
      >
        {{ importError }}
      </p>

      <pre
        v-if="importResult"
        class="result"
      >{{ toPretty(importResult) }}</pre>
    </section>

    <section class="card card--danger">
      <header class="section-head">
        <h2>Fixture Cleanup</h2>
      </header>

      <p class="subtitle">
        Default patterns: <code>math_v0xx*</code> and <code>MV0xx*</code>.
      </p>

      <div class="grid">
        <label>
          subject_code_patterns (one regex per line)
          <textarea
            v-model="subjectPatternsText"
            rows="4"
          />
        </label>
        <label>
          topic_code_patterns (one regex per line)
          <textarea
            v-model="topicPatternsText"
            rows="4"
          />
        </label>
        <label>
          node_id_patterns (one regex per line)
          <textarea
            v-model="nodePatternsText"
            rows="4"
          />
        </label>
      </div>

      <label>
        Confirm phrase for destructive cleanup
        <input
          v-model="cleanupConfirm"
          type="text"
          placeholder="Type CLEANUP for apply"
        >
      </label>

      <div class="actions">
        <button
          class="btn btn--ghost"
          :disabled="isBusy"
          @click="runCleanup(true)"
        >
          Dry-run cleanup
        </button>
        <button
          class="btn btn--danger"
          :disabled="isBusy || cleanupConfirm !== 'CLEANUP'"
          @click="runCleanup(false)"
        >
          Apply cleanup
        </button>
      </div>

      <p
        v-if="cleanupError"
        class="error"
      >
        {{ cleanupError }}
      </p>

      <pre
        v-if="cleanupResult"
        class="result"
      >{{ toPretty(cleanupResult) }}</pre>
    </section>

    <section class="card">
      <header class="section-head">
        <h2>Run history</h2>
      </header>
      <article
        v-for="item in history"
        :key="item.id"
        class="history-row"
      >
        <div class="history-row__top">
          <strong>{{ item.operation }}</strong>
          <span>{{ item.time }}</span>
        </div>
        <p class="history-row__summary">
          {{ item.summary }}
        </p>
        <p class="history-row__meta">
          status={{ item.status }} · request_id={{ item.requestId }}
        </p>
      </article>
      <p
        v-if="!history.length"
        class="muted"
      >
        No runs yet.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
type SubjectItem = { code: string, name: string }
type TopicItem = { code: string, subject_code: string, grade: number, name: string }
type MicroSkillItem = { node_id: string, topic_code: string | null, version: number }

type ImportResponse = {
  import_id: string
  source_id: string
  imported: number
  status: string
  errors: Array<{ code: string, message: string, path: string }>
  details?: Record<string, number>
}

type CleanupResponse = {
  status: string
  dry_run: boolean
  matched: Record<string, number>
  deleted: Record<string, number>
}

type HttpError = {
  statusCode?: number
  statusMessage?: string
  data?: { detail?: string }
}

type HistoryItem = {
  id: string
  operation: string
  status: string
  summary: string
  time: string
  requestId: string
}

const HISTORY_KEY = 'admin-content-ops-history'

const subjectCode = ref('')
const subjectName = ref('')
const topicCode = ref('')
const topicSubjectCode = ref('')
const topicGrade = ref(2)
const topicName = ref('')

const skillNodeId = ref('')
const skillSubjectCode = ref('')
const skillTopicCode = ref('')
const skillGrade = ref(2)
const skillSectionCode = ref('R1')
const skillSectionName = ref('Numbers')
const skillName = ref('')
const skillPredecessorCsv = ref('')
const skillCriticality = ref<'low' | 'medium' | 'high'>('medium')
const skillStatus = ref<'draft' | 'active' | 'archived'>('active')

const linkNodeId = ref('')
const linkPredecessorCsv = ref('')

const sourceId = ref('manual-ui')
const contractVersion = ref('v1.2')
const payloadText = ref('')

const subjectPatternsText = ref('^math_v\\d{2}.*$')
const topicPatternsText = ref('^MV\\d{2}.*$')
const nodePatternsText = ref('^MV\\d{2}.*$')
const cleanupConfirm = ref('')

const subjects = ref<SubjectItem[]>([])
const topics = ref<TopicItem[]>([])
const microSkills = ref<MicroSkillItem[]>([])

const importResult = ref<ImportResponse | null>(null)
const cleanupResult = ref<CleanupResponse | null>(null)
const importError = ref('')
const cleanupError = ref('')
const catalogError = ref('')
const busyAction = ref<string | null>(null)
const history = ref<HistoryItem[]>([])

const config = useRuntimeConfig()
const isProdLike = computed(() => !String(config.public.baseUrl || '').includes('localhost'))
const isBusy = computed(() => busyAction.value !== null)

const toPretty = (value: unknown): string => JSON.stringify(value, null, 2)

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const parsePatternLines = (value: string): string[] =>
  value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)

const nowLabel = () => new Date().toLocaleString()

const requestIdForRun = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rid-${Date.now()}`
}

const toErrorText = (err: unknown, fallback: string, requestId: string): string => {
  const e = err as HttpError
  const detail = e?.data?.detail
  const message = typeof detail === 'string' ? detail : e?.statusMessage || fallback
  return `${message} (request_id=${requestId})`
}

const parseJsonObject = (value: string): Record<string, unknown> => {
  const parsed = JSON.parse(value) as unknown
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Payload must be JSON object')
  }
  return parsed as Record<string, unknown>
}

const pushHistory = (entry: Omit<HistoryItem, 'id' | 'time'>) => {
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: nowLabel(),
    ...entry
  }
  history.value = [item, ...history.value].slice(0, 30)
  if (import.meta.client) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  }
}

const loadHistory = () => {
  if (!import.meta.client) return
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      history.value = parsed as HistoryItem[]
    }
  } catch {
    history.value = []
  }
}

const setTemplate = () => {
  contractVersion.value = 'v1.2'
  const template = {
    subjects: [{ code: 'math_v99_demo', name: 'Math v99 demo' }],
    topics: [{ code: 'MV99-T1', subject_code: 'math_v99_demo', grade: 2, name: 'Topic' }],
    micro_skills: [
      {
        node_id: 'MV99-N1',
        subject_code: 'math_v99_demo',
        topic_code: 'MV99-T1',
        grade: 2,
        section_code: 'R1',
        section_name: 'Numbers',
        micro_skill_name: 'Skill',
        predecessor_ids: [],
        criticality: 'medium',
        source_ref: 'manual-ui',
        status: 'active'
      }
    ],
    tests: []
  }
  payloadText.value = JSON.stringify(template, null, 2)
}

const loadCatalog = async () => {
  const requestId = requestIdForRun()
  busyAction.value = 'catalog'
  catalogError.value = ''
  try {
    const [subjectsRes, topicsRes, skillsRes] = await Promise.all([
      $fetch<SubjectItem[]>('/api/admin/subjects', { headers: { 'x-request-id': requestId } }),
      $fetch<TopicItem[]>('/api/admin/topics', { headers: { 'x-request-id': requestId } }),
      $fetch<MicroSkillItem[]>('/api/admin/micro-skills', { headers: { 'x-request-id': requestId } })
    ])
    subjects.value = subjectsRes
    topics.value = topicsRes
    microSkills.value = skillsRes
  } catch (err: unknown) {
    catalogError.value = toErrorText(err, 'Catalog load failed', requestId)
  } finally {
    busyAction.value = null
  }
}

const createSubject = async () => {
  const requestId = requestIdForRun()
  busyAction.value = 'create-subject'
  catalogError.value = ''
  try {
    const created = await $fetch<SubjectItem>('/api/admin/subjects', {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        code: subjectCode.value.trim(),
        name: subjectName.value.trim()
      }
    })
    subjects.value = [created, ...subjects.value.filter(item => item.code !== created.code)]
    subjectCode.value = ''
    subjectName.value = ''
    pushHistory({
      operation: 'catalog.subject.create',
      status: 'completed',
      summary: `code=${created.code}`,
      requestId
    })
  } catch (err: unknown) {
    catalogError.value = toErrorText(err, 'Subject create failed', requestId)
  } finally {
    busyAction.value = null
  }
}

const createTopic = async () => {
  const requestId = requestIdForRun()
  busyAction.value = 'create-topic'
  catalogError.value = ''
  try {
    const created = await $fetch<TopicItem>('/api/admin/topics', {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        code: topicCode.value.trim(),
        subject_code: topicSubjectCode.value.trim(),
        grade: topicGrade.value,
        name: topicName.value.trim()
      }
    })
    topics.value = [created, ...topics.value.filter(item => item.code !== created.code)]
    topicCode.value = ''
    topicName.value = ''
    pushHistory({
      operation: 'catalog.topic.create',
      status: 'completed',
      summary: `code=${created.code}`,
      requestId
    })
  } catch (err: unknown) {
    catalogError.value = toErrorText(err, 'Topic create failed', requestId)
  } finally {
    busyAction.value = null
  }
}

const createMicroSkill = async () => {
  const requestId = requestIdForRun()
  busyAction.value = 'create-skill'
  catalogError.value = ''
  try {
    const created = await $fetch<MicroSkillItem>('/api/admin/micro-skills', {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        node_id: skillNodeId.value.trim(),
        subject_code: skillSubjectCode.value.trim(),
        topic_code: skillTopicCode.value.trim(),
        grade: skillGrade.value,
        section_code: skillSectionCode.value.trim(),
        section_name: skillSectionName.value.trim(),
        micro_skill_name: skillName.value.trim(),
        predecessor_ids: parseCsv(skillPredecessorCsv.value),
        criticality: skillCriticality.value,
        status: skillStatus.value
      }
    })
    microSkills.value = [created, ...microSkills.value.filter(item => item.node_id !== created.node_id)]
    linkNodeId.value = created.node_id
    skillNodeId.value = ''
    skillName.value = ''
    skillPredecessorCsv.value = ''
    pushHistory({
      operation: 'catalog.micro-skill.create',
      status: 'completed',
      summary: `node_id=${created.node_id}`,
      requestId
    })
  } catch (err: unknown) {
    catalogError.value = toErrorText(err, 'Micro-skill create failed', requestId)
  } finally {
    busyAction.value = null
  }
}

const linkPredecessors = async () => {
  const requestId = requestIdForRun()
  busyAction.value = 'link-skill'
  catalogError.value = ''
  try {
    const updated = await $fetch<MicroSkillItem>(`/api/admin/micro-skills/${encodeURIComponent(linkNodeId.value)}/links`, {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        predecessor_ids: parseCsv(linkPredecessorCsv.value)
      }
    })
    microSkills.value = [updated, ...microSkills.value.filter(item => item.node_id !== updated.node_id)]
    linkPredecessorCsv.value = ''
    pushHistory({
      operation: 'catalog.micro-skill.link',
      status: 'completed',
      summary: `node_id=${updated.node_id}`,
      requestId
    })
  } catch (err: unknown) {
    catalogError.value = toErrorText(err, 'Relink failed', requestId)
  } finally {
    busyAction.value = null
  }
}

const runImport = async (validateOnly: boolean) => {
  const requestId = requestIdForRun()
  busyAction.value = validateOnly ? 'import-validate' : 'import-apply'
  importError.value = ''
  importResult.value = null
  try {
    const payload = parseJsonObject(payloadText.value)
    const response = await $fetch<ImportResponse>('/api/admin/content/import', {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        source_id: sourceId.value.trim(),
        contract_version: contractVersion.value.trim(),
        validate_only: validateOnly,
        payload
      }
    })
    importResult.value = response
    pushHistory({
      operation: validateOnly ? 'import.validate' : 'import.apply',
      status: response.status,
      summary: `imported=${response.imported}, errors=${response.errors.length}`,
      requestId
    })
  } catch (err: unknown) {
    importError.value = toErrorText(err, 'Import request failed', requestId)
    pushHistory({
      operation: validateOnly ? 'import.validate' : 'import.apply',
      status: 'failed',
      summary: importError.value,
      requestId
    })
  } finally {
    busyAction.value = null
  }
}

const runCleanup = async (dryRun: boolean) => {
  const requestId = requestIdForRun()
  busyAction.value = dryRun ? 'cleanup-dry-run' : 'cleanup-apply'
  cleanupError.value = ''
  cleanupResult.value = null
  try {
    if (!dryRun && cleanupConfirm.value !== 'CLEANUP') {
      throw new Error('Type CLEANUP to allow destructive cleanup')
    }

    const response = await $fetch<CleanupResponse>('/api/admin/fixtures/cleanup', {
      method: 'POST',
      headers: { 'x-request-id': requestId },
      body: {
        dry_run: dryRun,
        subject_code_patterns: parsePatternLines(subjectPatternsText.value),
        topic_code_patterns: parsePatternLines(topicPatternsText.value),
        node_id_patterns: parsePatternLines(nodePatternsText.value)
      }
    })
    cleanupResult.value = response
    pushHistory({
      operation: dryRun ? 'cleanup.dry-run' : 'cleanup.apply',
      status: response.status,
      summary: `matched=${JSON.stringify(response.matched)}, deleted=${JSON.stringify(response.deleted)}`,
      requestId
    })
  } catch (err: unknown) {
    cleanupError.value = toErrorText(err, 'Cleanup request failed', requestId)
    pushHistory({
      operation: dryRun ? 'cleanup.dry-run' : 'cleanup.apply',
      status: 'failed',
      summary: cleanupError.value,
      requestId
    })
  } finally {
    busyAction.value = null
  }
}

onMounted(async () => {
  loadHistory()
  setTemplate()
  await loadCatalog()
})
</script>

<style scoped>
.page {
  min-height: calc(100vh - 130px);
  padding: 24px 20px 64px;
  display: grid;
  gap: 16px;
}

.card {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel);
  padding: 16px;
}

.sub-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: color-mix(in srgb, var(--panel) 85%, #f8fafc 15%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

h1,
h2,
h3 {
  margin: 0;
}

.subtitle {
  margin: 8px 0 0;
  color: var(--muted);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.triple-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.form {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.link-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.row {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
}

label {
  display: grid;
  gap: 6px;
  color: var(--text);
  font-size: 0.9rem;
}

input,
textarea,
select {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  background: var(--panel);
  color: var(--text);
}

.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 600;
  cursor: pointer;
  background: #0f172a;
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}

.btn--danger {
  background: #7f1d1d;
  color: #fef2f2;
}

.card--danger {
  border-color: #fecaca;
  background: color-mix(in srgb, var(--panel) 85%, #fee2e2 15%);
}

.list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
  max-height: 220px;
  overflow: auto;
}

.list li {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.9rem;
}

.result {
  margin: 12px 0 0;
  padding: 12px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  overflow: auto;
}

.error {
  margin: 12px 0 0;
  color: #b91c1c;
}

.muted {
  color: var(--muted);
}

.badge {
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 7px 10px;
}

.badge--prod {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge--dev {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.history-row {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.history-row__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.9rem;
}

.history-row__summary {
  margin: 0;
}

.history-row__meta {
  margin: 0;
  color: var(--muted);
  font-size: 0.83rem;
  word-break: break-all;
}
</style>
