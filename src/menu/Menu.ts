import { v } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import ThemeableMixin, { theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import * as css from './styles/menu.m.css';
import { Keys } from '../common/util';

export const enum Operation {
	Decrease,
	Increase
}

export const enum Orientation {
	Horizontal,
	Vertical
}

export interface MenuProperties extends ThemeableProperties {
	active?: boolean;
	activeIndex?: number;
	hidden?: boolean;
	onBlur?: (event: Event) => void;
	onFocus?: (event: Event) => void;
	onRequestUpdateActive?: (index?: number) => void;
	orientation?: Orientation;
}

export const MenuBase = ThemeableMixin(WidgetBase);

@theme(css)
export class Menu extends MenuBase<MenuProperties> {
	private _domNode: HTMLElement;

	render(): DNode {
		return v('div', {
			classes: this.classes(css.root, this.properties.hidden ? css.hidden : null),
			key: 'root',
			onfocusin: this._onFocus,
			onfocusout: this._onBlur,
			onkeydown: this._onKeyDown
		}, this.children);
	}

	protected onElementCreated(element: HTMLElement, key: string) {
		if (key === 'root') {
			this._domNode = element;
		}
	}

	private _getKeys() {
		const { orientation = Orientation.Vertical } = this.properties;

		return {
			decrease: orientation === Orientation.Horizontal ? Keys.Left : Keys.Up,
			increase: orientation === Orientation.Horizontal ? Keys.Right : Keys.Down
		};
	}

	private _moveActiveIndex(operation: Operation) {
		const { activeIndex = 0, onRequestUpdateActive } = this.properties;
		const max = this.children.length;
		const previousIndex = activeIndex;

		const nextIndex = operation === Operation.Decrease ?
			previousIndex - 1 < 0 ? max - 1 : previousIndex - 1 :
			Math.min(previousIndex + 1, max) % max;

		onRequestUpdateActive && onRequestUpdateActive(nextIndex);
	}

	private _onBlur(event: Event) {
		const { active, onBlur } = this.properties;
		if (active && onBlur) {
			// Until `focusin` has fired, `document.activeElement` will be `<body>`.
			requestAnimationFrame(() => {
				if (!this._domNode.contains(document.activeElement)) {
					// TODO: Since we're now in a different frame is there any real benefit
					// to providing the event object?
					onBlur(event);
				}
			});
		}
	}

	private _onFocus(event: Event) {
		const { active, onFocus } = this.properties;
		!active && onFocus && onFocus(event);
	}

	private _onKeyDown(event: KeyboardEvent) {
		if (!this.properties.active) {
			return;
		}

		const keys = this._getKeys();
		switch (event.keyCode) {
			case Keys.Tab:
				this.properties.onRequestUpdateActive && this.properties.onRequestUpdateActive();
				break;
			case keys.decrease:
				event.preventDefault();
				this._moveActiveIndex(Operation.Decrease);
				break;
			case keys.increase:
				event.preventDefault();
				this._moveActiveIndex(Operation.Increase);
				break;
		}
	}
}

export default Menu;
