import { useModal } from "@/lib/stores/modal-store"

/**
 * Hook to get the current modal level for z-index stacking
 * Returns 0 for the first modal, 1 for the second, etc.
 */
export function useModalLevel() {
  const { getModalLevel } = useModal()
  return getModalLevel()
}

