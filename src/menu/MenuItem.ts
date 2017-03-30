import { assign } from '@dojo/core/lang';
import { v } from '@dojo/widget-core/d';
import { VirtualDomProperties } from '@dojo/widget-core/interfaces';
import ThemeableMixin, { theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import * as css from './styles/menu.m.css';

/**
 * @type MenuItemProperties
 *
 * Properties that can be set on a MenuItem component
 *
 * @property controls
 * ID of an element that this input controls
 *
 * @property disabled
 * Indicates whether the menu is disabled. If true, then the widget will ignore events.
 *
 * @property expanded
 * A flag indicating whether a widget controlled by `this` is expanded.
 *
 * @property hasMenu
 * A flag indicating whether the widget is used as the label for a menu widget. If `true`,
 * then the `menuLabel` CSS class is applied instead of the `menuItem` class.
 *
 * @property hasPopup
 * A flag indicating whether the widget has a drop down child.
 *
 * @property onClick
 * An event handler for click events.
 *
 * @property onKeydown
 * An event handler for keydown events.
 *
 * @property selected
 * Indicates whether the widget is selected.
 *
 * @property tabIndex
 * The tab index. Defaults to 0, and is forced to -1 if the widget is disabled.
 */
export interface MenuItemProperties extends ThemeableProperties {
	active?: boolean;
	controls?: string;
	disabled?: boolean;
	expanded?: boolean;
	hasMenu?: boolean;
	hasPopup?: boolean;
	onClick?: (event: MouseEvent) => void;
	onKeydown?: (event: KeyboardEvent) => void;
	properties?: VirtualDomProperties;
	selected?: boolean;
	tabIndex?: number;
	tag?: string;
}

export const MenuItemBase = ThemeableMixin(WidgetBase);

@theme(css)
export class MenuItem extends MenuItemBase<MenuItemProperties> {
	render() {
		const {
			active = false,
			controls,
			disabled,
			expanded,
			hasPopup = false,
			hasMenu = false,
			properties,
			selected,
			tabIndex = 0,
			tag = 'span'
		} = this.properties;

		const classes = this.classes(
			hasMenu ? css.menuLabel : css.menuItem,
			disabled ? css.disabled : null,
			selected ? css.selected : null,
			active ? css.active : null
		);

		return v(tag, assign(Object.create(null), properties, {
			'aria-controls': controls,
			'aria-expanded': String(expanded),
			'aria-haspopup': hasPopup ? 'true' : undefined,
			'aria-disabled': String(disabled),
			classes,
			onclick: this.onClick,
			onkeydown: this.onKeydown,
			role: 'menuitem',
			tabIndex : disabled ? -1 : tabIndex
		}), this.children);
	}

	protected onClick(event: MouseEvent) {
		const { disabled, onClick } = this.properties;
		if (!disabled && typeof onClick === 'function') {
			onClick(event);
		}
	}

	protected onKeydown(event: KeyboardEvent) {
		const { onKeydown } = this.properties;
		if (typeof onKeydown === 'function') {
			onKeydown(event);
		}
	}
}

export default MenuItem;
