import './style.css'
import { createRaceSimulation, type RacerTimeline } from './race-engine'
import { createRaceEvents, eventTime } from './race-events'
import {
  CHARACTERS,
  createCharacterAssignments,
  getCharacter,
  isCharacterId,
  selectCharacter,
  type CharacterAssignment,
} from './characters'
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
        <h1 id="page-title" class="site-title" aria-label="选什么">
          <span class="title-glyph title-glyph--one" aria-hidden="true">选</span>
          <span class="title-glyph title-glyph--two" aria-hidden="true">什</span>
          <span class="title-glyph title-glyph--three" aria-hidden="true">么</span>
        </h1>
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
          <span>抽取角色</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <section id="character-selection" class="character-selection" tabindex="-1" hidden>
        <div class="character-selection-heading">
          <div>
            <p class="prepared-kicker">角色抽签处</p>
            <h3>选手造型已出炉</h3>
          </div>
          <button id="randomize-characters" class="randomize-button" type="button">
            ↻ 重新抽签
          </button>
        </div>
        <p id="character-summary" class="character-summary"></p>
        <p class="swap-hint">手动选择已占用的角色时，两名选手会交换角色。</p>
        <div id="character-grid" class="character-grid"></div>
      </section>

      <section id="race-stadium" class="race-stadium" aria-labelledby="stadium-title" hidden>
        <div class="stadium-heading">
          <div>
            <p class="stadium-kicker">社区运动场 · 赛前预览</p>
            <h3 id="stadium-title">跑道已经铺好</h3>
          </div>
          <span class="fairness-badge">每位选手机会相同</span>
        </div>

        <div class="race-controls">
          <button id="race-go" class="start-race-button" type="button">开始比赛 →</button>
          <p id="race-status" aria-live="polite">选手已就位，等待发令。</p>
        </div>

        <div class="stadium-scene">
          <div class="start-banner"><span>各位选手，请就位</span></div>

          <div class="spectator-row" aria-label="场边观众">
            <div class="spectator" data-testid="spectator-bird" role="img" aria-label="把加油牌举反的小鸟">
              <svg viewBox="0 0 110 82" aria-hidden="true">
                <path d="M21 64 Q27 43 45 46 Q63 48 67 66" fill="#ffe169" stroke="#432519" stroke-width="4" />
                <circle cx="37" cy="51" r="3" fill="#432519" />
                <path d="M46 55 L57 59 L47 63 Z" fill="#ef7842" stroke="#432519" stroke-width="2" />
                <path d="M30 66 L25 78 M52 66 L58 78" stroke="#432519" stroke-linecap="round" stroke-width="4" />
                <path d="M15 45 L30 55 M67 48 L79 38" stroke="#432519" stroke-linecap="round" stroke-width="4" />
                <g transform="rotate(180 75 24)">
                  <rect x="50" y="8" width="50" height="30" rx="4" fill="#fffdf6" stroke="#432519" stroke-width="3" />
                  <text x="75" y="28" fill="#bc472f" font-size="13" font-weight="900" text-anchor="middle">加油</text>
                </g>
              </svg>
              <span>牌子好像反了</span>
            </div>

            <div class="spectator" data-testid="spectator-cat" role="img" aria-label="专心吃零食的猫">
              <svg viewBox="0 0 110 82" aria-hidden="true">
                <path d="M29 33 L35 17 L47 31 Q59 25 70 31 L82 17 L85 40 Q86 62 59 65 Q31 63 29 42 Z" fill="#e7a35c" stroke="#432519" stroke-linejoin="round" stroke-width="4" />
                <circle cx="46" cy="42" r="3" fill="#432519" />
                <circle cx="69" cy="42" r="3" fill="#432519" />
                <path d="M55 49 L60 49 L58 54 Z" fill="#ef7842" stroke="#432519" stroke-width="2" />
                <path d="M25 58 Q11 51 14 39" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="5" />
                <path d="M45 65 L42 78 M71 64 L76 77" stroke="#432519" stroke-linecap="round" stroke-width="4" />
                <path d="M87 49 L101 46 L98 70 L84 68 Z" fill="#ef6548" stroke="#432519" stroke-width="3" />
                <circle cx="92" cy="55" r="3" fill="#ffe169" />
              </svg>
              <span>比赛哪有零食香</span>
            </div>

            <div class="spectator" data-testid="spectator-referee" role="img" aria-label="反应慢半拍的裁判">
              <svg viewBox="0 0 110 82" aria-hidden="true">
                <circle cx="54" cy="27" r="15" fill="#f3bb87" stroke="#432519" stroke-width="4" />
                <path d="M37 25 Q53 4 72 22 L69 27 L39 27 Z" fill="#5d4eb5" stroke="#432519" stroke-linejoin="round" stroke-width="4" />
                <path d="M42 46 Q54 39 68 46 L75 76 L34 76 Z" fill="#fffdf6" stroke="#432519" stroke-linejoin="round" stroke-width="4" />
                <path d="M42 31 Q48 35 53 31 M59 31 Q64 35 69 31" fill="none" stroke="#432519" stroke-linecap="round" stroke-width="3" />
                <circle cx="84" cy="51" r="10" fill="#ffe169" stroke="#432519" stroke-width="3" />
                <path d="M84 51 L84 45 M84 51 L89 54" stroke="#432519" stroke-linecap="round" stroke-width="2" />
                <path d="M70 51 L82 50" stroke="#432519" stroke-linecap="round" stroke-width="4" />
              </svg>
              <span>哨子还没找着</span>
            </div>
          </div>

          <div class="track-wrap">
            <div id="race-lanes" class="race-lanes"></div>
            <div class="finish-line" aria-hidden="true"></div>
            <div class="finish-ribbon" aria-label="终点彩带">终点</div>
          </div>

          <div class="stadium-footer">
            <p>暖橘跑道已就位，白线由社区志愿者自由发挥。</p>
            <div class="cardboard-podium" data-testid="cardboard-podium" role="img" aria-label="纸箱领奖台">
              <div class="podium-box podium-box--second"><span>2</span></div>
              <div class="podium-box podium-box--first"><span>1</span></div>
              <div class="podium-box podium-box--third"><span>3</span></div>
            </div>
          </div>
        </div>
      </section>

      <p id="roster-status" class="visually-hidden" aria-live="polite"></p>

      <aside class="stage-note" aria-label="当前开发阶段">
        <span class="stage-note-label">阶段 6</span>
        <span>倒计时后开始赛跑，皇冠跟随领先选手。</span>
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
const characterSelection = getRequiredElement<HTMLElement>('character-selection')
const characterSummary = getRequiredElement<HTMLParagraphElement>('character-summary')
const characterGrid = getRequiredElement<HTMLDivElement>('character-grid')
const randomizeCharactersButton = getRequiredElement<HTMLButtonElement>('randomize-characters')
const raceStadium = getRequiredElement<HTMLElement>('race-stadium')
const raceLanes = getRequiredElement<HTMLDivElement>('race-lanes')
const raceGo = getRequiredElement<HTMLButtonElement>('race-go')
const raceStatus = getRequiredElement<HTMLParagraphElement>('race-status')

let nextOptionId = MIN_RACE_OPTION_COUNT + 1
let options: RawRaceOption[] = Array.from({ length: MIN_RACE_OPTION_COUNT }, (_, index) => ({
  id: index + 1,
  value: '',
}))
let selectedRaceOptions: RaceOption[] = []
let characterAssignments: CharacterAssignment[] = []
let raceFrame = 0
let racing = false

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)

  if (!element) {
    throw new Error(`找不到必需的页面元素 #${id}`)
  }

  return element as T
}

function clearCharacterSelection(): void {
  cancelAnimationFrame(raceFrame)
  racing = false
  raceGo.disabled = false
  raceStatus.textContent = '选手已就位，等待发令。'
  raceStadium.dataset.state = 'ready'
  characterSelection.hidden = true
  characterGrid.replaceChildren()
  raceStadium.hidden = true
  raceLanes.replaceChildren()
  selectedRaceOptions = []
  characterAssignments = []
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
      clearCharacterSelection()
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
  clearCharacterSelection()
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
  clearCharacterSelection()
  rosterStatus.textContent = `已删除第 ${removedPosition + 1} 名选手`
  renderOptionRows()
}

function renderCharacterCards(focusOptionId?: number): void {
  const fragment = document.createDocumentFragment()

  selectedRaceOptions.forEach((option, index) => {
    const assignment = characterAssignments.find(({ optionId }) => optionId === option.id)

    if (!assignment) {
      throw new Error(`找不到选手 ${option.id} 的角色`)
    }

    const character = getCharacter(assignment.characterId)
    const card = document.createElement('article')
    card.className = 'character-card'
    card.dataset.testid = 'character-card'
    card.dataset.optionId = String(option.id)
    card.dataset.characterId = character.id

    const cardHeading = document.createElement('div')
    cardHeading.className = 'character-card-heading'

    const identity = document.createElement('div')
    identity.className = 'racer-identity'

    const number = document.createElement('span')
    number.className = 'racer-number'
    number.textContent = String(index + 1).padStart(2, '0')

    const optionName = document.createElement('h4')
    optionName.className = 'racer-option-name'
    optionName.title = option.name
    optionName.textContent = option.name

    identity.append(number, optionName)

    const badge = document.createElement('span')
    badge.className = 'character-badge'
    badge.textContent = '抽签角色'
    cardHeading.append(identity, badge)

    const cardBody = document.createElement('div')
    cardBody.className = 'character-card-body'

    const artwork = document.createElement('div')
    artwork.className = 'character-artwork'
    artwork.dataset.testid = 'character-artwork'
    artwork.innerHTML = character.svg

    const copy = document.createElement('div')
    copy.className = 'character-copy'

    const characterName = document.createElement('p')
    characterName.className = 'character-name'
    characterName.textContent = character.name

    const tagline = document.createElement('p')
    tagline.className = 'character-tagline'
    tagline.textContent = character.tagline

    const selectLabel = document.createElement('label')
    selectLabel.className = 'character-select-label'
    selectLabel.textContent = '手动换角色'

    const select = document.createElement('select')
    select.className = 'character-select'
    select.dataset.testid = 'character-select'
    select.setAttribute('aria-label', `为“${option.name}”选择角色`)

    for (const availableCharacter of CHARACTERS) {
      const selectOption = document.createElement('option')
      const isUsedByAnother = characterAssignments.some(
        (otherAssignment) =>
          otherAssignment.optionId !== option.id &&
          otherAssignment.characterId === availableCharacter.id,
      )

      selectOption.value = availableCharacter.id
      selectOption.selected = availableCharacter.id === character.id
      selectOption.textContent = isUsedByAnother
        ? `${availableCharacter.name}（交换）`
        : availableCharacter.name
      select.append(selectOption)
    }

    select.addEventListener('change', () => {
      if (!isCharacterId(select.value)) {
        return
      }

      characterAssignments = selectCharacter(characterAssignments, option.id, select.value)
      const selectedCharacter = getCharacter(select.value)
      rosterStatus.textContent = `${option.name} 已换成${selectedCharacter.name}`
      renderCharacterCards(option.id)
    })

    selectLabel.append(select)
    copy.append(characterName, tagline, selectLabel)
    cardBody.append(artwork, copy)
    card.append(cardHeading, cardBody)
    fragment.append(card)
  })

  characterGrid.replaceChildren(fragment)
  renderRaceLanes()

  if (focusOptionId !== undefined) {
    characterGrid
      .querySelector<HTMLSelectElement>(
        `.character-card[data-option-id="${focusOptionId}"] .character-select`,
      )
      ?.focus()
  }
}

function renderRaceLanes(): void {
  const fragment = document.createDocumentFragment()

  selectedRaceOptions.forEach((option, index) => {
    const assignment = characterAssignments.find(({ optionId }) => optionId === option.id)

    if (!assignment) {
      throw new Error(`找不到选手 ${option.id} 的跑道角色`)
    }

    const character = getCharacter(assignment.characterId)
    const lane = document.createElement('div')
    lane.className = 'race-lane'
    lane.dataset.testid = 'race-lane'
    lane.dataset.optionId = String(option.id)
    lane.dataset.characterId = character.id
    lane.setAttribute('role', 'group')
    lane.setAttribute('aria-label', `第 ${index + 1} 道，${option.name}，角色${character.name}`)

    const laneInfo = document.createElement('div')
    laneInfo.className = 'lane-info'

    const laneNumber = document.createElement('span')
    laneNumber.className = 'lane-number'
    laneNumber.textContent = `第 ${index + 1} 道`

    const optionName = document.createElement('span')
    optionName.className = 'lane-option-name'
    optionName.dataset.testid = 'lane-option-name'
    optionName.title = option.name
    optionName.textContent = option.name
    laneInfo.append(laneNumber, optionName)

    const runner = document.createElement('div')
    runner.className = 'lane-runner'

    const crown = document.createElement('span')
    crown.className = 'leader-crown'
    crown.textContent = '♛'
    crown.hidden = true
    crown.setAttribute('aria-label', '当前领先')

    const eventBubble = document.createElement('span')
    eventBubble.className = 'event-bubble'
    eventBubble.hidden = true
    const obstacle = document.createElement('span')
    obstacle.className = 'event-obstacle'
    obstacle.hidden = true
    obstacle.setAttribute('aria-hidden', 'true')

    const artwork = document.createElement('div')
    artwork.className = 'lane-character-art'
    artwork.innerHTML = character.svg

    const characterName = document.createElement('span')
    characterName.className = 'lane-character-name'
    characterName.textContent = character.name
    runner.append(crown, eventBubble, obstacle, artwork, characterName)

    const distance = document.createElement('div')
    distance.className = 'lane-distance'
    distance.setAttribute('aria-hidden', 'true')
    distance.append(
      document.createElement('span'),
      document.createElement('span'),
      document.createElement('span'),
    )

    lane.append(laneInfo, runner, distance)
    fragment.append(lane)
  })

  raceLanes.replaceChildren(fragment)
}

function prepareCharacterSelection(raceOptions: readonly RaceOption[]): void {
  raceStadium.dataset.state = 'ready'
  raceStatus.textContent = '选手已就位，等待发令。'
  raceGo.textContent = '开始比赛 →'
  selectedRaceOptions = raceOptions.map((option) => ({ ...option }))
  characterAssignments = createCharacterAssignments(
    selectedRaceOptions.map(({ id }) => id),
  )
  characterSummary.textContent = `${selectedRaceOptions.length} 名选手已随机分配不重复角色；角色不会影响获胜机会。`
  renderCharacterCards()
  characterSelection.hidden = false
  raceStadium.hidden = false
  characterSelection.focus()
}

addOptionButton.addEventListener('click', addOption)
optionForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const validation = updateValidation()

  if (!validation.isValid) {
    return
  }

  prepareCharacterSelection(validation.options)
})
randomizeCharactersButton.addEventListener('click', () => {
  if (selectedRaceOptions.length === 0) {
    return
  }

  characterAssignments = createCharacterAssignments(
    selectedRaceOptions.map(({ id }) => id),
  )
  renderCharacterCards()
  rosterStatus.textContent = '已为全部选手重新抽取角色'
})

function progressAt(racer: RacerTimeline, elapsed: number): number {
  const frames = racer.keyframes
  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1]
    const next = frames[index]
    if (previous && next && elapsed <= next.atMs) {
      const fraction = Math.max(0, (elapsed - previous.atMs) / (next.atMs - previous.atMs))
      return previous.progress + (next.progress - previous.progress) * fraction
    }
  }
  return 1
}

function setEntryLocked(locked: boolean): void {
  optionForm.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach((item) => {
    item.disabled = locked
  })
  characterSelection.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button, select').forEach((item) => {
    item.disabled = locked
  })
  if (!locked) renderOptionRows()
}

raceGo.addEventListener('click', () => {
  if (racing || selectedRaceOptions.length < 2) return
  racing = true
  raceGo.disabled = true
  setEntryLocked(true)
  renderRaceLanes()
  const simulation = createRaceSimulation(selectedRaceOptions.map(({ id }) => id))
  const events = createRaceEvents(selectedRaceOptions.map(({ id }) => id))
  const startedAt = performance.now()
  raceStadium.dataset.state = 'countdown'

  function tick(now: number): void {
    const elapsed = now - startedAt
    if (elapsed < 3000) {
      raceStatus.textContent = String(3 - Math.floor(elapsed / 1000))
      raceFrame = requestAnimationFrame(tick)
      return
    }
    const raceElapsed = elapsed - 3000
    raceStadium.dataset.state = 'running'
    raceStatus.textContent = raceElapsed < 3500 ? '起跑！' : raceElapsed < 13500 ? '比赛途中' : '最后冲刺！'
    let leaderId = -1
    let leaderProgress = -1
    let leaderFinishTime = Infinity
    for (const racer of simulation.racers) {
      const event = events.find((item) => item.optionId === racer.optionId && raceElapsed >= item.startMs && raceElapsed < item.endMs)
      const progress = progressAt(racer, event ? eventTime(raceElapsed, event) : raceElapsed)
      const lane = raceLanes.querySelector<HTMLElement>(`[data-option-id="${racer.optionId}"]`)
      lane?.style.setProperty('--progress', String(progress))
      if (lane) {
        const eventChanged = lane.dataset.event !== (event?.type ?? '')
        lane.dataset.event = event?.type ?? ''
        const bubble = lane.querySelector<HTMLElement>('.event-bubble')
        const obstacle = lane.querySelector<HTMLElement>('.event-obstacle')
        if (bubble) {
          bubble.hidden = !event
          bubble.textContent = event?.type === 'boost' ? '借点风！' : event?.type === 'fall' ? '哎呀！' : '让我缓缓…'
        }
        if (obstacle && eventChanged) {
          obstacle.hidden = !event || event.type === 'tired'
          obstacle.innerHTML = event?.type === 'boost'
            ? '<svg viewBox="0 0 40 40"><circle cx="20" cy="19" r="16" fill="#c3e7e6" stroke="#432519" stroke-width="3"/><path d="M20 19 Q10 8 20 6 Q27 8 20 19 Q32 9 33 19 Q31 27 20 19 Q28 31 18 32 Q11 29 20 19Z" fill="#66b8b2" stroke="#432519" stroke-width="2"/><path d="M20 35v4" stroke="#432519" stroke-width="3"/></svg>'
            : event?.obstacle === 'puddle'
              ? '<svg viewBox="0 0 40 28"><path d="M3 20 Q8 12 15 16 Q21 8 26 16 Q34 14 37 21 Q31 27 20 24 Q9 27 3 20Z" fill="#8fd6e0" stroke="#432519" stroke-width="3"/></svg>'
              : '<svg viewBox="0 0 40 28"><path d="M4 23 Q14 21 17 9 L20 3 L23 10 Q27 19 36 22 Q30 27 23 23 L20 17 Q17 24 10 25Z" fill="#ffe169" stroke="#432519" stroke-width="3" stroke-linejoin="round"/></svg>'
        }
      }
      if (progress > leaderProgress || (progress === leaderProgress && racer.finishTimeMs < leaderFinishTime)) {
        leaderProgress = progress
        leaderId = racer.optionId
        leaderFinishTime = racer.finishTimeMs
      }
    }
    for (const lane of raceLanes.querySelectorAll<HTMLElement>('.race-lane')) {
      const crown = lane.querySelector<HTMLElement>('.leader-crown')
      if (crown) crown.hidden = Number(lane.dataset.optionId) !== leaderId
    }
    if (raceElapsed < simulation.durationMs) {
      raceFrame = requestAnimationFrame(tick)
      return
    }
    racing = false
    raceStadium.dataset.state = 'finished'
    const winner = selectedRaceOptions.find(({ id }) => id === simulation.winnerOptionId)
    raceStatus.textContent = `冲线！${winner?.name ?? '选手'}获得第一名。`
    raceGo.disabled = false
    raceGo.textContent = '再看一场 →'
    setEntryLocked(false)
  }
  raceFrame = requestAnimationFrame(tick)
})

renderOptionRows()
