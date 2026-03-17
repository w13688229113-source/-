import { startTransition, useEffect, useState } from 'react'
import './App.css'
import {
  buildDashboardSnapshot,
  buildNodeChain,
  buildOrdersView,
  buildRiskCenter,
  buildRoutePlan,
  createInitialRunState,
  demoScenario,
  getOrderById,
  getRoleById,
  getTabById,
  platformTabs,
  processTrack,
  refreshRunStateMeta,
  roleProfiles,
  simulateDispatch,
  weatherLabels,
  congestionLabels,
} from './data/siteContent'
import type {
  DispatchInput,
  OrderRecord,
  ResponseAction,
  SystemRunState,
  TabId,
} from './types'

const riskToneClass = {
  低: 'tone-low',
  中: 'tone-medium',
  高: 'tone-high',
}

const severityToneClass = {
  蓝: 'tone-info',
  黄: 'tone-warn',
  橙: 'tone-danger',
}

const statusToneClass = {
  正常: 'status-normal',
  预警: 'status-warning',
  应急: 'status-emergency',
}

const loadToneClass = {
  低: 'load-low',
  中: 'load-medium',
  高: 'load-high',
}

const pushEvent = (items: string[], nextItem: string) =>
  [nextItem, ...items.filter((item) => item !== nextItem)].slice(0, 4)

const ScreenLead = ({
  title,
  description,
  order,
  routeId,
  riskLevel,
  roleSignal,
}: {
  title: string
  description: string
  order: OrderRecord
  routeId: string
  riskLevel: '低' | '中' | '高'
  roleSignal: string
}) => (
  <div className="screen-lead">
    <div>
      <p className="screen-lead__eyebrow">{title}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="context-strip">
      <span>当前执行链路 {order.code}</span>
      <span>航线 {routeId}</span>
      <span>风险 {riskLevel}</span>
      <span>{roleSignal}</span>
    </div>
  </div>
)

function App() {
  const [runState, setRunState] = useState<SystemRunState>(() => createInitialRunState())

  const activeTabMeta = getTabById(runState.activeTab)
  const activeRole = getRoleById(runState.activeRole)
  const orders = buildOrdersView(
    runState.selectedOrderId,
    runState.dispatchInput,
    runState.activeStage,
  )
  const selectedOrder =
    orders.find((order) => order.id === runState.selectedOrderId) ?? orders[0]
  const flags = {
    rerouteApplied: runState.rerouteApplied,
    lowBatteryAlert: runState.lowBatteryAlert,
    groundRelay: runState.groundRelay,
    delaySecondary: runState.delaySecondary,
    nodePressureBoost: runState.nodePressureBoost,
  }
  const dispatchResult = simulateDispatch(selectedOrder, runState.dispatchInput, flags)
  const routePlan = buildRoutePlan(selectedOrder, runState.dispatchInput, dispatchResult, flags)
  const nodeChain = buildNodeChain(selectedOrder, runState.dispatchInput, dispatchResult, flags)
  const riskCenter = buildRiskCenter(
    selectedOrder,
    runState.dispatchInput,
    dispatchResult,
    flags,
    runState.updatedAt,
  )
  const dashboard = buildDashboardSnapshot(
    orders,
    dispatchResult,
    nodeChain,
    riskCenter,
    runState,
  )

  const activeTabIndex = platformTabs.findIndex((tab) => tab.id === runState.activeTab)
  const currentDemoStep =
    runState.demoStepIndex >= 0 ? demoScenario[runState.demoStepIndex] : undefined

  const commitState = (updater: (current: SystemRunState) => SystemRunState) => {
    setRunState((current) => refreshRunStateMeta(updater(current)))
  }

  const handleTabChange = (tabId: TabId) => {
    const targetTab = getTabById(tabId)
    startTransition(() => {
      commitState((current) => ({
        ...current,
        activeTab: targetTab.id,
        activeStage: targetTab.stage,
      }))
    })
  }

  const updateDispatchInput = <K extends keyof DispatchInput>(
    key: K,
    value: DispatchInput[K],
  ) => {
    commitState((current) => ({
      ...current,
      dispatchInput: {
        ...current.dispatchInput,
        [key]: value,
      },
      eventLog: pushEvent(current.eventLog, '调度约束已更新'),
    }))
  }

  const selectOrder = (orderId: string) => {
    const order = getOrderById(orderId)
    commitState((current) => ({
      ...current,
      selectedOrderId: orderId,
      dispatchInput: {
        ...current.dispatchInput,
        orderWeight: order.weight,
        priority: order.priority,
      },
      eventLog: pushEvent(current.eventLog, `${order.code} 已载入当前执行链路`),
    }))
  }

  const handleRoleChange = (roleId: SystemRunState['activeRole']) => {
    commitState((current) => ({
      ...current,
      activeRole: roleId,
      eventLog: pushEvent(current.eventLog, `${getRoleById(roleId).label} 已切换`),
    }))
  }

  const executeResponseAction = (actionId: ResponseAction['id']) => {
    commitState((current) => {
      const next = { ...current, activeTab: 'risk' as const, activeStage: 'risk' as const }

      if (actionId === 'reroute') {
        next.rerouteApplied = true
        next.eventLog = pushEvent(next.eventLog, '系统已执行自动重算路径')
      }

      if (actionId === 'swap-drone') {
        next.lowBatteryAlert = false
        next.rerouteApplied = true
        next.eventLog = pushEvent(next.eventLog, '系统已切换备用无人机接力')
      }

      if (actionId === 'delay-low') {
        next.delaySecondary = true
        next.nodePressureBoost = Math.max(1, next.nodePressureBoost - 1)
        next.eventLog = pushEvent(next.eventLog, '系统已顺延低优先级订单')
      }

      if (actionId === 'ground-relay') {
        next.groundRelay = true
        next.dispatchInput = {
          ...next.dispatchInput,
          congestionLevel: Math.max(0, next.dispatchInput.congestionLevel - 1),
        }
        next.eventLog = pushEvent(next.eventLog, '系统已启用地面短驳建议')
      }

      return next
    })
  }

  const applyDemoStep = (current: SystemRunState, stepIndex: number) => {
    const step = demoScenario[stepIndex]
    const demoOrder = getOrderById('order-2048')
    const next: SystemRunState = {
      ...current,
      activeTab: step.tab,
      activeStage: step.stage,
      selectedOrderId: demoOrder.id,
      demoMode: 'running',
      demoStepIndex: stepIndex,
      eventLog: pushEvent(current.eventLog, step.eventTitle),
      dispatchInput: {
        ...current.dispatchInput,
        orderWeight: demoOrder.weight,
        priority: demoOrder.priority,
      },
    }

    if (step.id === 'demo-order') {
      next.dispatchInput = {
        ...next.dispatchInput,
        weatherLevel: 1,
        congestionLevel: 1,
        availableDrones: 4,
        riskThreshold: 68,
      }
      next.rerouteApplied = false
      next.lowBatteryAlert = false
      next.groundRelay = false
      next.delaySecondary = false
      next.nodePressureBoost = 1
    }

    if (step.id === 'demo-dispatch') {
      next.dispatchInput = {
        ...next.dispatchInput,
        availableDrones: 5,
        riskThreshold: 70,
      }
    }

    if (step.id === 'demo-route') {
      next.dispatchInput = {
        ...next.dispatchInput,
        weatherLevel: 1,
      }
    }

    if (step.id === 'demo-node') {
      next.dispatchInput = {
        ...next.dispatchInput,
        congestionLevel: 2,
      }
      next.nodePressureBoost = 2
    }

    if (step.id === 'demo-risk') {
      next.dispatchInput = {
        ...next.dispatchInput,
        weatherLevel: 3,
        congestionLevel: 2,
      }
      next.lowBatteryAlert = true
      next.rerouteApplied = false
      next.groundRelay = false
      next.delaySecondary = false
    }

    if (step.id === 'demo-feedback') {
      next.dispatchInput = {
        ...next.dispatchInput,
        weatherLevel: 2,
        congestionLevel: 1,
      }
      next.lowBatteryAlert = false
      next.rerouteApplied = true
      next.groundRelay = true
      next.delaySecondary = true
      next.nodePressureBoost = 1
    }

    return refreshRunStateMeta(next, stepIndex * 9)
  }

  const startDemo = () => {
    startTransition(() => {
      setRunState(() => applyDemoStep(createInitialRunState(), 0))
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }

      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }

      event.preventDefault()
      const delta = event.key === 'ArrowRight' ? 1 : -1

      startTransition(() => {
        setRunState((current) => {
          const currentIndex = platformTabs.findIndex((tab) => tab.id === current.activeTab)
          const nextIndex = (currentIndex + delta + platformTabs.length) % platformTabs.length
          const nextTab = platformTabs[nextIndex]

          return refreshRunStateMeta({
            ...current,
            activeTab: nextTab.id,
            activeStage: nextTab.stage,
          })
        })
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (runState.demoMode !== 'running') {
      return
    }

    if (runState.demoStepIndex >= demoScenario.length - 1) {
      const finishTimer = window.setTimeout(() => {
        setRunState((current) =>
          refreshRunStateMeta({
            ...current,
            demoMode: 'completed',
            eventLog: pushEvent(current.eventLog, '典型订单闭环演示已完成'),
          }),
        )
      }, 1200)

      return () => window.clearTimeout(finishTimer)
    }

    const nextStep = demoScenario[runState.demoStepIndex + 1]
    const timer = window.setTimeout(() => {
      setRunState((current) => applyDemoStep(current, current.demoStepIndex + 1))
    }, nextStep.durationMs)

    return () => window.clearTimeout(timer)
  }, [runState.demoMode, runState.demoStepIndex])

  const demoProgress =
    runState.demoMode === 'idle'
      ? 0
      : ((runState.demoStepIndex + 1) / demoScenario.length) * 100

  return (
    <div className="page-shell">
      <div className="system-shell">
        <header className="console-header">
          <div className="brand-cluster">
            <div className="brand-mark">TL</div>
            <div>
              <strong>天路智网</strong>
              <span>高山低空物流智能调度平台原型</span>
            </div>
          </div>

          <nav className="tab-nav" aria-label="平台主导航">
            {platformTabs.map((tab) => (
              <button
                key={tab.id}
                className={tab.id === runState.activeTab ? 'tab-button tab-button--active' : 'tab-button'}
                type="button"
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.short}</span>
                <strong>{tab.label}</strong>
              </button>
            ))}
          </nav>

          <div className="header-tools">
            <div className="role-switch">
              {roleProfiles.map((role) => (
                <button
                  key={role.id}
                  className={role.id === runState.activeRole ? 'role-pill role-pill--active' : 'role-pill'}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <button
              className="demo-button"
              type="button"
              onClick={startDemo}
              disabled={runState.demoMode === 'running'}
            >
              {runState.demoMode === 'running'
                ? '演示进行中'
                : runState.demoMode === 'completed'
                  ? '重新演示典型订单'
                  : '一键演示典型订单'}
            </button>
          </div>
        </header>

        <div className="process-rail">
          <div className="process-rail__track" aria-label="系统运行闭环">
            {processTrack.map((item, index) => {
              const activeIndex = processTrack.findIndex(
                (stage) => stage.id === runState.activeStage,
              )
              const itemState =
                index < activeIndex
                  ? 'process-item process-item--done'
                  : index === activeIndex
                    ? 'process-item process-item--active'
                    : 'process-item'

              return (
                <div className={itemState} key={item.id}>
                  <span className="process-item__dot" />
                  <strong>{item.label}</strong>
                </div>
              )
            })}
          </div>
          <div className="process-rail__meta">
            <span>{activeTabMeta.description}</span>
            <span>
              {currentDemoStep
                ? `${currentDemoStep.label} · ${currentDemoStep.eventDetail}`
                : '系统处于可演示状态，可手动切换标签或直接一键跑完整链路。'}
            </span>
          </div>
        </div>

        <main className="workspace-frame">
          <div
            className="workspace-track"
            style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
          >
            <section className="screen">
              <ScreenLead
                title="总览驾驶舱"
                description="只回答三件事：系统现在在干什么、当前哪里最值得看、平台价值体现在哪里。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="dashboard-layout">
                <article className="panel panel--metrics">
                  <div className="panel-head">
                    <p>当前系统在干什么</p>
                    <span>{runState.systemStatus}</span>
                  </div>
                  <div className="metric-grid">
                    {dashboard.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className={`metric-tile ${metric.tone ? `metric-tile--${metric.tone}` : ''}`}
                      >
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel panel--focus">
                  <div className="panel-head">
                    <p>重点事件区</p>
                    <span>最值得看</span>
                  </div>
                  <h3>{dashboard.focusEvent.title}</h3>
                  <p>{dashboard.focusEvent.detail}</p>
                  <div className="focus-action">{dashboard.focusEvent.action}</div>
                </article>

                <article className="panel panel--value">
                  <div className="panel-head">
                    <p>价值回流</p>
                    <span>调度优化创造价值</span>
                  </div>
                  <div className="value-grid">
                    {dashboard.valueMetrics.map((item) => (
                      <div className="value-card" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel panel--eventlog">
                  <div className="panel-head">
                    <p>运行回流日志</p>
                    <span>{activeRole.label}</span>
                  </div>
                  <div className="role-callout">
                    <strong>{activeRole.focusTitle}</strong>
                    <ul>
                      {activeRole.focusItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="event-log">
                    {runState.eventLog.map((item) => (
                      <div className="event-log__item" key={item}>
                        <span />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="screen">
              <ScreenLead
                title="订单管理"
                description="所有订单都先进入统一订单面板，再进入后续调度、航线、节点和风险链路。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="orders-layout">
                <article className="panel panel--orders">
                  <div className="panel-head">
                    <p>待分配订单</p>
                    <span>点击任一订单同步全站上下文</span>
                  </div>

                  <div className="table-shell">
                    <div className="table-head">
                      <span>订单编号</span>
                      <span>品类</span>
                      <span>重量</span>
                      <span>时效等级</span>
                      <span>起点 / 终点</span>
                      <span>状态</span>
                    </div>

                    <div className="table-body">
                      {orders.map((order) => (
                        <button
                          key={order.id}
                          className={
                            order.id === selectedOrder.id
                              ? 'table-row table-row--active'
                              : 'table-row'
                          }
                          type="button"
                          onClick={() => selectOrder(order.id)}
                        >
                          <span>{order.code}</span>
                          <span>{order.product}</span>
                          <span>{order.weight} kg</span>
                          <span>{order.priority}</span>
                          <span>
                            {order.origin} → {order.destination}
                          </span>
                          <span>{order.status}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="panel panel--order-detail">
                  <div className="panel-head">
                    <p>当前执行链路</p>
                    <span>{selectedOrder.code}</span>
                  </div>
                  <div className="order-summary">
                    <h3>{selectedOrder.product}</h3>
                    <div className="summary-pills">
                      <span>{selectedOrder.priority}</span>
                      <span>{selectedOrder.weight} kg</span>
                      <span>截止 {selectedOrder.deadline}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>起点节点</dt>
                        <dd>{selectedOrder.origin}</dd>
                      </div>
                      <div>
                        <dt>目标节点</dt>
                        <dd>{dispatchResult.targetNode}</dd>
                      </div>
                      <div>
                        <dt>推荐航线</dt>
                        <dd>{dispatchResult.routeId}</dd>
                      </div>
                      <div>
                        <dt>当前风险等级</dt>
                        <dd>{dispatchResult.riskLevel}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="order-notice">
                    <strong>系统说明</strong>
                    <p>
                      选择订单后，智能调度会自动载入订单重量与时效等级，航线规划、节点协同和风险处置都跟随切换。
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <section className="screen">
              <ScreenLead
                title="智能调度"
                description="把输入约束、调度决策和价值结果放在同一屏里，让它更像算法决策中枢，而不是表单模拟器。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="dispatch-layout">
                <article className="panel panel--constraint">
                  <div className="panel-head">
                    <p>输入约束</p>
                    <span>约束变化会实时联动全站</span>
                  </div>
                  <div className="control-stack">
                    <label className="control-card">
                      <div>
                        <span>订单重量</span>
                        <strong>{runState.dispatchInput.orderWeight} kg</strong>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="360"
                        value={runState.dispatchInput.orderWeight}
                        onChange={(event) =>
                          updateDispatchInput('orderWeight', Number(event.target.value))
                        }
                      />
                    </label>

                    <label className="control-card">
                      <div>
                        <span>天气等级</span>
                        <strong>{weatherLabels[runState.dispatchInput.weatherLevel]}</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={runState.dispatchInput.weatherLevel}
                        onChange={(event) =>
                          updateDispatchInput('weatherLevel', Number(event.target.value))
                        }
                      />
                    </label>

                    <label className="control-card">
                      <div>
                        <span>节点拥堵</span>
                        <strong>{congestionLabels[runState.dispatchInput.congestionLevel]}</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={runState.dispatchInput.congestionLevel}
                        onChange={(event) =>
                          updateDispatchInput('congestionLevel', Number(event.target.value))
                        }
                      />
                    </label>

                    <label className="control-card">
                      <div>
                        <span>可用无人机数</span>
                        <strong>{runState.dispatchInput.availableDrones} 架</strong>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="6"
                        value={runState.dispatchInput.availableDrones}
                        onChange={(event) =>
                          updateDispatchInput('availableDrones', Number(event.target.value))
                        }
                      />
                    </label>

                    <label className="control-card">
                      <div>
                        <span>风险阈值</span>
                        <strong>{runState.dispatchInput.riskThreshold}</strong>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="90"
                        value={runState.dispatchInput.riskThreshold}
                        onChange={(event) =>
                          updateDispatchInput('riskThreshold', Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <div className="priority-switch">
                    {(['标准', '优先', '抢鲜'] as const).map((priority) => (
                      <button
                        key={priority}
                        className={
                          priority === runState.dispatchInput.priority
                            ? 'priority-chip priority-chip--active'
                            : 'priority-chip'
                        }
                        type="button"
                        onClick={() => updateDispatchInput('priority', priority)}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </article>

                <article className="panel panel--decision">
                  <div className="panel-head">
                    <p>调度决策</p>
                    <span>全站主角页</span>
                  </div>
                  <div className="decision-highlight">
                    <div>
                      <span>推荐机队</span>
                      <strong>{dispatchResult.recommendedFleet}</strong>
                    </div>
                    <span className={`risk-chip ${riskToneClass[dispatchResult.riskLevel]}`}>
                      风险 {dispatchResult.riskLevel}
                    </span>
                  </div>
                  <div className="decision-grid">
                    <div>
                      <span>调度策略</span>
                      <strong>{dispatchResult.strategy}</strong>
                    </div>
                    <div>
                      <span>是否拆单</span>
                      <strong>{dispatchResult.splitOrder ? '是' : '否'}</strong>
                    </div>
                    <div>
                      <span>主执行无人机</span>
                      <strong>{dispatchResult.primaryDrone}</strong>
                    </div>
                    <div>
                      <span>备用无人机</span>
                      <strong>{dispatchResult.backupDrone}</strong>
                    </div>
                    <div>
                      <span>目标节点</span>
                      <strong>{dispatchResult.targetNode}</strong>
                    </div>
                    <div>
                      <span>推荐航线编号</span>
                      <strong>{dispatchResult.routeId}</strong>
                    </div>
                  </div>
                  <div className="assignment-list">
                    {dispatchResult.assignments.map((item) => (
                      <div className="assignment-card" key={item.id}>
                        <strong>{item.label}</strong>
                        <span>{item.duty}</span>
                        <p>
                          {item.loadKg} kg / ETA {item.etaMinutes} min / 电量 {item.battery}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel panel--result">
                  <div className="panel-head">
                    <p>价值结果</p>
                    <span>调度优化创造价值</span>
                  </div>
                  <div className="result-metric-stack">
                    <div className="result-card">
                      <span>预计送达时间</span>
                      <strong>{dispatchResult.etaMinutes} min</strong>
                    </div>
                    <div className="result-card">
                      <span>预计运输成本</span>
                      <strong>{dispatchResult.costPerKg} 元 / kg</strong>
                    </div>
                    <div className="result-card">
                      <span>损耗改善</span>
                      <strong>{dispatchResult.lossImprovement}%</strong>
                    </div>
                    <div className="result-card">
                      <span>相比人工方案节省</span>
                      <strong>{dispatchResult.manualSaving}%</strong>
                    </div>
                    <div className="result-card result-card--wide">
                      <span>是否触发备用策略</span>
                      <strong>{dispatchResult.backupStrategy ? '已触发' : '未触发'}</strong>
                      <p>{dispatchResult.explanation}</p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section className="screen">
              <ScreenLead
                title="航线规划"
                description="这里不只是画路线，而是把候选路线、推荐路线和为什么这样飞一起讲清楚。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="route-layout">
                <article className="panel panel--map">
                  <div className="panel-head">
                    <p>山地低空航线网络</p>
                    <span>{routePlan.weatherNote}</span>
                  </div>
                  <div className="route-map">
                    <svg viewBox="0 0 780 420" aria-hidden="true">
                      <defs>
                        <linearGradient id="routeGlow" x1="0%" x2="100%">
                          <stop offset="0%" stopColor="#72e6ff" />
                          <stop offset="100%" stopColor="#5b82ff" />
                        </linearGradient>
                      </defs>
                      <path
                        className="ridge ridge--back"
                        d="M0 290 C70 250 130 220 210 240 C270 252 330 220 410 190 C470 168 520 174 590 210 C650 242 706 254 780 228"
                      />
                      <path
                        className="ridge ridge--front"
                        d="M0 330 C90 272 170 258 250 282 C320 302 382 260 466 228 C550 196 616 212 694 260 C732 282 752 292 780 288"
                      />
                      <path
                        className={
                          routePlan.recommendedId === 'route-a'
                            ? 'flight-path flight-path--active'
                            : 'flight-path'
                        }
                        d="M108 300 C180 248 242 196 320 172 C388 150 470 150 548 174 C618 196 684 230 734 250"
                      />
                      <path
                        className={
                          routePlan.recommendedId === 'route-b'
                            ? 'flight-path flight-path--active'
                            : 'flight-path flight-path--alt'
                        }
                        d="M108 300 C196 236 274 124 366 110 C452 96 548 132 624 184 C674 220 706 232 734 250"
                      />
                      <path
                        className={
                          routePlan.recommendedId === 'route-c'
                            ? 'flight-path flight-path--active'
                            : 'flight-path flight-path--relay'
                        }
                        d="M108 300 C176 294 242 310 298 334 C352 356 410 352 466 322 C520 294 594 260 734 250"
                      />
                      <circle className="map-node map-node--origin" cx="108" cy="300" r="11" />
                      <circle className="map-node map-node--relay" cx="432" cy="214" r="11" />
                      <circle className="map-node map-node--destination" cx="734" cy="250" r="11" />
                    </svg>
                    <div className="map-label map-label--origin">{selectedOrder.origin}</div>
                    <div className="map-label map-label--relay">
                      {runState.rerouteApplied ? '东侧绕行通道' : '山谷风口'}
                    </div>
                    <div className="map-label map-label--destination">{dispatchResult.targetNode}</div>
                  </div>
                </article>

                <div className="route-side">
                  <article className="panel">
                    <div className="panel-head">
                      <p>候选路线比较</p>
                      <span>为什么这么飞</span>
                    </div>
                    <div className="route-option-list">
                      {routePlan.options.map((option) => (
                        <div
                          className={
                            option.recommended
                              ? 'route-option route-option--active'
                              : 'route-option'
                          }
                          key={option.id}
                        >
                          <div className="route-option__top">
                            <strong>{option.label}</strong>
                            <span>{option.riskLabel}</span>
                          </div>
                          <p>{option.description}</p>
                          <div className="route-option__meta">
                            <span>{option.durationMinutes} min</span>
                            <span>能耗 {option.energyPercent}%</span>
                            <span>稳定性 {option.stabilityScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-head">
                      <p>决策说明卡</p>
                      <span>{dispatchResult.routeId}</span>
                    </div>
                    <div className="decision-note">
                      <h3>{routePlan.rerouteReason}</h3>
                      <p>{routePlan.decisionNote}</p>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section className="screen">
              <ScreenLead
                title="节点协同"
                description="展示的不是静态状态，而是一条正在推进的接驳链，并明确指出当前瓶颈在哪里。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="nodes-layout">
                <article className="panel panel--node-chain">
                  <div className="panel-head">
                    <p>链路协同展示</p>
                    <span>{nodeChain.throughput}</span>
                  </div>
                  <div className="node-flow">
                    {nodeChain.steps.map((step, index) => (
                      <div className="node-step" key={step.id}>
                        <div className="node-step__top">
                          <strong>{step.label}</strong>
                          <span className={`load-chip ${loadToneClass[step.load]}`}>
                            负荷 {step.load}
                          </span>
                        </div>
                        <p>{step.amountLabel}</p>
                        <p>{step.waitLabel}</p>
                        <div className="progress-bar">
                          <span style={{ width: `${step.progress}%` }} />
                        </div>
                        <small>{step.note}</small>
                        {index < nodeChain.steps.length - 1 ? <div className="node-connector" /> : null}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel panel--bottleneck">
                  <div className="panel-head">
                    <p>瓶颈定位</p>
                    <span>协同建议</span>
                  </div>
                  <div className="bottleneck-card">
                    <h3>{nodeChain.bottleneck}</h3>
                    <p>{nodeChain.suggestion}</p>
                  </div>
                  <div className="event-log event-log--compact">
                    {dispatchResult.assignments.map((item) => (
                      <div className="event-log__item" key={item.id}>
                        <span />
                        <p>
                          {item.label} · {item.duty} · {item.loadKg} kg
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section className="screen">
              <ScreenLead
                title="风险处置"
                description="风险页展示的是发现异常后系统如何处理，而不是只把异常堆成一面报警墙。"
                order={selectedOrder}
                routeId={dispatchResult.routeId}
                riskLevel={dispatchResult.riskLevel}
                roleSignal={activeRole.signal}
              />

              <div className="risk-layout">
                <article className="panel panel--risk-events">
                  <div className="panel-head">
                    <p>发现风险</p>
                    <span>{riskCenter.headline}</span>
                  </div>
                  <div className="risk-grid">
                    {riskCenter.events.map((event) => (
                      <div className="risk-event" key={event.id}>
                        <div className="risk-event__top">
                          <span className={`severity-chip ${severityToneClass[event.severity]}`}>
                            {event.severity}
                          </span>
                          <strong>{event.type}</strong>
                        </div>
                        <h3>{event.title}</h3>
                        <p>{event.detail}</p>
                        <div className="risk-event__meta">
                          <span>{event.related}</span>
                          <span>{event.detectedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel panel--response">
                  <div className="panel-head">
                    <p>系统动作</p>
                    <span>应急处置中心</span>
                  </div>
                  <div className="response-list">
                    {riskCenter.actions.map((action) => (
                      <div className="response-card" key={action.id}>
                        <div className="response-card__top">
                          <strong>{action.label}</strong>
                          <span>{action.status}</span>
                        </div>
                        <p>{action.description}</p>
                        <small>{action.effect}</small>
                        <button
                          type="button"
                          className="response-action"
                          onClick={() => executeResponseAction(action.id)}
                          disabled={action.status === '已完成'}
                        >
                          {action.status === '已完成' ? '已执行' : '执行系统动作'}
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </div>
        </main>

        <footer className="status-bar">
          <span>数据更新时间 {runState.updatedAt}</span>
          <span>当前空域状态 {runState.airspaceStatus}</span>
          <span>天气等级 {runState.weatherLabel}</span>
          <span>在线飞手 {runState.onlinePilots} 人</span>
          <span className={`status-chip ${statusToneClass[runState.systemStatus]}`}>
            系统运行状态 {runState.systemStatus}
          </span>
          <span className="demo-progress">
            演示进度
            <em>{Math.round(demoProgress)}%</em>
          </span>
        </footer>
      </div>
    </div>
  )
}

export default App
