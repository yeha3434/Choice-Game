import './style.css'
import {
  MAX_OPTION_NAME_LENGTH,
  MAX_RACE_OPTION_COUNT,
  MIN_RACE_OPTION_COUNT,
  prepareRaceOptions,
  type RaceOption,
  type RawRaceOption,
} from './race-options'

const OPTION_PLACEHOLDERS = ['例如：火锅', '例如：去公园', '例如：看电影', '例如：在家休息']

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('找不到应用挂载节点 #app')
}

app.innerHTML = `
  <main class="app-shell">
    <header class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="hero-kicker">一场不太正规的社区运动会</p>
        <h1 id="page-title">Indecision Games</h1>
        <p class="hero-intro">把你的选项报上名，让他们自己跑个明白。</p>
      </div>
      <div class="meet-stamp" aria-hidden="true">
        <span class="meet-stamp-number">2—4</span>
        <span class="meet-stamp-label">名选手</span>
      </div>
    </header>

    <section class="signup-card" aria-labelledby="signup-title">
      <div class="card-heading">
        <div>
          <p class="card-kicker">报名处</p>
          <h2 id="signup-title">今天谁上场？</h2>
        </div>
        <output id="roster-count" class="roster-count" aria-live="polite"></output>
      </div>

      <p class="card-description">
        填写至少两个不同选项；空白项会自动忽略，名称最多 ${MAX_OPTION_NAME_LENGTH} 个字符。
      </p>

      <form id="option-form" novalidate>
        <div id="option-list" class="option-list" aria-label="参赛选项"></div>

        <button id="add-option" class="add-option-button" type="button">
          ＋ 添加选手
        </button>

        <div id="validation-summary" class="validation-summary" data-tone="waiting">
          <span class="validation-light" aria-hidden="true"></span>
          <p id="validation-message" aria-live="polite"></p>
        </div>

        <button id="start-race" class="start-race-button" type="submit" disabled>
          <span>准备开赛</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <section id="prepared-roster" class="prepared-roster" tabindex="-1" hidden>
        <p class="prepared-kicker">报名表检查通过</p>
        <h3>选手们已在检录处排好队</h3>
        <p id="prepared-summary" class="prepared-summary"></p>
        <ol id="prepared-list" class="prepared-list"></ol>
      </section>

      <p id="roster-status" class="visually-hidden" aria-live="polite"></p>

      <aside class="stage-note" aria-label="当前开发阶段">
        <span class="stage-note-label">阶段 2</span>
        <span>先把报名表检查清楚；角色分配和正式发令将在后续阶段加入。</span>
      </aside>
    </section>
  </main>
`

const optionForm = getRequiredElement<HTMLFormElement>('option-form')
const optionList = getRequiredElement<HTMLDivElement>('option-list')
const addOptionButton = getRequiredElement<HTMLButtonElement>('add-option')
const startRaceButton = getRequiredElement<HTMLButtonElement>('start-race')
const rosterCount = getRequiredElement<HTMLOutputElement>('roster-count')
const rosterStatus = getRequiredElement<HTMLParagraphElement>('roster-status')
const validationSummary = getRequiredElement<HTMLDivElement>('validation-summary')
const validationMessage = getRequiredElement<HTMLParagraphElement>('validation-message')
const preparedRoster = getRequiredElement<HTMLElement>('prepared-roster')
const preparedSummary = getRequiredElement<HTMLParagraphElement>('prepared-summary')
const preparedList = getRequiredElement<HTMLOListElement>('prepared-list')

let nextOptionId = MIN_RACE_OPTION_COUNT + 1
let options: RawRaceOption[] = Array.from({ length: MIN_RACE_OPTION_COUNT }, (_, index) => ({
  id: index + 1,
  value: '',
}))

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)

  if (!element) {
    throw new Error(`找不到必需的页面元素 #${id}`)
  }

  return element as T
}

function clearPreparedRoster(): void {
  preparedRoster.hidden = true
  preparedList.replaceChildren()
}

function renderOptionRows(focusOptionId?: number): void {
  const canRemove = options.length > MIN_RACE_OPTION_COUNT
  const fragment = document.createDocumentFragment()

  options.forEach((option, index) => {
    const position = index + 1
    const row = document.createElement('div')
    row.className = 'option-row'
    row.dataset.testid = 'option-row'
    row.dataset.optionId = String(option.id)

    const label = document.createElement('label')
    label.className = 'option-label'
    label.htmlFor = `option-${option.id}`

    const laneNumber = document.createElement('span')
    laneNumber.className = 'option-number'
    laneNumber.textContent = String(position).padStart(2, '0')
    laneNumber.setAttribute('aria-hidden', 'true')

    const labelText = document.createElement('span')
    labelText.textContent = `选手 ${position}`

    label.append(laneNumber, labelText)

    const field = document.createElement('div')
    field.className = 'option-field'

    const input = document.createElement('input')
    input.className = 'option-input'
    input.id = `option-${option.id}`
    input.type = 'text'
    input.value = option.value
    input.placeholder = OPTION_PLACEHOLDERS[index] ?? '写下一个选项'
    input.autocomplete = 'off'
    input.dataset.testid = 'option-input'

    const error = document.createElement('p')
    error.id = `option-error-${option.id}`
    error.className = 'option-error'
    error.dataset.testid = 'option-error'
    error.hidden = true
    input.setAttribute('aria-describedby', error.id)

    input.addEventListener('input', () => {
      option.value = input.value
      clearPreparedRoster()
      updateValidation()
    })

    field.append(input, error)

    const removeButton = document.createElement('button')
    removeButton.className = 'remove-option-button'
    removeButton.type = 'button'
    removeButton.disabled = !canRemove
    removeButton.dataset.action = 'remove'
    removeButton.dataset.optionId = String(option.id)
    removeButton.setAttribute('aria-label', `删除选手 ${position}`)
    removeButton.title = canRemove ? `删除选手 ${position}` : '至少保留两名选手'
    removeButton.textContent = '×'
    removeButton.addEventListener('click', () => {
      removeOption(option.id)
    })

    row.append(label, field, removeButton)
    fragment.append(row)
  })

  optionList.replaceChildren(fragment)

  const isFull = options.length >= MAX_RACE_OPTION_COUNT
  rosterCount.value = `${options.length} / ${MAX_RACE_OPTION_COUNT}`
  rosterCount.textContent = `${options.length} / ${MAX_RACE_OPTION_COUNT}`
  addOptionButton.disabled = isFull
  addOptionButton.textContent = isFull ? '选手已满员' : '＋ 添加选手'
  updateValidation()

  if (focusOptionId !== undefined) {
    optionList.querySelector<HTMLInputElement>(`#option-${focusOptionId}`)?.focus()
  }
}

function updateValidation(): ReturnType<typeof prepareRaceOptions> {
  const validation = prepareRaceOptions(options)
  const messagesByOptionId = new Map<number, string[]>()

  for (const issue of validation.issues) {
    const messages = messagesByOptionId.get(issue.optionId) ?? []
    messages.push(issue.message)
    messagesByOptionId.set(issue.optionId, messages)
  }

  for (const option of options) {
    const row = optionList.querySelector<HTMLElement>(
      `.option-row[data-option-id="${option.id}"]`,
    )
    const input = optionList.querySelector<HTMLInputElement>(`#option-${option.id}`)
    const error = optionList.querySelector<HTMLParagraphElement>(`#option-error-${option.id}`)
    const messages = messagesByOptionId.get(option.id) ?? []
    const hasError = messages.length > 0

    row?.classList.toggle('has-error', hasError)
    input?.setAttribute('aria-invalid', String(hasError))

    if (error) {
      error.textContent = messages.join('；')
      error.hidden = !hasError
    }
  }

  const tone = validation.isValid ? 'success' : validation.issues.length > 0 ? 'error' : 'waiting'
  validationSummary.dataset.tone = tone
  validationMessage.textContent = validation.formMessage
  startRaceButton.disabled = !validation.isValid

  return validation
}

function addOption(): void {
  if (options.length >= MAX_RACE_OPTION_COUNT) {
    return
  }

  const newOption: RawRaceOption = {
    id: nextOptionId,
    value: '',
  }

  nextOptionId += 1
  options = [...options, newOption]
  clearPreparedRoster()
  rosterStatus.textContent = `已添加第 ${options.length} 名选手`
  renderOptionRows(newOption.id)
}

function removeOption(optionId: number): void {
  if (options.length <= MIN_RACE_OPTION_COUNT) {
    return
  }

  const removedPosition = options.findIndex((option) => option.id === optionId)

  if (removedPosition === -1) {
    return
  }

  options = options.filter((option) => option.id !== optionId)
  clearPreparedRoster()
  rosterStatus.textContent = `已删除第 ${removedPosition + 1} 名选手`
  renderOptionRows()
}

function renderPreparedRoster(raceOptions: readonly RaceOption[]): void {
  const fragment = document.createDocumentFragment()

  raceOptions.forEach((option, index) => {
    const item = document.createElement('li')
    const number = document.createElement('span')
    const name = document.createElement('span')

    number.className = 'prepared-number'
    number.textContent = String(index + 1).padStart(2, '0')
    name.className = 'prepared-name'
    name.textContent = option.name
    item.append(number, name)
    fragment.append(item)
  })

  preparedList.replaceChildren(fragment)
  preparedSummary.textContent = `${raceOptions.length} 名有效选手已就位，每位选手机会相同。`
  preparedRoster.hidden = false
  preparedRoster.focus()
}

addOptionButton.addEventListener('click', addOption)
optionForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const validation = updateValidation()

  if (!validation.isValid) {
    return
  }

  renderPreparedRoster(validation.options)
})

renderOptionRows()
