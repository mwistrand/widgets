import { assign } from '@dojo/core/lang';
import { createTimer } from '@dojo/core/util';
import uuid from '@dojo/core/uuid';
import { Handle } from '@dojo/interfaces/core';
import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import ThemeableMixin, { theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import MenuItem, { MenuItemProperties } from './MenuItem';
import * as css from './styles/menu.css';

export type Role = 'menu' | 'menubar';

export interface MenuProperties extends ThemeableProperties {
	/**
	 * Only applies to nested menus. Either a flag indicating whether the widget instance should handle animating
	 * between the visible and hidden states, or a function that manually handles the animation. If true (the default),
	 * then the menu will slide into and out of view like an accordion. If false, then any animation should be handled
	 * in the CSS, as the menu will just snap open/shut.
	 */
	animate?: boolean | ((element: HTMLElement, hidden: boolean) => void);

	/**
	 * Indicates whether the menu is disabled. If true, then the widget will ignore events.
	 */
	disabled?: boolean;

	/**
	 * Indicates whether the menu should be displayed/hidden via a click event. If false, then the menu is toggled
	 * via a hover event. Defaults to true.
	 */
	expandOnClick?: boolean;

	/**
	 * Only applies to menus toggled into view with a hover event. The amount of time (in milliseconds) after a
	 * mouseleave event that should pass before the menu is hidden. Defaults to 300ms.
	 */
	hideDelay?: number;

	/**
	 * Whether the menu is hidden. Defaults to true if a label is specified (i.e., the menu is controlled by a
	 * a link); false otherwise.
	 */
	hidden?: boolean;

	/**
	 * The widget ID. Defaults to a random string.
	 */
	id?: string;

	/**
	 * The text or properties for a MenuItem widget that is used to control the menu.
	 */
	label?: string | MenuItemProperties;

	/**
	 * Indicates whether the menu is nested within another menu. Useful for styling, this does not affect
	 * functionality. Defaults to false.
	 */
	nested?: boolean;

	/**
	 * Needed only when a label is used. Called when the menu is displayed, and the label is triggered.
	 * This method should be used to update the widget's `hidden` property.
	 */
	onRequestHide?: () => void;

	/**
	 * Needed only when a label is used. Called when the menu is hidden, and the label is triggered.
	 * This method should be used to update the widget's `hidden` property.
	 */
	onRequestShow?: () => void;

	/**
	 * The value to use for the menu's `role` property. Defaults to "menu".
	 */
	role?: Role;
}

function getMenuHeight(menuElement: HTMLElement): number {
	const maxHeight = parseInt(getComputedStyle(menuElement).getPropertyValue('max-height'), 10);
	return Math.min(menuElement.scrollHeight, (isNaN(maxHeight) ? Infinity : maxHeight));
}

@theme(css)
export class Menu extends ThemeableMixin(WidgetBase)<MenuProperties> {
	protected _wasOpen = false;
	private _hideTimer: Handle;
	private _initialRender = true;

	onLabelClick() {
		const {
			disabled,
			expandOnClick = true
		} = this.properties;

		if (!disabled && expandOnClick) {
			this._toggleDisplay();
		}
	}

	onLabelKeypress(event: KeyboardEvent) {
		const { disabled } = this.properties;

		if (!disabled && event.key === 'Enter') {
			this._toggleDisplay();
		}
	}

	onMenuFocus() {
		const { disabled, hidden = this._getDefaultHidden() } = this.properties;
		if (!disabled && hidden) {
			const onRequestShow = this.properties.onRequestShow;
			onRequestShow && onRequestShow();
		}
	}

	onMenuMouseEnter() {
		const {
			disabled,
			expandOnClick = true
		} = this.properties;

		if (!disabled && !expandOnClick) {
			this._hideTimer && this._hideTimer.destroy();
			this._toggleDisplay(true);
		}
	}

	onMenuMouseLeave() {
		const {
			disabled,
			expandOnClick = true,
			hideDelay = 300
		} = this.properties;

		if (!disabled && !expandOnClick) {
			this._hideTimer && this._hideTimer.destroy();
			if (hideDelay) {
				this._hideTimer = createTimer(() => {
					this._toggleDisplay(false);
				}, hideDelay);
				this.own(this._hideTimer);
			}
			else {
				this._toggleDisplay(false);
			}
		}
	}

	render(): DNode {
		const {
			hidden = this._getDefaultHidden(),
			id = uuid(),
			nested,
			role = 'menu'
		} = this.properties;

		const label = this.renderLabel(id);
		const menu = v('nav', {
			id,
			role,
			classes: this.classes.apply(this, this._getMenuClasses(hidden, Boolean(label))),
			afterCreate: this._afterCreate,
			afterUpdate: this._afterUpdate,
			onfocusin: this.onMenuFocus
		}, this.children);

		if (label) {
			return v('div', {
				classes: this.classes(css.container, nested ? css.nestedMenuContainer : null),
				onmouseenter: this.onMenuMouseEnter,
				onmouseleave: this.onMenuMouseLeave
			}, [ label, menu ]);
		}

		return menu;
	}

	renderLabel(id: string): DNode | void {
		const { disabled, label, overrideClasses } = this.properties;

		if (label) {
			const properties = typeof label === 'string' ? { label } : label;
			return w(MenuItem, assign({
				disabled,
				getAriaProperties: this._getLabelAriaProperties.bind(this, id),
				hasMenu: true,
				overrideClasses: overrideClasses || css,
				onClick: this.onLabelClick,
				onKeypress: this.onLabelKeypress
			}, properties));
		}
	}

	protected _afterCreate(element: HTMLElement) {
		const { animate = true } = this.properties;
		this._initialRender = false;

		if (animate) {
			const hidden = element.classList.contains(css.hidden);
			this._wasOpen = !hidden;

			if (hidden) {
				element.style.height = '0';
			}
		}
	}

	protected _afterUpdate(element: HTMLElement) {
		const { animate = true, hidden = this._getDefaultHidden(), label } = this.properties;

		if (!label) {
			return;
		}

		if (!animate) {
			// In case `animate` was previously `true`, remove any `height` property set on the node.
			element.style.height = null;
			return;
		}

		if (typeof animate === 'function') {
			return animate(element, hidden);
		}

		this._animate(element, hidden);
	}

	protected _animate(element: HTMLElement, hidden: boolean) {
		// Assuming the menu has an `auto` height, manually apply the scroll height (or max-height if specified),
		// and animate to and from that.
		requestAnimationFrame(() => {
			const height = getMenuHeight(element);
			this._wasOpen = !hidden;

			if (hidden) {
				// Temporarily remove any transition to prevent the element from animating to `height`.
				const transition = element.style.transition;
				element.style.transition = null;

				element.style.height = height + 'px';
				element.style.transition = transition;
				requestAnimationFrame(() => {
					element.style.height = '0';
				});
			}
			else {
				element.style.height = `${height}px`;
			}
		});
	}

	protected _getDefaultHidden() {
		const { disabled, label } = this.properties;

		if (label && disabled) {
			return true;
		}

		return label ? true : false;
	}

	protected _getLabelAriaProperties(id: string): { [key: string]: string; } {
		const { hidden = this._getDefaultHidden() } = this.properties;
		return {
			'aria-controls': id,
			'aria-expanded': String(!hidden)
		};
	}

	protected _getMenuClasses(hidden: boolean, isSubMenu: boolean) {
		const { animate = true, nested } = this.properties;
		const classes = [ css.menu ];

		if (this._initialRender || !animate || !isSubMenu) {
			classes.push(hidden ? css.hidden : css.visible);
		}

		if (nested) {
			classes.push(css.nestedMenu);
		}

		if (isSubMenu) {
			classes.push(css.subMenu);
		}

		return classes;
	}

	protected _toggleDisplay(isHidden?: boolean) {
		const {
			onRequestHide,
			onRequestShow
		} = this.properties;

		if (typeof isHidden === 'undefined') {
			const { hidden = this._getDefaultHidden() } = this.properties;
			isHidden = hidden;
		}

		if (isHidden) {
			typeof onRequestShow === 'function' && onRequestShow();
		}
		else {
			typeof onRequestHide === 'function' && onRequestHide();
		}
	}
}

export default Menu;
