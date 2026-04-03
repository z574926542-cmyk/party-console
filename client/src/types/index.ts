// ============================================================
// 奇妙奇遇游戏控制台 - 核心数据类型定义
// Design: Professional Dark Dashboard
// ============================================================

// ---- 标签 ----
export interface GameTag {
  id: string;
  name: string;
  color: string; // hex color
  isSystem?: boolean; // 系统内置标签（如"周边"）
}

// ---- 工具绑定 ----
export type ToolType = 'random-number' | 'random-pick' | 'random-group' | 'countdown' | 'dice';
export interface BoundTool {
  id: string;
  type: 'tool' | 'wheel';
  toolType?: ToolType;
  wheelId?: string;
  label: string;
}

// ---- 结算图片 ----
export interface SettlementImage {
  id: string;
  name: string;
  dataUrl: string; // base64 data URL for local storage
}

// ---- 游戏 ----
export interface Game {
  id: string;
  name: string;
  rules: string;
  winnerSettlement: string;
  loserSettlement: string;
  settlementImages: SettlementImage[];
  tools: BoundTool[];
  tags: string[]; // tag ids
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ---- 游戏列表项（当天场次） ----
export interface GameListItem {
  id: string; // unique list item id
  gameId: string; // reference to game (or embedded game data)
  order: number;
  gameData: Game; // snapshot of game data at time of adding
}

// ---- 身份信息 ----
export type Gender = 'male' | 'female' | 'unknown';
export type SocialType = 'introvert' | 'extrovert' | 'unknown';

export interface PlayerIdentity {
  id: string;
  number: number; // 身份卡号码 1-N
  gender: Gender;
  socialType: SocialType;
  notes?: string;
}

// ---- 轮盘选项 ----
export interface WheelOption {
  id: string;
  label: string;
  weight: number;
  color: string;
  isPeripheral: boolean; // 是否属于"周边"
  image?: string; // optional image dataUrl
  notes?: string;
}

// ---- 轮盘历史记录 ----
export interface WheelHistoryEntry {
  id: string;
  optionLabel: string;
  optionColor: string;
  playerNumbers: number[];
  timestamp: number;
  isPeripheral: boolean;
}

// ---- 轮盘 ----
export interface Wheel {
  id: string;
  name: string;
  options: WheelOption[];
  history: WheelHistoryEntry[];
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ---- 周边清单记录 ----
export type PeripheralSource = 'game-settlement' | 'wheel-result' | 'manual';

export interface PeripheralRecord {
  id: string;
  serialNumber: number; // 序号
  playerNumber: number; // 身份卡号码
  peripheralCode: string; // 周边编号
  previewImage?: string; // 周边预览图
  notes: string;
  completed: boolean; // 订单完成状态
  source: PeripheralSource;
  sourceGameName?: string;
  sourceWheelName?: string;
  sourceWheelOption?: string;
  createdAt: number;
}

// ---- 全局应用状态 ----
export interface AppState {
  // 游戏库
  gameLibrary: Game[];
  
  // 当天游戏列表
  currentGameList: GameListItem[];
  
  // 展台当前选中游戏
  stageCurrentGameId: string | null;
  
  // 标签库
  tags: GameTag[];
  
  // 身份信息
  players: PlayerIdentity[];
  
  // 轮盘
  wheels: Wheel[];
  
  // 周边清单
  peripheralRecords: PeripheralRecord[];
  
  // 展台名称显示开关
  stageShowGameNames: boolean;
  
  // 上次更新时间
  lastUpdated: number;
}

// ---- 快捷选人组件 Props ----
export interface QuickPickProps {
  title: string;
  confirmLabel?: string;
  multiSelect?: boolean;
  onConfirm: (playerNumbers: number[]) => void;
  onCancel: () => void;
  maxPlayers?: number;
}

// ---- 工具弹层 Props ----
export interface ToolOverlayProps {
  tool: BoundTool;
  onClose: () => void;
}
