/**
 * @file useNotesList.ts
 * @description 笔记列表 Hook，负责初始化笔记列表并管理选中索引
 */
import { useNoteStore } from '@renderer/store'
import type { UseNotesListOptions, UseNotesListReturn } from '@renderer/types'
import { useCallback, useEffect } from 'react'

/**
 * useNotesList 初始化笔记列表并提供选中索引管理
 * @param onSelect {@link UseNotesListOptions}
 * @returns 笔记列表数据、当前选中索引、选中处理函数
 * @example
 * const { notes, selectNoteIndex, handleSelectNote } = useNotesList({ onSelect: () => {} })
 */
export const useNotesList = ({ onSelect }: UseNotesListOptions): UseNotesListReturn => {
  /** 笔记列表数据 */
  const notes = useNoteStore((state) => state.notes)
  /** 当前选中的笔记索引 */
  const selectNoteIndex = useNoteStore((state) => state.selectedIndex)
  /** 初始化笔记列表的方法 */
  const initNotes = useNoteStore((state) => state.initNotes)
  /** 选中指定索引笔记的方法 */
  const selectNote = useNoteStore((state) => state.selectNote)

  /**
   * 组件挂载时异步初始化笔记列表
   */
  useEffect(() => {
    void initNotes()
  }, [initNotes])

  /**
   * 选中指定索引的笔记并触发外部回调
   * @param index 笔记索引
   */
  const handleSelectNote = useCallback(
    (index: number): void => {
      selectNote(index)
      onSelect?.()
    },
    [selectNote, onSelect]
  )

  return {
    notes,
    selectNoteIndex,
    handleSelectNote
  }
}
