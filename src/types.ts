export type TabId =
  | 'dashboard'
  | 'orders'
  | 'dispatch'
  | 'routes'
  | 'nodes'
  | 'risk'

export type ProcessStage =
  | 'demand'
  | 'dispatch'
  | 'route'
  | 'node'
  | 'risk'
  | 'feedback'

export type RoleId = 'platform' | 'coop' | 'pilot' | 'node_admin'

export type PriorityLevel = '标准' | '优先' | '抢鲜'

export type RiskLevel = '低' | '中' | '高'

export type SystemStatus = '正常' | '预警' | '应急'

export type OrderStatus =
  | '待分配'
  | '调度中'
  | '航线锁定'
  | '节点接驳'
  | '风险处置'
  | '已回流'

export type PlatformTab = {
  id: TabId
  label: string
  short: string
  stage: ProcessStage
  description: string
}

export type ProcessTrackItem = {
  id: ProcessStage
  label: string
}

export type RoleProfile = {
  id: RoleId
  label: string
  signal: string
  summary: string
  focusTitle: string
  focusItems: string[]
}

export type DashboardMetric = {
  label: string
  value: string
  tone?: 'default' | 'accent' | 'alert'
}

export type FocusEvent = {
  title: string
  detail: string
  action: string
}

export type ValueMetric = {
  label: string
  value: string
  detail: string
}

export type DashboardSnapshot = {
  metrics: DashboardMetric[]
  focusEvent: FocusEvent
  valueMetrics: ValueMetric[]
}

export type OrderRecord = {
  id: string
  code: string
  product: string
  weight: number
  priority: PriorityLevel
  origin: string
  destination: string
  deadline: string
  routeId: string
  status: OrderStatus
}

export type DispatchInput = {
  orderWeight: number
  weatherLevel: number
  congestionLevel: number
  availableDrones: number
  riskThreshold: number
  priority: PriorityLevel
}

export type DroneAssignment = {
  id: string
  label: string
  duty: '主执行' | '备用' | '接力'
  loadKg: number
  battery: string
  etaMinutes: number
}

export type DispatchResult = {
  strategy: string
  recommendedFleet: string
  splitOrder: boolean
  primaryDrone: string
  backupDrone: string
  targetNode: string
  routeId: string
  riskLevel: RiskLevel
  etaMinutes: number
  costPerKg: number
  lossImprovement: number
  manualSaving: number
  backupStrategy: boolean
  explanation: string
  assignments: DroneAssignment[]
}

export type RouteOption = {
  id: string
  label: string
  durationMinutes: number
  energyPercent: number
  stabilityScore: number
  riskLabel: string
  description: string
  recommended: boolean
}

export type RoutePlan = {
  recommendedId: string
  weatherNote: string
  rerouteReason: string
  decisionNote: string
  options: RouteOption[]
}

export type NodeStepStatus = {
  id: string
  label: string
  amountLabel: string
  waitLabel: string
  progress: number
  load: '低' | '中' | '高'
  note: string
}

export type NodeChainStatus = {
  steps: NodeStepStatus[]
  bottleneck: string
  suggestion: string
  throughput: string
}

export type RiskEvent = {
  id: string
  type: string
  severity: '蓝' | '黄' | '橙'
  title: string
  detail: string
  related: string
  detectedAt: string
}

export type ResponseAction = {
  id: string
  label: string
  description: string
  status: '待执行' | '执行中' | '已完成'
  effect: string
}

export type DemoScenarioStep = {
  id: string
  label: string
  tab: TabId
  stage: ProcessStage
  durationMs: number
  eventTitle: string
  eventDetail: string
  status: SystemStatus
}

export type SystemRunState = {
  activeTab: TabId
  activeStage: ProcessStage
  activeRole: RoleId
  selectedOrderId: string
  dispatchInput: DispatchInput
  systemStatus: SystemStatus
  updatedAt: string
  airspaceStatus: string
  weatherLabel: string
  onlinePilots: number
  demoMode: 'idle' | 'running' | 'completed'
  demoStepIndex: number
  rerouteApplied: boolean
  lowBatteryAlert: boolean
  groundRelay: boolean
  delaySecondary: boolean
  nodePressureBoost: number
  eventLog: string[]
}
