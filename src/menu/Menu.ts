import { assign } from '@dojo/core/lang';
import { createTimer } from '@dojo/core/util';
import uuid from '@dojo/core/uuid';
import { Handle } from '@dojo/interfaces/core';
import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import StatefulMixin from '@dojo/widget-core/mixins/Stateful';
import ThemeableMixin, { theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import MenuItem from './MenuItem';
import * as css from './styles/menu.m.css';

export type Orientation = 'horizontal' | 'vertical';

export type Role = 'menu' | 'menubar';

/**
 * @type MenuProperties
 *
 * Properties that can be set on a Menu component.
 *
 * @property active				Determines whether the menu trigger is active (should have focus).
 * @property animate			Determines whether animation should be handled internally.
 * @property disabled			Determines whether the menu is disabled.
 * @property expandOnClick		Determines whether a menu is displayed on click (default) or hover.
 * @property focusable			Determines whether the menu trigger can receive focus with tab key.
 * @property hideDelay			The amount of time (in milliseconds) after mouseleave before hiding the menu.
 * @property hidden				Determines whether the menu is hidden.
 * @property hideOnActivate		Determines whether the menu should be hidden when an item is activated. Defaults to true.
 * @property id					The widget ID. Defaults to a random string.
 * @property label				A DNode to use as the trigger for a nested menu.
 * @property nested				Indicates whether the menu is nested within another menu.
 * @property onRequestHide		Called when the menu is displayed and the trigger is activated.
 * @property onRequestShow		Called when the menu is hidden and the trigger is activated.
 * @property role				The value to use for the menu's `role` property. Defaults to 'menu'.
 */
export interface MenuProperties extends ThemeableProperties {
	active?: boolean;
	animate?: boolean;
	disabled?: boolean;
	expandOnClick?: boolean;
	focusable?: boolean;
	hideDelay?: number;
	hidden?: boolean;
	hideOnActivate?: boolean;
	id?: string;
	label?: DNode;
	nested?: boolean;
	onRequestHide?: () => void;
	onRequestShow?: () => void;
	orientation?: Orientation;
	role?: Role;
}

function getMenuHeight(menuElement: HTMLElement): number {
	const maxHeight = parseInt(getComputedStyle(menuElement).getPropertyValue('max-height'), 10);
	return Math.min(menuElement.scrollHeight, (isNaN(maxHeight) ? Infinity : maxHeight));
}

export const enum Operation {
	decrease,
	increase
}

const commonKeys = {
	enter: 13,
	escape: 27,
	space: 32,
	tab: 9
};

const horizontalKeys = assign({
	ascend: 38, // up arrow
	decrease: 37, // left arrow
	descend: 40, // down arrow
	increase: 39 // right arrow
}, commonKeys);

const verticalKeys = assign({
	ascend: 37, // left arrow
	decrease: 38, // up arrow
	descend: 39, // right arrow
	increase: 40 // down arrow
}, commonKeys);

export const MenuBase = StatefulMixin(ThemeableMixin(WidgetBase));

@theme(css)
export class Menu extends MenuBase<MenuProperties> {
	protected wasOpen = false;
	private _activeIndex = 0;
	private _domNode: HTMLElement;
	private _hideTimer: Handle;
	private _id = uuid();
	private _initialRender = true;
	private _isLabelActive = false;

	render(): DNode {
		const {
			id = this._id,
			nested,
			role = 'menu'
		} = this.properties;

		const label = this.renderLabel();
		const menu = v('div', {
			classes: this.classes.apply(this, this.getMenuClasses()),
			id,
			key: 'menu',
			onclick: this.onItemActivate,
			onfocusin: this.onMenuFocus,
			onfocusout: this.onMenuFocusOut,
			onkeydown: this.onMenuKeyDown,
			onmousedown: this.onMenuMouseDown,
			role
		}, this.renderChildren());

		if (label) {
			this._isLabelActive = false;
			return v('div', {
				classes: this.classes(css.root, nested ? css.nestedMenuRoot : null),
				onmouseenter: this.onMenuMouseEnter,
				onmouseleave: this.onMenuMouseLeave
			}, [ label, menu ]);
		}

		return menu;
	}

	renderLabel(): DNode | void {
		const {
			active,
			disabled,
			focusable,
			hidden = this.getDefaultHidden(),
			id = this._id,
			label,
			overrideClasses
		} = this.properties;
		const labelActive = this._isLabelActive || active;

		if (label) {
			return w(MenuItem, {
				active: labelActive,
				controls: id,
				disabled,
				expanded: !hidden,
				focusable,
				hasMenu: true,
				overrideClasses: overrideClasses || css,
				onClick: this.onLabelClick,
				onKeyDown: this.onLabelKeyDown
			}, [ label ]);
		}
	}

	protected animate(element: HTMLElement) {
		const { hidden = this.getDefaultHidden() } = this.properties;

		if (this.wasOpen !== hidden) {
			return;
		}

		// Assuming the menu has an `auto` height, manually apply the scroll height (or max-height if specified),
		// and animate to and from that.
		requestAnimationFrame(() => {
			const height = getMenuHeight(element);
			this.wasOpen = !hidden;

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
				element.scrollTop = 0;
				element.style.height = `${height}px`;
			}
		});
	}

	protected exitMenu() {
		const { label, hidden = this.getDefaultHidden() } = this.properties;

		if (label && !hidden) {
			this._isLabelActive = true;
			this.setState({ active: false });
		}
	}

	protected getDefaultHidden() {
		return this.properties.label ? true : false;
	}

	protected getDefaultOrientation(): Orientation {
		const { role = 'menu' } = this.properties;
		return role === 'menubar' ? 'horizontal' : 'vertical';
	}

	protected getMenuClasses() {
		const {
			animate = true,
			hidden = this.getDefaultHidden(),
			label,
			orientation = this.getDefaultOrientation(),
			nested
		} = this.properties;
		const isSubMenu = Boolean(label);
		const classes = [ css.menu ];

		if (this._initialRender || !animate || !isSubMenu) {
			classes.push(hidden ? css.hidden : css.visible);
		}

		if (orientation === 'horizontal') {
			classes.push(css.horizontal);
		}

		if (nested) {
			classes.push(css.nestedMenu);
		}

		if (isSubMenu) {
			classes.push(css.subMenu);
		}

		return classes;
	}

	protected moveActiveIndex(operation: Operation) {
		const max = this.children.length;
		const previousIndex = this._activeIndex;
		this._activeIndex = operation === Operation.decrease ?
			previousIndex - 1 < 0 ? max - 1 : previousIndex - 1 :
			Math.min(previousIndex + 1, max) % max;

		this.invalidate();
	}

	protected onElementCreated(element: HTMLElement, key: string) {
		if (key === 'menu') {
			const { animate = true, hidden = this.getDefaultHidden() } = this.properties;
			this._initialRender = false;
			this._domNode = element;
			this.wasOpen = !hidden;

			if (animate && hidden) {
				element.style.height = '0';
			}
		}
	}

	protected onElementUpdated(element: HTMLElement, key: string) {
		if (key === 'menu') {
			const { animate = true, label } = this.properties;

			if (!label) {
				return;
			}

			if (!animate) {
				// In case `animate` was previously `true`, remove any `height` property set on the node.
				element.style.height = null;
				return;
			}

			this.animate(element);
		}
	}

	protected onItemActivate() {
		const { hideOnActivate = true, role } = this.properties;

		if (role !== 'menubar' && hideOnActivate) {
			this.toggleDisplay(false);
		}
	}

	protected onLabelClick() {
		const {
			disabled,
			expandOnClick = true
		} = this.properties;

		if (!disabled && expandOnClick) {
			this._isLabelActive = true;
			this.toggleDisplay();
		}
	}

	protected onLabelKeyDown(event: KeyboardEvent) {
		const { disabled, orientation = this.getDefaultOrientation() } = this.properties;
		const keys = orientation === 'horizontal' ? horizontalKeys : verticalKeys;

		if (!disabled) {
			const key = event.keyCode;

			if (key === keys.enter) {
				this.toggleDisplay();
			}
			else if (key === keys.descend) {
				this.toggleDisplay(true);
			}
		}
	}

	protected onMenuFocus() {
		!this.state.active && this.setState({ active: true });
	}

	protected onMenuFocusOut() {
		if (this.properties.label) {
			requestAnimationFrame(() => {
				if (!this._domNode.contains(document.activeElement)) {
					this.setState({ active: false });
				}
			});
		}
		else {
			this.setState({ active: false });
		}
	}

	protected onMenuKeyDown(event: KeyboardEvent) {
		const { label, orientation = this.getDefaultOrientation() } = this.properties;
		const keys = orientation === 'horizontal' ? horizontalKeys : verticalKeys;

		switch (event.keyCode) {
			case keys.space:
				this.onItemActivate();
				break;
			case keys.tab:
				event.stopPropagation();
				this.setState({ active: false });
				break;
			case keys.ascend:
				event.preventDefault();
				event.stopPropagation();
				this.exitMenu();
				break;
			case keys.decrease:
				event.preventDefault();
				event.stopPropagation();
				this.moveActiveIndex(Operation.decrease);
				break;
			case keys.increase:
				event.preventDefault();
				event.stopPropagation();
				this.moveActiveIndex(Operation.increase);
				break;
			case keys.escape:
				if (label) {
					event.stopPropagation();
					this._isLabelActive = true;
					this.toggleDisplay(false);
				}
				break;
		}
	}

	protected onMenuMouseDown(event: MouseEvent) {
		let itemNode = <HTMLElement> event.target;
		while (!itemNode.hasAttribute('data-dojo-index') && itemNode.parentElement) {
			itemNode = itemNode.parentElement;
		}

		const index = parseInt(itemNode.getAttribute('data-dojo-index') || '', 10);
		if (!isNaN(index)) {
			this._activeIndex = index;
		}
	}

	protected onMenuMouseEnter() {
		const {
			disabled,
			expandOnClick = true
		} = this.properties;

		if (!disabled && !expandOnClick) {
			this._hideTimer && this._hideTimer.destroy();
			this.toggleDisplay(true, true);
		}
	}

	protected onMenuMouseLeave() {
		const {
			disabled,
			expandOnClick = true,
			hideDelay = 300
		} = this.properties;

		if (!disabled && !expandOnClick) {
			this._hideTimer && this._hideTimer.destroy();
			if (hideDelay) {
				this._hideTimer = createTimer(() => {
					this.toggleDisplay(false);
				}, hideDelay);
				this.own(this._hideTimer);
			}
			else {
				this.toggleDisplay(false);
			}
		}
	}

	protected renderChildren() {
		const { hidden = this.getDefaultHidden(), label } = this.properties;
		const activeIndex = this.state.active && !this._isLabelActive ? this._activeIndex : null;

		if (!hidden) {
			this.children.forEach((child: any, i) => {
				if (child && child.properties) {
					child.properties.index = i;
					child.properties.focusable = !label && i === this._activeIndex;
					child.properties.active = i === activeIndex;
				}
			});
		}

		return this.children;
	}

	protected toggleDisplay(requestShow?: boolean, inactive?: boolean) {
		const {
			onRequestHide,
			onRequestShow
		} = this.properties;

		if (typeof requestShow === 'undefined') {
			const { hidden = this.getDefaultHidden() } = this.properties;
			requestShow = hidden;
		}

		if (requestShow) {
			!inactive && this.setState({ active: true });
			onRequestShow && onRequestShow();
		}
		else {
			this.setState({ active: false });
			this._activeIndex = 0;
			onRequestHide && onRequestHide();
		}
	}
}

export default Menu;
