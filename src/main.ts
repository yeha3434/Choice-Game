import './style.css'

const MIN_OPTION_COUNT = 2
const MAX_OPTION_COUNT = 4
const OPTION_PLACEHOLDERS = ['例如：火锅', '例如：去公园', '例如：看电影', '例如：在家休息']

interface OptionEntry {
  id: number
  value: string
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('找不到应用挂载节点 #app')
}

app.innerHTML = `
  <main class="app-shell">
    <header class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="hero-kicker">一场不太正规的社区运动会</p>
        <h1 id="page-title">纠结运动会</h1>
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
        先安排 2～4 名选手。正式比赛和角色将在后续阶段加入。
      </p>

      <div id="option-list" class="option-list" aria-label="参赛选项"></div>

      <button id="add-option" class="add-option-button" type="button">
        ＋ 添加选手
      </button>

      <p id="roster-status" class="visually-hidden" aria-live="polite"></p>

      <aside class="stage-note" aria-label="当前开发阶段">
        <span class="stage-note-label">阶段 1</span>
        <span>先把报名流程练顺，暂时不发令起跑。</span>
      </aside>
    </section>
  </main>
`

const optionList = getRequiredElement<HTMLDivElement>('option-list')
const addOptionButton = getRequiredElement<HTMLButtonElement>('add-option')
const rosterCount = getRequiredElement<HTMLOutputElement>('roster-count')
const rosterStatus = getRequiredElement<HTMLParagraphElement>('roster-status')

let nextOptionId = MIN_OPTION_COUNT + 1
let options: OptionEntry[] = Array.from({ length: MIN_OPTION_COUNT }, (_, index) => ({
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

function renderOptionRows(focusOptionId?: number): void {
  const canRemove = options.length > MIN_OPTION_COUNT
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

    const input = document.createElement('input')
    input.className = 'option-input'
    input.id = `option-${option.id}`
    input.type = 'text'
    input.value = option.value
    input.placeholder = OPTION_PLACEHOLDERS[index] ?? '写下一个选项'
    input.autocomplete = 'off'
    input.dataset.testid = 'option-input'
    input.addEventListener('input', () => {
      option.value = input.value
    })

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

    row.append(label, input, removeButton)
    fragment.append(row)
  })

  optionList.replaceChildren(fragment)

  const isFull = options.length >= MAX_OPTION_COUNT
  rosterCount.value = `${options.length} / ${MAX_OPTION_COUNT}`
  rosterCount.textContent = `${options.length} / ${MAX_OPTION_COUNT}`
  addOptionButton.disabled = isFull
  addOptionButton.textContent = isFull ? '选手已满员' : '＋ 添加选手'

  if (focusOptionId !== undefined) {
    optionList.querySelector<HTMLInputElement>(`#option-${focusOptionId}`)?.focus()
  }
}

function addOption(): void {
  if (options.length >= MAX_OPTION_COUNT) {
    return
  }

  const newOption: OptionEntry = {
    id: nextOptionId,
    value: '',
  }

  nextOptionId += 1
  options = [...options, newOption]
  rosterStatus.textContent = `已添加第 ${options.length} 名选手`
  renderOptionRows(newOption.id)
}

function removeOption(optionId: number): void {
  if (options.length <= MIN_OPTION_COUNT) {
    return
  }

  const removedPosition = options.findIndex((option) => option.id === optionId)

  if (removedPosition === -1) {
    return
  }

  options = options.filter((option) => option.id !== optionId)
  rosterStatus.textContent = `已删除第 ${removedPosition + 1} 名选手`
  renderOptionRows()
}

addOptionButton.addEventListener('click', addOption)
renderOptionRows()
