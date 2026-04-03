// ============================================================
// 奇妙奇遇游戏控制台 - 核心数据存储（localStorage 持久化）
// ============================================================

import { nanoid } from 'nanoid';
import {
  AppState,
  Game,
  GameListItem,
  GameTag,
  PlayerIdentity,
  Wheel,
  WheelOption,
  PeripheralRecord,
  BoundTool,
  SettlementImage,
} from '../types';

const STORAGE_KEY = 'party-console-v1';

// ---- 默认标签 ----
const DEFAULT_TAGS: GameTag[] = [
  { id: 'tag-peripheral', name: '周边', color: '#f59e0b', isSystem: true },
  { id: 'tag-team', name: '团队', color: '#10b981', isSystem: false },
  { id: 'tag-pk', name: 'PK', color: '#ef4444', isSystem: false },
  { id: 'tag-fun', name: '欢乐', color: '#8b5cf6', isSystem: false },
];

// ---- 默认轮盘 ----
const DEFAULT_WHEEL_OPTIONS: WheelOption[] = [
  { id: nanoid(), label: '一等奖', weight: 1, color: '#f59e0b', isPeripheral: true },
  { id: nanoid(), label: '二等奖', weight: 2, color: '#6366f1', isPeripheral: true },
  { id: nanoid(), label: '三等奖', weight: 3, color: '#10b981', isPeripheral: true },
  { id: nanoid(), label: '安慰奖', weight: 4, color: '#06b6d4', isPeripheral: false },
  { id: nanoid(), label: '再来一次', weight: 3, color: '#f43f5e', isPeripheral: false },
  { id: nanoid(), label: '谢谢参与', weight: 5, color: '#64748b', isPeripheral: false },
];

const DEFAULT_WHEEL: Wheel = {
  id: 'wheel-default-lottery',
  name: '抽奖',
  options: DEFAULT_WHEEL_OPTIONS,
  history: [],
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// ---- 初始状态 ----
const INITIAL_STATE: AppState = {
  gameLibrary: [],
  currentGameList: [],
  stageCurrentGameId: null,
  tags: DEFAULT_TAGS,
  players: Array.from({ length: 30 }, (_, i) => ({
    id: nanoid(),
    number: i + 1,
    gender: 'unknown' as const,
    socialType: 'unknown' as const,
  })),
  wheels: [DEFAULT_WHEEL],
  peripheralRecords: [],
  stageShowGameNames: true,
  lastUpdated: Date.now(),
};

// ---- 存储工具函数 ----
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // 合并默认值，防止字段缺失
    return {
      ...INITIAL_STATE,
      ...parsed,
      tags: parsed.tags && parsed.tags.length > 0 ? parsed.tags : DEFAULT_TAGS,
      wheels: parsed.wheels && parsed.wheels.length > 0 ? parsed.wheels : [DEFAULT_WHEEL],
      players: parsed.players && parsed.players.length > 0 ? parsed.players : INITIAL_STATE.players,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastUpdated: Date.now() }));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ---- 游戏操作 ----
export function createDefaultGame(): Game {
  return {
    id: nanoid(),
    name: '无标题游戏',
    rules: '请在此处添加游戏规则',
    winnerSettlement: '请在此处添加胜者结算方式',
    loserSettlement: '请在此处添加败者结算方式',
    settlementImages: [],
    tools: [],
    tags: [],
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addGameToLibrary(state: AppState, game: Game): AppState {
  const existing = state.gameLibrary.find(g => g.name === game.name && g.id !== game.id);
  if (existing) return state; // caller should handle duplicate check
  return {
    ...state,
    gameLibrary: [...state.gameLibrary, { ...game, updatedAt: Date.now() }],
  };
}

export function updateGameInLibrary(state: AppState, game: Game): AppState {
  return {
    ...state,
    gameLibrary: state.gameLibrary.map(g => g.id === game.id ? { ...game, updatedAt: Date.now() } : g),
  };
}

export function removeGameFromLibrary(state: AppState, gameId: string): AppState {
  return {
    ...state,
    gameLibrary: state.gameLibrary.filter(g => g.id !== gameId),
  };
}

export function addGameToCurrentList(state: AppState, game: Game): AppState {
  const maxOrder = state.currentGameList.reduce((max, item) => Math.max(max, item.order), 0);
  const newItem: GameListItem = {
    id: nanoid(),
    gameId: game.id,
    order: maxOrder + 1,
    gameData: { ...game },
  };
  return {
    ...state,
    currentGameList: [...state.currentGameList, newItem],
  };
}

export function removeGameFromCurrentList(state: AppState, itemId: string): AppState {
  const filtered = state.currentGameList.filter(item => item.id !== itemId);
  const reordered = filtered.map((item, idx) => ({ ...item, order: idx + 1 }));
  return { ...state, currentGameList: reordered };
}

export function reorderCurrentList(state: AppState, newOrder: GameListItem[]): AppState {
  const reordered = newOrder.map((item, idx) => ({ ...item, order: idx + 1 }));
  return { ...state, currentGameList: reordered };
}

export function updateGameInCurrentList(state: AppState, itemId: string, gameData: Game): AppState {
  return {
    ...state,
    currentGameList: state.currentGameList.map(item =>
      item.id === itemId ? { ...item, gameData: { ...gameData, updatedAt: Date.now() } } : item
    ),
  };
}

// ---- 周边记录操作 ----
let peripheralCounter = 1;

export function addPeripheralRecord(
  state: AppState,
  playerNumber: number,
  source: PeripheralRecord['source'],
  options: {
    peripheralCode?: string;
    previewImage?: string;
    sourceGameName?: string;
    sourceWheelName?: string;
    sourceWheelOption?: string;
  } = {}
): AppState {
  const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
  const record: PeripheralRecord = {
    id: nanoid(),
    serialNumber: maxSerial + 1,
    playerNumber,
    peripheralCode: options.peripheralCode || `P-${String(maxSerial + 1).padStart(4, '0')}`,
    previewImage: options.previewImage,
    notes: '',
    completed: false,
    source,
    sourceGameName: options.sourceGameName,
    sourceWheelName: options.sourceWheelName,
    sourceWheelOption: options.sourceWheelOption,
    createdAt: Date.now(),
  };
  return {
    ...state,
    peripheralRecords: [...state.peripheralRecords, record],
  };
}

export function updatePeripheralRecord(state: AppState, id: string, updates: Partial<PeripheralRecord>): AppState {
  return {
    ...state,
    peripheralRecords: state.peripheralRecords.map(r => r.id === id ? { ...r, ...updates } : r),
  };
}

export function removePeripheralRecord(state: AppState, id: string): AppState {
  return {
    ...state,
    peripheralRecords: state.peripheralRecords.filter(r => r.id !== id),
  };
}

// ---- 导出/导入 ----
export function exportGameLibrary(state: AppState): string {
  return JSON.stringify({ gameLibrary: state.gameLibrary, tags: state.tags }, null, 2);
}

export function exportWheels(state: AppState): string {
  return JSON.stringify({ wheels: state.wheels }, null, 2);
}

export function importGameLibrary(state: AppState, json: string): AppState {
  const data = JSON.parse(json);
  const importedGames: Game[] = data.gameLibrary || [];
  const importedTags: GameTag[] = data.tags || [];
  // Merge, avoid duplicates by id
  const existingIds = new Set(state.gameLibrary.map(g => g.id));
  const newGames = importedGames.filter(g => !existingIds.has(g.id));
  const existingTagIds = new Set(state.tags.map(t => t.id));
  const newTags = importedTags.filter(t => !existingTagIds.has(t.id));
  return {
    ...state,
    gameLibrary: [...state.gameLibrary, ...newGames],
    tags: [...state.tags, ...newTags],
  };
}

export function importWheels(state: AppState, json: string): AppState {
  const data = JSON.parse(json);
  const importedWheels: Wheel[] = data.wheels || [];
  const existingIds = new Set(state.wheels.map(w => w.id));
  const newWheels = importedWheels.filter(w => !existingIds.has(w.id));
  return {
    ...state,
    wheels: [...state.wheels, ...newWheels],
  };
}
