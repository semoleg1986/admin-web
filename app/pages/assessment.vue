<template>
  <main class="page">
    <header class="header">
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>Assessment</h1>
      </div>
      <button
        class="btn btn--ghost"
        :disabled="loading"
        @click="loadTests"
      >
        Refresh
      </button>
    </header>

    <section class="card">
      <h2>Create test</h2>
      <form
        class="form"
        @submit.prevent="createTest"
      >
        <div class="grid">
          <input
            v-model="subjectCode"
            type="text"
            placeholder="subject_code (math)"
            required
          >
          <input
            v-model.number="grade"
            type="number"
            min="1"
            max="4"
            placeholder="grade"
            required
          >
          <input
            v-model="nodeId"
            type="text"
            placeholder="node_id"
            required
          >
          <input
            v-model="questionText"
            type="text"
            placeholder="question text"
            required
          >
          <input
            v-model="answerKey"
            type="text"
            placeholder="answer key"
            required
          >
        </div>
        <button
          class="btn"
          type="submit"
          :disabled="loading"
        >
          Create test
        </button>
      </form>
    </section>

    <section class="card">
      <h2>Assign test</h2>
      <form
        class="form"
        @submit.prevent="assignTest"
      >
        <div class="grid">
          <input
            v-model="assignTestId"
            type="text"
            placeholder="test_id"
            required
          >
          <input
            v-model="assignChildId"
            type="text"
            placeholder="child_id"
            required
          >
        </div>
        <button
          class="btn"
          type="submit"
          :disabled="loading"
        >
          Assign
        </button>
      </form>
    </section>

    <section class="card">
      <h2>Child diagnostics</h2>
      <form
        class="form"
        @submit.prevent="loadDiagnostics"
      >
        <div class="grid">
          <input
            v-model="diagnosticsChildId"
            type="text"
            placeholder="child_id"
            required
          >
        </div>
        <button
          class="btn"
          type="submit"
          :disabled="loading"
        >
          Load diagnostics
        </button>
      </form>
      <pre
        v-if="diagnostics"
        class="json"
      >{{ diagnostics }}</pre>
    </section>

    <section class="card">
      <h2>Tests</h2>
      <article
        v-for="item in tests"
        :key="item.test_id"
        class="row"
      >
        <div>
          <strong>{{ item.test_id }}</strong>
          <p>{{ item.subject_code }} · grade {{ item.grade }}</p>
        </div>
        <button
          class="btn btn--ghost"
          :disabled="loading"
          @click="publishTest(item.test_id)"
        >
          Publish
        </button>
      </article>
      <p
        v-if="!tests.length"
        class="muted"
      >
        No tests yet.
      </p>
    </section>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
  </main>
</template>

<script setup lang="ts">
type TestItem = {
  test_id: string
  subject_code: string
  grade: number
}

type HttpError = {
  data?: { detail?: string }
  statusMessage?: string
}

const tests = ref<TestItem[]>([])
const loading = ref(false)
const error = ref('')
const diagnostics = ref('')

const subjectCode = ref('math')
const grade = ref(2)
const nodeId = ref('')
const questionText = ref('')
const answerKey = ref('')

const assignTestId = ref('')
const assignChildId = ref('')
const diagnosticsChildId = ref('')

const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as HttpError
  return e?.data?.detail || e?.statusMessage || fallback
}

const loadTests = async () => {
  loading.value = true
  error.value = ''
  try {
    tests.value = await $fetch<TestItem[]>('/api/admin/tests')
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load tests')
  } finally {
    loading.value = false
  }
}

const createTest = async () => {
  loading.value = true
  error.value = ''
  try {
    const test = await $fetch<{ test_id: string }>('/api/admin/tests', {
      method: 'POST',
      body: {
        subject_code: subjectCode.value,
        grade: grade.value,
        questions: [
          {
            node_id: nodeId.value,
            text: questionText.value,
            answer_key: answerKey.value,
            max_score: 1
          }
        ]
      }
    })
    assignTestId.value = test.test_id
    await loadTests()
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to create test')
  } finally {
    loading.value = false
  }
}

const publishTest = async (testId: string) => {
  loading.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/tests/${testId}/publish`, { method: 'POST' })
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to publish test')
  } finally {
    loading.value = false
  }
}

const assignTest = async () => {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/assignments', {
      method: 'POST',
      body: {
        test_id: assignTestId.value,
        child_id: assignChildId.value
      }
    })
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to assign test')
  } finally {
    loading.value = false
  }
}

const loadDiagnostics = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<Record<string, unknown>>(
      `/api/admin/diagnostics/children/${diagnosticsChildId.value}`
    )
    diagnostics.value = JSON.stringify(res, null, 2)
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load diagnostics')
  } finally {
    loading.value = false
  }
}

onMounted(loadTests)
</script>

<style scoped>
.page { min-height: 100vh; padding: 30px 20px 60px; background: var(--bg); }
.header { max-width: 980px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: var(--muted); }
.card { max-width: 980px; margin: 0 auto 20px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
.row { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.form { display: grid; gap: 12px; }
.grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
input { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--panel); color: var(--text); }
.btn { background: #0f172a; color: #fff; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }
.btn--ghost { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
.muted { color: var(--muted); }
.json { background: var(--panel); border: 1px dashed var(--border); border-radius: 10px; padding: 12px; overflow: auto; }
.error { max-width: 980px; margin: 8px auto 0; color: #b91c1c; }
</style>
