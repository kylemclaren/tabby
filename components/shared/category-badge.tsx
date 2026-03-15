import { CATEGORY_COLORS, type TabCategory } from "@/types"

interface CategoryBadgeProps {
  category: string | null
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) return null

  const colors = CATEGORY_COLORS[category as TabCategory] || CATEGORY_COLORS.other

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {category}
    </span>
  )
}
