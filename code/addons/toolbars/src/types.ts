import type { InputType } from '@storybook/types';
import type { ReactNode } from 'react';

export type ToolbarShortcutType = 'next' | 'previous' | 'reset';

export type ToolbarItemType = 'item' | 'reset';

export interface ToolbarShortcutConfig {
  label: string;
  keys: string[];
}

export type ToolbarShortcuts = Record<ToolbarShortcutType, ToolbarShortcutConfig>;

export interface ToolbarItem {
  value?: string;
  icon?: ReactNode;
  left?: string;
  right?: string;
  title?: string;
  hideIcon?: boolean;
  type?: ToolbarItemType;
}

export interface NormalizedToolbarConfig {
  /** The label to show for this toolbar item */
  title?: string;
  /** Add your own icon, ideally from the @storybook/icons library */
  icon: ReactNode;
  /** Set to true to prevent default update of icon to match any present selected items icon */
  preventDynamicIcon?: boolean;
  items: ToolbarItem[];
  shortcuts?: ToolbarShortcuts;
  /** Change title based on selected value */
  dynamicTitle?: boolean;
}

export type NormalizedToolbarArgType = InputType & {
  toolbar: NormalizedToolbarConfig;
};

export type ToolbarConfig = NormalizedToolbarConfig & {
  items: string[] | ToolbarItem[];
};

export type ToolbarArgType = InputType & {
  toolbar: ToolbarConfig;
};

export type ToolbarMenuProps = NormalizedToolbarArgType & { id: string };
