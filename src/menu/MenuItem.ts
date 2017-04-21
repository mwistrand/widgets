import { v } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import ThemeableMixin, { theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { Orientation } from './Menu';
import * as css from './styles/menu.m.css';
import { Keys } from '../common/util';

export interface MenuItemProperties extends ThemeableProperties {
	active?: boolean;
	disabled?: boolean;
	focusable?: boolean;
	menu?: DNode;
	menuActive?: boolean;
	onClick?: (event: Event) => void;
	onRequestEnterMenu?: () => void;
	onRequestExitMenu?: () => void;
	parentOrientation?: Orientation;
}

export const MenuItemBase = ThemeableMixin(WidgetBase);

@theme(css)
export class MenuItem extends MenuItemBase<MenuItemProperties> {
	render(): DNode {
		const { focusable, menu } = this.properties;
		const item = v('a', {
			bind: this,
			key: 'label',
			onclick: this._onClick,
			onkeydown: this._onLabelKeyDown,
			tabIndex: focusable ? 0 : -1
		}, this.children);

		if (!menu) {
			return item;
		}

		return v('span', {
			key: 'root',
			onkeydown: this._onKeyDown
		}, [
			item,
			menu
		]);
	}

	protected onElementUpdated(element: HTMLElement, key: string) {
		if (this.properties.active && key === 'label') {
			requestAnimationFrame(() => {
				element.focus();
			});
		}
	}

	private _onClick(event: MouseEvent) {
		this.properties.onClick && this.properties.onClick(event);
	}

	private _onLabelKeyDown(event: KeyboardEvent) {
		const { active, disabled, onRequestEnterMenu, parentOrientation } = this.properties;

		if (!active || disabled) {
			return;
		}

		const descendKey = parentOrientation === Orientation.Horizontal ? Keys.Down : Keys.Right;
		switch (event.keyCode) {
			case descendKey:
				onRequestEnterMenu && onRequestEnterMenu();
				break;
			case Keys.Enter:
				break;
			case Keys.Space:
				break;
		}
	}

	private _onKeyDown(event: KeyboardEvent) {
		const { disabled, menuActive, onRequestExitMenu } = this.properties;

		if (!menuActive || disabled) {
			return;
		}

		switch (event.keyCode) {
			case Keys.Escape:
				onRequestExitMenu && onRequestExitMenu();
				break;
		}
	}
}

export default MenuItem;
