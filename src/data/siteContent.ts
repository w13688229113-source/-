import type {
  DashboardSnapshot,
  DemoScenarioStep,
  DispatchInput,
  DispatchResult,
  NodeChainStatus,
  OrderRecord,
  PlatformTab,
  ProcessTrackItem,
  ProcessStage,
  ResponseAction,
  RiskEvent,
  RiskLevel,
  RoleProfile,
  RoutePlan,
  SystemRunState,
} from '../types'

type SimulationFlags = {
  rerouteApplied: boolean
  lowBatteryAlert: boolean
  groundRelay: boolean
  delaySecondary: boolean
  nodePressureBoost: number
}

type RiskCenterState = {
  events: RiskEvent[]
  actions: ResponseAction[]
  headline: string
}

const dronePool = ['TL-A07', 'TL-A12', 'TL-B05', 'TL-B16', 'TL-C03', 'TL-C18']

export const platformTabs: PlatformTab[] = [
  {
    id: 'dashboard',
    label: '总览驾驶舱',
    short: '驾驶舱',
    stage: 'feedback',
    description: '查看平台当前在处理什么、异常落在哪、结果回流后是否带来价值改善。',
  },
  {
    id: 'orders',
    label: '订单管理',
    short: '订单',
    stage: 'demand',
    description: '统一接收高山果蔬订单，锁定起点、终点、重量、时效等级与执行状态。',
  },
  {
    id: 'dispatch',
    label: '智能调度',
    short: '调度',
    stage: 'dispatch',
    description: '把订单约束、天气、节点拥堵和运力状态汇总成一份自动调度方案。',
  },
  {
    id: 'routes',
    label: '航线规划',
    short: '航线',
    stage: 'route',
    description: '比较候选航线的时效、能耗和稳定性，解释系统为什么选择当前路线。',
  },
  {
    id: 'nodes',
    label: '节点协同',
    short: '节点',
    stage: 'node',
    description: '把采摘点、起降点、集散中心、分拨节点和发货节点串成一条接驳链。',
  },
  {
    id: 'risk',
    label: '风险处置',
    short: '风险',
    stage: 'risk',
    description: '发现异常后直接展示系统动作，而不是只给出一面报警墙。',
  },
]

export const processTrack: ProcessTrackItem[] = [
  { id: 'demand', label: '需求进入' },
  { id: 'dispatch', label: '智能分配' },
  { id: 'route', label: '路径生成' },
  { id: 'node', label: '节点执行' },
  { id: 'risk', label: '风险监控' },
  { id: 'feedback', label: '结果回流' },
]

export const roleProfiles: RoleProfile[] = [
  {
    id: 'platform',
    label: '平台调度员',
    signal: '主控视角',
    summary: '统筹订单、航线、节点与异常处置，关注的是整条链路的运行效率与稳定性。',
    focusTitle: '当前最关注',
    focusItems: ['待分配订单节拍', '推荐机队与主备机', '节点瓶颈和异常回流'],
  },
  {
    id: 'coop',
    label: '合作社视角',
    signal: '订单入口',
    summary: '重点关心果园订单是否被及时接收、何时起飞、何时接驳到下一个节点。',
    focusTitle: '当前最关注',
    focusItems: ['采摘点待出货数量', '订单预计送达时间', '当前执行链路'],
  },
  {
    id: 'pilot',
    label: '飞手视角',
    signal: '执行入口',
    summary: '更关注当前执行无人机、备用机、载重、电量和航线稳定性。',
    focusTitle: '当前最关注',
    focusItems: ['主执行无人机', '备用无人机是否切换', '风场变化后的重算结果'],
  },
  {
    id: 'node_admin',
    label: '节点管理员',
    signal: '接驳入口',
    summary: '重点查看节点排队时长、装载压力、接驳进度和是否需要启用备用节点。',
    focusTitle: '当前最关注',
    focusItems: ['集散节点负荷', '当前最慢环节', '备用节点与分流建议'],
  },
]

const baseOrders: OrderRecord[] = [
  {
    id: 'order-2048',
    code: 'TL-2048',
    product: '盐源高山苹果',
    weight: 260,
    priority: '优先',
    origin: '果园采摘点 A',
    destination: '盐源集散中心',
    deadline: '14:40',
    routeId: 'R-208',
    status: '待分配',
  },
  {
    id: 'order-2084',
    code: 'TL-2084',
    product: '高山蓝莓',
    weight: 180,
    priority: '抢鲜',
    origin: '蓝莓采摘棚',
    destination: '冷链前置仓',
    deadline: '15:05',
    routeId: 'R-315',
    status: '待分配',
  },
  {
    id: 'order-2103',
    code: 'TL-2103',
    product: '高山茶鲜叶',
    weight: 92,
    priority: '标准',
    origin: '茶园采摘带',
    destination: '初制加工点',
    deadline: '16:10',
    routeId: 'R-118',
    status: '待分配',
  },
  {
    id: 'order-2121',
    code: 'TL-2121',
    product: '中药材样品',
    weight: 64,
    priority: '优先',
    origin: '坡地药材点',
    destination: '质检节点',
    deadline: '16:40',
    routeId: 'R-406',
    status: '待分配',
  },
]

export const demoScenario: DemoScenarioStep[] = [
  {
    id: 'demo-order',
    label: '订单进入',
    tab: 'orders',
    stage: 'demand',
    durationMs: 1200,
    eventTitle: '新订单进入订单管理',
    eventDetail: '盐源高山苹果订单完成标准化录入，系统开始锁定执行链路。',
    status: '正常',
  },
  {
    id: 'demo-dispatch',
    label: '生成调度',
    tab: 'dispatch',
    stage: 'dispatch',
    durationMs: 1400,
    eventTitle: '智能调度生成推荐机队',
    eventDetail: '系统完成主备机分配、目标节点锁定与风险阈值校验。',
    status: '正常',
  },
  {
    id: 'demo-route',
    label: '锁定航线',
    tab: 'routes',
    stage: 'route',
    durationMs: 1400,
    eventTitle: '航线规划锁定首选路径',
    eventDetail: '系统综合时效、安全和能耗后，先锁定 R-208 首选航线。',
    status: '正常',
  },
  {
    id: 'demo-node',
    label: '推进接驳',
    tab: 'nodes',
    stage: 'node',
    durationMs: 1500,
    eventTitle: '节点协同进入接驳推进',
    eventDetail: '集散节点负荷开始上升，系统同步调度备用节点资源。',
    status: '预警',
  },
  {
    id: 'demo-risk',
    label: '触发应急',
    tab: 'risk',
    stage: 'risk',
    durationMs: 1800,
    eventTitle: '山谷侧风升高触发重调度',
    eventDetail: '系统发现天气扰动与低电量风险，自动切换绕行策略与备用机。',
    status: '应急',
  },
  {
    id: 'demo-feedback',
    label: '结果回流',
    tab: 'dashboard',
    stage: 'feedback',
    durationMs: 1600,
    eventTitle: '回流结果刷新驾驶舱',
    eventDetail: '重调度完成后，指标、重点事件和价值改善结果同步刷新。',
    status: '预警',
  },
]

export const weatherLabels = ['晴稳', '侧风增强', '山谷扰动', '强对流预警']
export const congestionLabels = ['顺畅', '轻载排队', '接驳升温', '节点高压']

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)

const stageToStatus: Record<ProcessStage, OrderRecord['status']> = {
  demand: '待分配',
  dispatch: '调度中',
  route: '航线锁定',
  node: '节点接驳',
  risk: '风险处置',
  feedback: '已回流',
}

const getAirspaceStatus = (weatherLevel: number) => {
  if (weatherLevel >= 3) {
    return '受限放行'
  }

  if (weatherLevel >= 2) {
    return '谨慎放行'
  }

  return '正常放行'
}

const getSystemStatus = (
  input: DispatchInput,
  flags: SimulationFlags,
): SystemRunState['systemStatus'] => {
  if ((input.weatherLevel >= 3 || flags.lowBatteryAlert) && !flags.rerouteApplied) {
    return '应急'
  }

  if (
    input.weatherLevel >= 2 ||
    input.congestionLevel >= 2 ||
    flags.rerouteApplied ||
    flags.nodePressureBoost >= 2
  ) {
    return '预警'
  }

  return '正常'
}

export const createTimestamp = (offsetSeconds = 0) =>
  formatTime(new Date(Date.now() + offsetSeconds * 1000))

export const createInitialRunState = (): SystemRunState => {
  const dispatchInput: DispatchInput = {
    orderWeight: baseOrders[0].weight,
    weatherLevel: 1,
    congestionLevel: 1,
    availableDrones: 4,
    riskThreshold: 68,
    priority: baseOrders[0].priority,
  }

  return {
    activeTab: 'dashboard',
    activeStage: 'feedback',
    activeRole: 'platform',
    selectedOrderId: baseOrders[0].id,
    dispatchInput,
    systemStatus: '正常',
    updatedAt: createTimestamp(),
    airspaceStatus: getAirspaceStatus(dispatchInput.weatherLevel),
    weatherLabel: weatherLabels[dispatchInput.weatherLevel],
    onlinePilots: 9,
    demoMode: 'idle',
    demoStepIndex: -1,
    rerouteApplied: false,
    lowBatteryAlert: false,
    groundRelay: false,
    delaySecondary: false,
    nodePressureBoost: 1,
    eventLog: ['驾驶舱已接入当前执行链路'],
  }
}

export const getTabById = (id: PlatformTab['id']) =>
  platformTabs.find((item) => item.id === id) ?? platformTabs[0]

export const getRoleById = (id: RoleProfile['id']) =>
  roleProfiles.find((item) => item.id === id) ?? roleProfiles[0]

export const getOrderById = (id: string) =>
  baseOrders.find((item) => item.id === id) ?? baseOrders[0]

export const buildOrdersView = (
  selectedOrderId: string,
  input: DispatchInput,
  stage: ProcessStage,
) =>
  baseOrders.map((order) => {
    if (order.id !== selectedOrderId) {
      return order
    }

    return {
      ...order,
      weight: input.orderWeight,
      priority: input.priority,
      status: stageToStatus[stage],
    }
  })

const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 7) {
    return '高'
  }

  if (score >= 4) {
    return '中'
  }

  return '低'
}

export const simulateDispatch = (
  order: OrderRecord,
  input: DispatchInput,
  flags: SimulationFlags,
): DispatchResult => {
  const droneCapacity = 90
  const baseDroneCount = clamp(Math.ceil(input.orderWeight / droneCapacity), 1, input.availableDrones)
  const recommendedCount = clamp(
    baseDroneCount + (flags.groundRelay ? 1 : 0),
    1,
    input.availableDrones,
  )
  const weightFactor = input.orderWeight / droneCapacity
  const weatherPenalty = [0, 3, 7, 11][input.weatherLevel] ?? 0
  const congestionPenalty = [0, 2, 5, 8][input.congestionLevel] ?? 0
  const priorityBonus = input.priority === '抢鲜' ? -2 : input.priority === '优先' ? -1 : 0
  const reroutePenalty = flags.rerouteApplied ? 3 : 0

  const etaMinutes = Math.round(
    clamp(16 + weightFactor * 4 + weatherPenalty + congestionPenalty + priorityBonus + reroutePenalty, 14, 48),
  )

  const costPerKg = Number(
    clamp(
      0.66 +
        input.weatherLevel * 0.04 +
        input.congestionLevel * 0.03 -
        input.availableDrones * 0.02 +
        (flags.rerouteApplied ? 0.03 : 0),
      0.46,
      0.94,
    ).toFixed(2),
  )

  const riskScore =
    input.weatherLevel * 2 +
    input.congestionLevel * 2 +
    (flags.lowBatteryAlert ? 2 : 0) -
    (flags.rerouteApplied ? 2 : 0) -
    Math.min(input.availableDrones, 4)

  const riskLevel = getRiskLevel(riskScore)
  const splitOrder = input.orderWeight >= 170 || input.priority === '抢鲜'
  const manualSaving = Math.round(
    clamp(
      21 + input.availableDrones * 4 - input.weatherLevel * 2 - input.congestionLevel * 2 + (flags.groundRelay ? 2 : 0),
      12,
      41,
    ),
  )
  const lossImprovement = Math.round(
    clamp(
      13 + input.availableDrones * 3 - input.weatherLevel * 2 - input.congestionLevel + (flags.rerouteApplied ? 4 : 0),
      8,
      32,
    ),
  )

  const targetNode =
    input.congestionLevel >= 2 || flags.groundRelay ? '东侧备用集散节点' : order.destination

  const routeId =
    flags.rerouteApplied || input.weatherLevel >= 2 ? `${order.routeId}-B` : `${order.routeId}-A`

  const strategy =
    input.weatherLevel >= 2 || flags.rerouteApplied
      ? '稳态绕飞 + 节点接力'
      : splitOrder
        ? '多机并发 + 近端集散'
        : '直达执行 + 动态补位'

  const assignments = Array.from({ length: recommendedCount }, (_, index) => {
    const duty: DispatchResult['assignments'][number]['duty'] =
      index === 0 ? '主执行' : index === recommendedCount - 1 && recommendedCount > 2 ? '备用' : '接力'

    const loadKg =
      index === recommendedCount - 1
        ? input.orderWeight - Math.floor(input.orderWeight / recommendedCount) * index
        : Math.floor(input.orderWeight / recommendedCount)

    return {
      id: `${order.id}-${index + 1}`,
      label: dronePool[index] ?? `TL-X${index + 1}`,
      duty,
      loadKg,
      battery: `${clamp(92 - index * 8 - input.weatherLevel * 4, 48, 92)}%`,
      etaMinutes: etaMinutes + index,
    }
  })

  return {
    strategy,
    recommendedFleet: `${recommendedCount} 架山地运力 / 1 条执行链路`,
    splitOrder,
    primaryDrone: assignments[0]?.label ?? dronePool[0],
    backupDrone: assignments[recommendedCount - 1]?.label ?? dronePool[1],
    targetNode,
    routeId,
    riskLevel,
    etaMinutes,
    costPerKg,
    lossImprovement,
    manualSaving,
    backupStrategy: flags.rerouteApplied || flags.groundRelay,
    explanation:
      flags.rerouteApplied || input.weatherLevel >= 2
        ? '天气和节点压力共同抬高风险，系统优先保证稳定履约，再压缩局部等待时间。'
        : '当前约束下适合采用多机并发方案，以最短出山时间换取更高的履约确定性。',
    assignments,
  }
}

export const buildRoutePlan = (
  order: OrderRecord,
  input: DispatchInput,
  dispatchResult: DispatchResult,
  flags: SimulationFlags,
): RoutePlan => {
  const shortestRisk = input.weatherLevel >= 2 ? '风速风险高' : '风险可控'
  const shortestDuration = Math.max(14, dispatchResult.etaMinutes - 3)
  const stableDuration = dispatchResult.etaMinutes
  const relayDuration = dispatchResult.etaMinutes + 5
  const recommendedId: RoutePlan['recommendedId'] =
    flags.groundRelay && input.congestionLevel >= 2
      ? 'route-c'
      : flags.rerouteApplied || input.weatherLevel >= 2 || input.congestionLevel >= 2
        ? 'route-b'
        : 'route-a'

  return {
    recommendedId,
    weatherNote: weatherLabels[input.weatherLevel],
    rerouteReason:
      recommendedId === 'route-c'
        ? '节点高压与空域扰动同时出现，系统切换为低空转地面短驳的混合链路。'
        : recommendedId === 'route-b'
        ? '山谷侧风增强后，原最短路径风险上升，系统切换至东侧绕行通道。'
        : '当前风场稳定，首选最短直达通道即可满足时效与稳定性约束。',
    decisionNote:
      recommendedId === 'route-c'
        ? `预计多耗时 5 分钟，但节点等待显著下降，且能在空域受限时保持履约连续性。`
        : recommendedId === 'route-b'
        ? `预计多耗时 3 分钟，但失效率下降 21%，同时为低电量备用机保留回撤空间。`
        : `继续使用 ${order.routeId}-A 可保持最短航程，且能耗和节点时窗均在阈值内。`,
    options: [
      {
        id: 'route-a',
        label: '候选路线 A',
        durationMinutes: shortestDuration,
        energyPercent: clamp(36 + input.weatherLevel * 8, 32, 72),
        stabilityScore: clamp(78 - input.weatherLevel * 16 - input.congestionLevel * 6, 28, 86),
        riskLabel: shortestRisk,
        description: '最短直达，但穿越山谷风口，对天气波动更敏感。',
        recommended: recommendedId === 'route-a',
      },
      {
        id: 'route-b',
        label: '候选路线 B',
        durationMinutes: stableDuration,
        energyPercent: clamp(42 + input.weatherLevel * 6, 36, 68),
        stabilityScore: clamp(88 - input.congestionLevel * 8 + (flags.rerouteApplied ? 4 : 0), 52, 94),
        riskLabel: '综合最优',
        description: '沿东侧山脊绕行，耗时略增，但风场更稳定，可同步预留备用落点。',
        recommended: recommendedId === 'route-b',
      },
      {
        id: 'route-c',
        label: '候选路线 C',
        durationMinutes: relayDuration,
        energyPercent: clamp(48 + input.weatherLevel * 5, 40, 74),
        stabilityScore: clamp(82 + (flags.groundRelay ? 6 : 0), 58, 96),
        riskLabel: '节点换装',
        description: '先飞抵近端起降点，再转地面短驳，适合节点高压或空域受限场景。',
        recommended: recommendedId === 'route-c',
      },
    ],
  }
}

export const buildNodeChain = (
  order: OrderRecord,
  input: DispatchInput,
  dispatchResult: DispatchResult,
  flags: SimulationFlags,
): NodeChainStatus => {
  const queueMinutes = 2 + input.congestionLevel * 2 + flags.nodePressureBoost
  const bottleneck =
    input.congestionLevel >= 2 || flags.nodePressureBoost >= 2
      ? `当前最慢环节：集散节点排队 ${queueMinutes} 分钟`
      : '当前最慢环节：起降点装载节拍'

  return {
    throughput: `当前执行链路预计 ${dispatchResult.etaMinutes + queueMinutes} 分钟闭环`,
    bottleneck,
    suggestion:
      input.congestionLevel >= 2 || flags.nodePressureBoost >= 2
        ? '建议切换备用节点、分流次级订单，并提前通知分拨节点预留接驳窗口。'
        : '保持当前接驳节拍，按推荐航线推进，可持续压缩出山等待时间。',
    steps: [
      {
        id: 'orchard',
        label: '采摘点',
        amountLabel: `待出货 ${Math.ceil(order.weight / 22)} 单`,
        waitLabel: '等待 2 分钟',
        progress: 96,
        load: '中',
        note: '果园已完成称重与打包，正在等待首架主执行无人机起飞。',
      },
      {
        id: 'takeoff',
        label: '起降点',
        amountLabel: `正在装载 ${dispatchResult.assignments.length} 单`,
        waitLabel: `排队 ${Math.max(1, queueMinutes - 2)} 分钟`,
        progress: 74,
        load: input.congestionLevel >= 2 ? '高' : '中',
        note: '主执行无人机已入位，备用机保持热备状态。',
      },
      {
        id: 'hub',
        label: '集散节点',
        amountLabel: `接驳批次 ${Math.ceil(order.weight / 60)} 个`,
        waitLabel: `排队 ${queueMinutes} 分钟`,
        progress: 58,
        load: input.congestionLevel >= 2 || flags.nodePressureBoost >= 2 ? '高' : '中',
        note: dispatchResult.targetNode,
      },
      {
        id: 'sorting',
        label: '分拨节点',
        amountLabel: '已接驳 18 单',
        waitLabel: '等待 3 分钟',
        progress: 68,
        load: '中',
        note: '分拨面板已同步推荐到达时间与箱规信息。',
      },
      {
        id: 'shipping',
        label: '发货节点',
        amountLabel: '待出库 9 单',
        waitLabel: '等待 1 分钟',
        progress: 82,
        load: '低',
        note: '已准备接收履约回流数据并刷新驾驶舱指标。',
      },
    ],
  }
}

export const buildRiskCenter = (
  order: OrderRecord,
  input: DispatchInput,
  dispatchResult: DispatchResult,
  flags: SimulationFlags,
  updatedAt: string,
): RiskCenterState => {
  const events: RiskEvent[] = []

  if (input.weatherLevel >= 2) {
    events.push({
      id: 'weather',
      type: '天气突变',
      severity: input.weatherLevel >= 3 ? '橙' : '黄',
      title: '山谷侧风持续升高',
      detail: '风速上升后，原最短航线的稳定性下降，触发动态重算条件。',
      related: order.code,
      detectedAt: updatedAt,
    })
  }

  if (flags.lowBatteryAlert) {
    events.push({
      id: 'battery',
      type: '电量不足',
      severity: '黄',
      title: `${dispatchResult.primaryDrone} 电量低于阈值`,
      detail: '主执行无人机连续侧风修正，剩余电量已接近安全回撤线。',
      related: dispatchResult.primaryDrone,
      detectedAt: updatedAt,
    })
  }

  if (input.congestionLevel >= 2 || flags.nodePressureBoost >= 2) {
    events.push({
      id: 'node',
      type: '节点超载',
      severity: '蓝',
      title: '集散节点排队时间上升',
      detail: '当前节点装载面繁忙，建议分流部分批次到备用集散点。',
      related: dispatchResult.targetNode,
      detectedAt: updatedAt,
    })
  }

  if (events.length === 0) {
    events.push({
      id: 'normal',
      type: '运行稳定',
      severity: '蓝',
      title: '当前执行链路稳定',
      detail: '系统未发现超阈值异常，继续按照推荐航线推进即可。',
      related: order.code,
      detectedAt: updatedAt,
    })
  }

  const rerouteStatus =
    flags.rerouteApplied || input.weatherLevel >= 3 ? '已完成' : input.weatherLevel >= 2 ? '执行中' : '待执行'
  const swapStatus = flags.lowBatteryAlert ? (flags.rerouteApplied ? '已完成' : '执行中') : '待执行'
  const delayStatus = flags.delaySecondary ? '已完成' : input.congestionLevel >= 2 ? '执行中' : '待执行'
  const relayStatus = flags.groundRelay ? '已完成' : input.congestionLevel >= 2 ? '执行中' : '待执行'

  return {
    headline:
      rerouteStatus === '已完成'
        ? '系统已完成风险处置并回流更新'
        : events[0]?.title ?? '系统正在监测当前风险',
    events,
    actions: [
      {
        id: 'reroute',
        label: '自动重算路径',
        description: '根据风场与空域变化切换推荐航线。',
        status: rerouteStatus,
        effect: '影响航线规划与预计送达时间。',
      },
      {
        id: 'swap-drone',
        label: '切换执行无人机',
        description: '在主执行机电量不足时，自动启用备用机接力。',
        status: swapStatus,
        effect: '影响主执行无人机与履约稳定性。',
      },
      {
        id: 'delay-low',
        label: '顺延次级订单',
        description: '释放当前节点资源，优先保障时效更高的订单。',
        status: delayStatus,
        effect: '影响节点压力与订单排序。',
      },
      {
        id: 'ground-relay',
        label: '建议地面短驳',
        description: '在节点高压或空域受限时启用地面接驳。',
        status: relayStatus,
        effect: '影响目标节点与总体耗时。',
      },
    ],
  }
}

export const buildDashboardSnapshot = (
  orders: OrderRecord[],
  dispatchResult: DispatchResult,
  nodeChain: NodeChainStatus,
  riskCenter: RiskCenterState,
  runState: SystemRunState,
): DashboardSnapshot => {
  const activeAssignments = dispatchResult.assignments.filter((item) => item.duty !== '备用').length
  const nodeHealth = clamp(94 - runState.dispatchInput.congestionLevel * 8 - runState.nodePressureBoost * 3, 68, 96)
  const speedImprovement = clamp(
    18 + runState.dispatchInput.availableDrones * 2 - runState.dispatchInput.weatherLevel * 2,
    8,
    31,
  )

  return {
    metrics: [
      { label: '今日订单数', value: `${orders.length} 单` },
      { label: '在线无人机数', value: `${runState.dispatchInput.availableDrones} 架`, tone: 'accent' },
      { label: '运行中任务数', value: `${activeAssignments} 条` },
      { label: '节点健康度', value: `${nodeHealth}%` },
      {
        label: '当前异常数',
        value: `${riskCenter.events.length} 个`,
        tone: riskCenter.events.length > 1 ? 'alert' : 'default',
      },
    ],
    focusEvent: {
      title: runState.eventLog[0] ?? riskCenter.headline,
      detail:
        riskCenter.events[0]?.detail ??
        `${dispatchResult.targetNode} 正在接收当前执行链路，${nodeChain.bottleneck}。`,
      action:
        runState.systemStatus === '应急'
          ? '建议立刻查看风险处置与航线规划联动结果。'
          : '建议继续关注智能调度与节点协同的回流结果。',
    },
    valueMetrics: [
      {
        label: '平均时效缩短',
        value: `${speedImprovement}%`,
        detail: '相对人工组织方式的平均缩短幅度。',
      },
      {
        label: '单公斤成本下降',
        value: `${dispatchResult.manualSaving}%`,
        detail: '以平台调度替代人工派单后的组织成本改善。',
      },
      {
        label: '损耗率改善',
        value: `${dispatchResult.lossImprovement}%`,
        detail: '采后等待与重复搬运减少带来的损耗下降。',
      },
    ],
  }
}

export const refreshRunStateMeta = (
  state: SystemRunState,
  offsetSeconds = 0,
): SystemRunState => {
  const nextState = {
    ...state,
    updatedAt: createTimestamp(offsetSeconds),
    weatherLabel: weatherLabels[state.dispatchInput.weatherLevel],
    airspaceStatus: getAirspaceStatus(state.dispatchInput.weatherLevel),
    onlinePilots: Math.max(6, state.dispatchInput.availableDrones * 2 + 1),
    systemStatus: getSystemStatus(state.dispatchInput, {
      rerouteApplied: state.rerouteApplied,
      lowBatteryAlert: state.lowBatteryAlert,
      groundRelay: state.groundRelay,
      delaySecondary: state.delaySecondary,
      nodePressureBoost: state.nodePressureBoost,
    }),
  }

  return nextState
}
