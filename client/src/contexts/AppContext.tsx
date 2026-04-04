// ============================================================
// 奇妙奇遇游戏控制台 - 全局状态 Context
// ============================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, Game, GameGroup, GameListItem, GameTag, PlayerIdentity, Wheel, WheelOption, PeripheralRecord, BoundTool } from '../types';
import {
  loadState,
  saveState,
  createDefaultGame,
  addGameToLibrary,
  updateGameInLibrary,
  removeGameFromLibrary,
  addGameToCurrentList,
  removeGameFromCurrentList,
  reorderCurrentList,
  updateGameInCurrentList,
  addPeripheralRecord,
  updatePeripheralRecord,
  removePeripheralRecord,
  exportGameLibrary,
  exportWheels,
  importGameLibrary,
  importWheels,
  addGameGroup,
  updateGameGroup,
  removeGameGroup,
  loadGroupToCurrentList,
} from '../store';
import { loadAllImages } from '../lib/imageStore';
import { nanoid } from 'nanoid';

// ---- Action Types ----
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  // Game Library
  | { type: 'ADD_GAME_TO_LIBRARY'; payload: Game }
  | { type: 'UPDATE_GAME_IN_LIBRARY'; payload: Game }
  | { type: 'REMOVE_GAME_FROM_LIBRARY'; payload: string }
  | { type: 'IMPORT_GAME_LIBRARY'; payload: string }
  // Current Game List
  | { type: 'ADD_GAME_TO_LIST'; payload: Game }
  | { type: 'REMOVE_GAME_FROM_LIST'; payload: string }
  | { type: 'REORDER_GAME_LIST'; payload: GameListItem[] }
  | { type: 'UPDATE_GAME_IN_LIST'; payload: { itemId: string; gameData: Game } }
  | { type: 'LOAD_LIST_TO_STAGE' }
  // Stage
  | { type: 'SET_STAGE_CURRENT_GAME'; payload: string | null }
  | { type: 'TOGGLE_STAGE_SHOW_NAMES' }
  // Tags
  | { type: 'ADD_TAG'; payload: GameTag }
  | { type: 'UPDATE_TAG'; payload: GameTag }
  | { type: 'REMOVE_TAG'; payload: string }
  // Players
  | { type: 'UPDATE_PLAYER'; payload: PlayerIdentity }
  | { type: 'SET_PLAYER_COUNT'; payload: number }
  // Wheels
  | { type: 'ADD_WHEEL'; payload: Wheel }
  | { type: 'UPDATE_WHEEL'; payload: Wheel }
  | { type: 'REMOVE_WHEEL'; payload: string }
  | { type: 'IMPORT_WHEELS'; payload: string }
  // Peripheral Records
  | { type: 'ADD_PERIPHERAL'; payload: { playerNumber: number; source: PeripheralRecord['source']; options?: any } }
  | { type: 'UPDATE_PERIPHERAL'; payload: { id: string; updates: Partial<PeripheralRecord> } }
  | { type: 'REMOVE_PERIPHERAL'; payload: string }
  | { type: 'ADD_PERIPHERAL_RECORD'; payload: PeripheralRecord }
  | { type: 'CLEAR_PERIPHERAL_RECORDS' }
  | { type: 'ADD_GAME_TO_LIBRARY_FORCE'; payload: Game }  // 强制覆盖同名游戏
  // Game Groups
  | { type: 'ADD_GAME_GROUP'; payload: GameGroup }
  | { type: 'UPDATE_GAME_GROUP'; payload: GameGroup }
  | { type: 'REMOVE_GAME_GROUP'; payload: string }
  | { type: 'LOAD_GROUP_TO_LIST'; payload: string }; // groupId

function reducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'ADD_GAME_TO_LIBRARY':
      newState = addGameToLibrary(state, action.payload);
      break;
    case 'UPDATE_GAME_IN_LIBRARY':
      newState = updateGameInLibrary(state, action.payload);
      break;
    case 'REMOVE_GAME_FROM_LIBRARY':
      newState = removeGameFromLibrary(state, action.payload);
      break;
    case 'IMPORT_GAME_LIBRARY':
      newState = importGameLibrary(state, action.payload);
      break;
    case 'ADD_GAME_TO_LIST':
      newState = addGameToCurrentList(state, action.payload);
      break;
    case 'REMOVE_GAME_FROM_LIST':
      newState = removeGameFromCurrentList(state, action.payload);
      break;
    case 'REORDER_GAME_LIST':
      newState = reorderCurrentList(state, action.payload);
      break;
    case 'UPDATE_GAME_IN_LIST':
      newState = updateGameInCurrentList(state, action.payload.itemId, action.payload.gameData);
      break;
    case 'LOAD_LIST_TO_STAGE':
      // 载入展台 - 仅作标记，实际跳转在 ConsolePage 中处理
      newState = { ...state };
      break;
    case 'SET_STAGE_CURRENT_GAME':
      newState = { ...state, stageCurrentGameId: action.payload };
      break;
    case 'TOGGLE_STAGE_SHOW_NAMES':
      newState = { ...state, stageShowGameNames: !state.stageShowGameNames };
      break;
    case 'ADD_TAG':
      newState = { ...state, tags: [...state.tags, action.payload] };
      break;
    case 'UPDATE_TAG':
      newState = { ...state, tags: state.tags.map(t => t.id === action.payload.id ? action.payload : t) };
      break;
    case 'REMOVE_TAG':
      newState = { ...state, tags: state.tags.filter(t => t.id !== action.payload) };
      break;
    case 'UPDATE_PLAYER':
      newState = { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) };
      break;
    case 'SET_PLAYER_COUNT': {
      const count = action.payload;
      const current = state.players;
      if (count > current.length) {
        const extras = Array.from({ length: count - current.length }, (_, i) => ({
          id: nanoid(),
          number: current.length + i + 1,
          gender: 'unknown' as const,
          socialType: 'unknown' as const,
        }));
        newState = { ...state, players: [...current, ...extras] };
      } else {
        newState = { ...state, players: current.slice(0, count) };
      }
      break;
    }
    case 'ADD_WHEEL':
      newState = { ...state, wheels: [...state.wheels, action.payload] };
      break;
    case 'UPDATE_WHEEL':
      newState = { ...state, wheels: state.wheels.map(w => w.id === action.payload.id ? action.payload : w) };
      break;
    case 'REMOVE_WHEEL':
      newState = { ...state, wheels: state.wheels.filter(w => w.id !== action.payload) };
      break;
    case 'IMPORT_WHEELS':
      newState = importWheels(state, action.payload);
      break;
    case 'ADD_PERIPHERAL':
      newState = addPeripheralRecord(state, action.payload.playerNumber, action.payload.source, action.payload.options);
      break;
    case 'ADD_PERIPHERAL_RECORD':
      newState = { ...state, peripheralRecords: [...state.peripheralRecords, action.payload] };
      break;
    case 'UPDATE_PERIPHERAL':
      newState = updatePeripheralRecord(state, action.payload.id, action.payload.updates);
      break;
    case 'REMOVE_PERIPHERAL':
      newState = removePeripheralRecord(state, action.payload);
      break;
    case 'CLEAR_PERIPHERAL_RECORDS':
      newState = { ...state, peripheralRecords: [] };
      break;
    case 'ADD_GAME_TO_LIBRARY_FORCE': {
      // 强制覆盖同名游戏（用于库管理页重复名称确认后覆盖）
      const game = action.payload;
      const exists = state.gameLibrary.some(g => g.id === game.id);
      if (exists) {
        newState = { ...state, gameLibrary: state.gameLibrary.map(g => g.id === game.id ? { ...game, updatedAt: Date.now() } : g) };
      } else {
        // 删除同名的旧条目，再添加新的
        const filtered = state.gameLibrary.filter(g => g.name !== game.name);
        newState = { ...state, gameLibrary: [...filtered, { ...game, updatedAt: Date.now() }] };
      }
      break;
    }
    case 'ADD_GAME_GROUP':
      newState = addGameGroup(state, action.payload);
      break;
    case 'UPDATE_GAME_GROUP':
      newState = updateGameGroup(state, action.payload);
      break;
    case 'REMOVE_GAME_GROUP':
      newState = removeGameGroup(state, action.payload);
      break;
    case 'LOAD_GROUP_TO_LIST':
      newState = loadGroupToCurrentList(state, action.payload);
      break;
    default:
      return state;
  }
  saveState(newState);
  return newState;
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  createNewGame: () => Game;
  getTagById: (id: string) => GameTag | undefined;
  getWheelById: (id: string) => Wheel | undefined;
  isPeripheralGame: (game: Game) => boolean;
  exportLibraryJSON: () => Promise<string>;
  exportWheelsJSON: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState());

  // 启动时从 IndexedDB 恢复所有图片到内存状态
  useEffect(() => {
    loadAllImages().then(imageMap => {
      if (Object.keys(imageMap).length === 0) return;
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...state,
          // 恢复游戏库中的周边奖励图片
          gameLibrary: state.gameLibrary.map(g => ({
            ...g,
            settlementImages: g.settlementImages.map(img =>
              img.imageId && imageMap[img.imageId]
                ? { ...img, dataUrl: imageMap[img.imageId] }
                : img
            ),
          })),
          // 恢复当前游戏列表中的周边奖励图片
          currentGameList: state.currentGameList.map(item => ({
            ...item,
            gameData: {
              ...item.gameData,
              settlementImages: item.gameData.settlementImages.map(img =>
                img.imageId && imageMap[img.imageId]
                  ? { ...img, dataUrl: imageMap[img.imageId] }
                  : img
              ),
            },
          })),
          // 恢复轮盘选项图片
          wheels: state.wheels.map(w => ({
            ...w,
            options: w.options.map(o =>
              (o as any).imageId && imageMap[(o as any).imageId]
                ? { ...o, imageDataUrl: imageMap[(o as any).imageId] }
                : o
            ),
          })),
        },
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewGame = useCallback(() => createDefaultGame(), []);
  
  const getTagById = useCallback((id: string) => state.tags.find(t => t.id === id), [state.tags]);
  
  const getWheelById = useCallback((id: string) => state.wheels.find(w => w.id === id), [state.wheels]);
  
  const isPeripheralGame = useCallback((game: Game) => {
    return game.tags.includes('tag-peripheral');
  }, []);

  const exportLibraryJSON = useCallback(() => exportGameLibrary(state), [state]);
  const exportWheelsJSON = useCallback(() => exportWheels(state), [state]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      createNewGame,
      getTagById,
      getWheelById,
      isPeripheralGame,
      exportLibraryJSON,
      exportWheelsJSON,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
