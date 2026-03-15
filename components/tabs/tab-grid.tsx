"use client"

import type { Tab } from "@/types"
import { TabCard } from "./tab-card"

interface TabGridProps {
  tabs: Tab[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onFocus: (tabId: string) => void
  onClose: (tabId: string) => void
  onClassify: (tabId: string) => void
  onTabClick: (tab: Tab) => void
  onReopen?: (tabId: string) => void
  onReadArticle?: (tab: Tab) => void
}

export function TabGrid({ tabs, selectedIds, onSelect, onFocus, onClose, onClassify, onTabClick, onReopen, onReadArticle }: TabGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {tabs.map((tab) => (
        <TabCard
          key={tab.id}
          tab={tab}
          isSelected={selectedIds.has(tab.id)}
          onSelect={onSelect}
          onFocus={onFocus}
          onClose={onClose}
          onClassify={onClassify}
          onClick={onTabClick}
          onReopen={onReopen}
          onReadArticle={onReadArticle}
        />
      ))}
    </div>
  )
}
