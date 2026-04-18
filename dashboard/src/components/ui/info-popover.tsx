import { Popover } from '@base-ui/react/popover'
import type { ReactNode } from 'react'

interface InfoPopoverProps {
  children: ReactNode
  icon?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function InfoPopover({ children, icon = 'info', side = 'bottom', className = '' }: InfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container transition-all duration-150 cursor-pointer"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={side} sideOffset={8} align="start">
          <Popover.Popup
            className={`z-50 max-w-sm rounded-xl border border-outline/30 bg-surface-container-high p-4 shadow-xl text-sm text-on-surface animate-in fade-in-0 zoom-in-95 ${className}`}
          >
            <Popover.Arrow className="fill-surface-container-high [&>path:first-child]:fill-outline/30" />
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
