// ============================================================
// 奇妙奇遇游戏控制台 - 核心数据类型定义
// ============================================================

// ---- 标签 ----
export interface GameTag {
  id: string;
  name: string;
  color: string;
  isSystem?: boolean;
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
  dataUrl: string;
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
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ---- 游戏列表项（当天场次） ----
export interface GameListItem {
  id: string;
  gameId: string;
  order: number;
  gameData: Game;
}

// ---- 身份信息 ----
export type Gender = 'male' | 'female' | 'unknown';
export type SocialType = 'introvert' | 'extrovert' | 'unknown';

export interface PlayerIdentity {
  id: string;
  number: number;
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
  isPeripheral: boolean;
  image?: string; // base64 dataUrl
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

// ---- 结算清单记录 ----
// category: 'reward' = 胜者周边奖励, 'penalty' = 败者惩罚
export type SettlementCategory = 'reward' | 'penalty';
export type SettlementSource = 'game-winner' | 'game-loser' | 'wheel-result' | 'manual';

export interface SettlementRecord {
  id: string;
  serialNumber: number;
  playerNumber: number;           // 身份卡号
  category: SettlementCategory;   // reward | penalty
  title: string;                  // 周边名称 / 惩罚内容
  previewImage?: string;          // 预览图 base64
  notes: string;
  completed: boolean;
  source: SettlementSource;
  sourceGameName?: string;
  sourceWheelName?: string;
  sourceWheelOption?: string;
  createdAt: number;
}

// ---- 向后兼容别名 ----
export type PeripheralRecord = SettlementRecord;
export type PeripheralSource = SettlementSource;

// ---- 全局应用状态 ----
export interface AppState {
  gameLibrary: Game[];
  currentGameList: GameListItem[];
  stageCurrentGameId: string | null;
  tags: GameTag[];
  players: PlayerIdentity[];
  wheels: Wheel[];
  peripheralRecords: SettlementRecord[];
  stageShowGameNames: boolean;
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
