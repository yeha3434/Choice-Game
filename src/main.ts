import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('找不到应用挂载节点 #app')
}

app.innerHTML = `
  <main class="scaffold-shell">
    <section class="scaffold-card" aria-labelledby="scaffold-title">
      <p class="scaffold-kicker">纠结运动会</p>
      <h1 id="scaffold-title">项目骨架已就位</h1>
      <p class="scaffold-copy">
        现在只有开发与测试基础设施。输入选项、角色和比赛将在后续阶段逐项加入。
      </p>
      <span class="stage-badge" data-testid="stage">阶段 0</span>
    </section>
  </main>
`
