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
        @click="loadAll"
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
        </div>

        <div class="section-head">
          <h3>Questions</h3>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="loading"
            @click="addQuestion"
          >
            Add question
          </button>
        </div>

        <p
          v-if="!filteredMicroSkills.length"
          class="muted"
        >
          No micro-skills for selected subject/grade. Create nodes first in Content Ops.
        </p>

        <article
          v-for="(question, index) in questions"
          :key="`question-${index}`"
          class="question-card"
        >
          <div class="question-head">
            <strong>Question {{ index + 1 }}</strong>
            <button
              class="btn btn--ghost btn--danger"
              type="button"
              :disabled="loading || questions.length === 1"
              @click="removeQuestion(index)"
            >
              Remove
            </button>
          </div>
          <div class="grid">
            <select
              v-model="question.node_id"
              required
            >
              <option
                value=""
                disabled
              >
                select node_id
              </option>
              <option
                v-for="item in filteredMicroSkills"
                :key="item.node_id"
                :value="item.node_id"
              >
                {{ item.node_id }} · {{ item.micro_skill_name }}
              </option>
            </select>
            <input
              v-model="question.text"
              type="text"
              placeholder="question text"
              required
            >
            <select
              v-model="question.question_type"
              @change="onQuestionTypeChange(question)"
            >
              <option value="text">
                text
              </option>
              <option value="single_choice">
                single_choice
              </option>
            </select>
            <input
              v-model.number="question.max_score"
              type="number"
              min="1"
              placeholder="max score"
              required
            >
          </div>

          <div
            v-if="question.question_type === 'text'"
            class="subsection"
          >
            <div class="grid">
              <input
                v-model="question.answer_key"
                type="text"
                placeholder="answer key"
                required
              >
            </div>
            <div class="section-head">
              <h4>Text distractors</h4>
              <button
                class="btn btn--ghost"
                type="button"
                :disabled="loading"
                @click="addTextDistractor(index)"
              >
                Add distractor
              </button>
            </div>
            <p
              v-if="!question.text_distractors.length"
              class="muted"
            >
              Optional: add patterns for diagnostics.
            </p>
            <div
              v-for="(distractor, distractorIndex) in question.text_distractors"
              :key="`q-${index}-text-distractor-${distractorIndex}`"
              class="subcard"
            >
              <div class="grid">
                <input
                  v-model="distractor.pattern"
                  type="text"
                  placeholder="pattern"
                  required
                >
                <select v-model="distractor.match_mode">
                  <option value="exact">
                    exact
                  </option>
                  <option value="normalized">
                    normalized
                  </option>
                  <option value="regex">
                    regex
                  </option>
                </select>
                <select v-model="distractor.diagnostic_tag">
                  <option
                    v-for="tag in diagnosticTagOptions"
                    :key="`text-tag-${tag}`"
                    :value="tag"
                  >
                    {{ tag }}
                  </option>
                </select>
              </div>
              <button
                class="btn btn--ghost btn--danger"
                type="button"
                :disabled="loading"
                @click="removeTextDistractor(index, distractorIndex)"
              >
                Remove distractor
              </button>
            </div>
          </div>

          <div
            v-else
            class="subsection"
          >
            <div class="section-head">
              <h4>Options</h4>
              <button
                class="btn btn--ghost"
                type="button"
                :disabled="loading"
                @click="addOption(index)"
              >
                Add option
              </button>
            </div>

            <div
              v-for="(option, optionIndex) in question.options"
              :key="`q-${index}-option-${optionIndex}`"
              class="subcard"
            >
              <div class="grid">
                <input
                  v-model="option.option_id"
                  type="text"
                  placeholder="option_id (A)"
                  required
                >
                <input
                  v-model="option.text"
                  type="text"
                  placeholder="option text"
                  required
                >
                <input
                  :value="optionIndex + 1"
                  type="number"
                  readonly
                >
                <select v-model="option.diagnostic_tag">
                  <option value="">
                    (none)
                  </option>
                  <option
                    v-for="tag in diagnosticTagOptions"
                    :key="`option-tag-${tag}`"
                    :value="tag"
                  >
                    {{ tag }}
                  </option>
                </select>
              </div>
              <div class="sub-actions">
                <label class="radio">
                  <input
                    v-model="question.correct_option_id"
                    type="radio"
                    :value="option.option_id"
                  >
                  Correct
                </label>
                <button
                  class="btn btn--ghost btn--danger"
                  type="button"
                  :disabled="loading || question.options.length <= 2"
                  @click="removeOption(index, optionIndex)"
                >
                  Remove option
                </button>
              </div>
            </div>
          </div>
        </article>

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
type QuestionType = 'text' | 'single_choice'
type DiagnosticTag = 'inattention' | 'misread_condition' | 'calc_error' | 'concept_gap' | 'guessing' | 'other'
type TextMatchMode = 'exact' | 'normalized' | 'regex'

type TestItem = {
  test_id: string
  subject_code: string
  grade: number
}

type MicroSkillItem = {
  node_id: string
  micro_skill_name: string
  subject_code: string
  grade: number
}

type QuestionDraft = {
  node_id: string
  text: string
  question_type: QuestionType
  answer_key: string
  correct_option_id: string
  options: QuestionOptionDraft[]
  text_distractors: TextDistractorDraft[]
  max_score: number
}

type QuestionOptionDraft = {
  option_id: string
  text: string
  diagnostic_tag: DiagnosticTag | ''
}

type TextDistractorDraft = {
  pattern: string
  match_mode: TextMatchMode
  diagnostic_tag: DiagnosticTag
}

type QuestionOptionPayload = {
  option_id: string
  text: string
  position: number
  diagnostic_tag: DiagnosticTag | null
}

type TextDistractorPayload = {
  pattern: string
  match_mode: TextMatchMode
  diagnostic_tag: DiagnosticTag
}

type TextQuestionPayload = {
  node_id: string
  text: string
  question_type: 'text'
  max_score: number
  answer_key: string
  text_distractors: TextDistractorPayload[]
}

type SingleChoiceQuestionPayload = {
  node_id: string
  text: string
  question_type: 'single_choice'
  max_score: number
  correct_option_id: string
  options: QuestionOptionPayload[]
}

type CreateTestQuestionPayload = TextQuestionPayload | SingleChoiceQuestionPayload

type HttpError = {
  data?: { detail?: string }
  statusMessage?: string
}

const diagnosticTagOptions: DiagnosticTag[] = [
  'inattention',
  'misread_condition',
  'calc_error',
  'concept_gap',
  'guessing',
  'other'
]

const tests = ref<TestItem[]>([])
const microSkills = ref<MicroSkillItem[]>([])
const loading = ref(false)
const error = ref('')
const diagnostics = ref('')

const makeOptionDraft = (position: number): QuestionOptionDraft => ({
  option_id: String.fromCharCode(64 + position),
  text: '',
  diagnostic_tag: ''
})

const makeTextDistractorDraft = (): TextDistractorDraft => ({
  pattern: '',
  match_mode: 'exact',
  diagnostic_tag: 'other'
})

const makeQuestionDraft = (nodeId = ''): QuestionDraft => ({
  node_id: nodeId,
  text: '',
  question_type: 'text',
  answer_key: '',
  correct_option_id: '',
  options: [makeOptionDraft(1), makeOptionDraft(2)],
  text_distractors: [],
  max_score: 1
})

const subjectCode = ref('math')
const grade = ref(2)
const questions = ref<QuestionDraft[]>([makeQuestionDraft()])

const assignTestId = ref('')
const assignChildId = ref('')
const diagnosticsChildId = ref('')

const filteredMicroSkills = computed(() =>
  microSkills.value
    .filter(item => item.subject_code === subjectCode.value.trim() && item.grade === grade.value)
    .sort((a, b) => a.node_id.localeCompare(b.node_id))
)

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

const loadAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const [testsRes, skillsRes] = await Promise.all([
      $fetch<TestItem[]>('/api/admin/tests'),
      $fetch<MicroSkillItem[]>('/api/admin/micro-skills')
    ])
    tests.value = testsRes
    microSkills.value = skillsRes
    const firstQuestion = questions.value[0]
    const firstSkill = filteredMicroSkills.value[0]
    if (questions.value.length === 1 && firstQuestion && !firstQuestion.node_id && firstSkill) {
      firstQuestion.node_id = firstSkill.node_id
    }
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load assessment data')
  } finally {
    loading.value = false
  }
}

const addQuestion = () => {
  const defaultNodeId = filteredMicroSkills.value[0]?.node_id || ''
  questions.value.push(makeQuestionDraft(defaultNodeId))
}

const removeQuestion = (index: number) => {
  if (questions.value.length === 1) {
    return
  }
  questions.value.splice(index, 1)
}

const onQuestionTypeChange = (question: QuestionDraft) => {
  if (question.question_type === 'text') {
    question.correct_option_id = ''
    if (question.options.length < 2) {
      question.options = [makeOptionDraft(1), makeOptionDraft(2)]
    }
    return
  }

  if (question.options.length < 2) {
    question.options = [makeOptionDraft(1), makeOptionDraft(2)]
  }
  if (!question.correct_option_id) {
    question.correct_option_id = question.options[0]?.option_id || ''
  }
}

const addOption = (questionIndex: number) => {
  const question = questions.value[questionIndex]
  if (!question) return

  const nextPosition = question.options.length + 1
  question.options.push(makeOptionDraft(nextPosition))
}

const removeOption = (questionIndex: number, optionIndex: number) => {
  const question = questions.value[questionIndex]
  if (!question || question.options.length <= 2) return

  const removed = question.options[optionIndex]
  question.options.splice(optionIndex, 1)
  if (removed && question.correct_option_id === removed.option_id) {
    question.correct_option_id = question.options[0]?.option_id || ''
  }
}

const addTextDistractor = (questionIndex: number) => {
  const question = questions.value[questionIndex]
  if (!question) return
  question.text_distractors.push(makeTextDistractorDraft())
}

const removeTextDistractor = (questionIndex: number, distractorIndex: number) => {
  const question = questions.value[questionIndex]
  if (!question) return
  question.text_distractors.splice(distractorIndex, 1)
}

const createTest = async () => {
  loading.value = true
  error.value = ''
  try {
    const payloadQuestions: CreateTestQuestionPayload[] = questions.value.map((item) => {
      const nodeId = item.node_id.trim()
      const text = item.text.trim()
      const maxScore = Number(item.max_score) || 1

      if (item.question_type === 'text') {
        const textDistractors = item.text_distractors
          .map<TextDistractorPayload>(distractor => ({
            pattern: distractor.pattern.trim(),
            match_mode: distractor.match_mode,
            diagnostic_tag: distractor.diagnostic_tag
          }))
          .filter(distractor => distractor.pattern.length > 0)

        return {
          node_id: nodeId,
          text,
          question_type: 'text',
          max_score: maxScore,
          answer_key: item.answer_key.trim(),
          text_distractors: textDistractors
        }
      }

      const options = item.options
        .map<QuestionOptionPayload>((option, optionIndex) => ({
          option_id: option.option_id.trim(),
          text: option.text.trim(),
          position: optionIndex + 1,
          diagnostic_tag: option.diagnostic_tag || null
        }))
        .filter(option => option.option_id && option.text)

      return {
        node_id: nodeId,
        text,
        question_type: 'single_choice',
        max_score: maxScore,
        correct_option_id: item.correct_option_id.trim(),
        options
      }
    })

    if (!payloadQuestions.length) {
      error.value = 'Add at least one question'
      return
    }
    if (payloadQuestions.some(item => !item.node_id || !item.text || item.max_score < 1)) {
      error.value = 'Fill node_id, text and max_score>=1 for all questions'
      return
    }
    const invalidText = payloadQuestions.some(item =>
      item.question_type === 'text' && !item.answer_key.trim()
    )
    if (invalidText) {
      error.value = 'Text question requires answer_key'
      return
    }
    const invalidSingleChoice = payloadQuestions.some((item) => {
      if (item.question_type !== 'single_choice') return false
      if (!item.correct_option_id.trim()) return true
      if (item.options.length < 2) return true
      const ids = item.options.map(option => option.option_id)
      if (new Set(ids).size !== ids.length) return true
      if (!ids.includes(item.correct_option_id)) return true
      const correctOption = item.options.find(option => option.option_id === item.correct_option_id)
      return Boolean(correctOption?.diagnostic_tag)
    })
    if (invalidSingleChoice) {
      error.value = 'Single-choice question requires >=2 options, valid correct_option_id and empty diagnostic for correct option'
      return
    }

    const test = await $fetch<{ test_id: string }>('/api/admin/tests', {
      method: 'POST',
      body: {
        subject_code: subjectCode.value.trim(),
        grade: grade.value,
        questions: payloadQuestions
      }
    })
    assignTestId.value = test.test_id
    questions.value = [makeQuestionDraft(filteredMicroSkills.value[0]?.node_id || '')]
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

onMounted(loadAll)
</script>

<style scoped>
.page { min-height: 100vh; padding: 30px 20px 60px; background: var(--bg); }
.header { max-width: 980px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: var(--muted); }
.card { max-width: 980px; margin: 0 auto 20px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
.row { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.form { display: grid; gap: 12px; }
.grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
input, select { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--panel); color: var(--text); }
.btn { background: #0f172a; color: #fff; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }
.btn--ghost { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
.btn--danger { color: #b91c1c; border-color: #ef4444; }
.muted { color: var(--muted); }
.json { background: var(--panel); border: 1px dashed var(--border); border-radius: 10px; padding: 12px; overflow: auto; }
.error { max-width: 980px; margin: 8px auto 0; color: #b91c1c; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.question-card { border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; gap: 10px; }
.question-head { display: flex; justify-content: space-between; align-items: center; }
.subsection { border-top: 1px dashed var(--border); padding-top: 10px; display: grid; gap: 10px; }
.subcard { border: 1px solid var(--border); border-radius: 10px; padding: 10px; display: grid; gap: 10px; }
.sub-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.radio { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-weight: 600; }
</style>
