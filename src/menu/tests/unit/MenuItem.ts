import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import MenuItem from '../../MenuItem';
import * as css from '../../styles/menu.m.css';

registerSuite({
	name: 'MenuItem',

	'Should construct menu item with passed properties'() {
		const item = new MenuItem();
		item.setProperties({
			key: 'foo',
			disabled: false,
			selected: false
		});

		assert.strictEqual(item.properties.key, 'foo');
		assert.isFalse(item.properties.disabled);
		assert.isFalse(item.properties.selected);
	},

	properties: {
		'applies properties to the vnode'() {
			const item = new MenuItem();
			item.setProperties({
				properties: {
					'data-custom': '12345'
				}
			});

			const vnode: any = item.__render__();
			assert.strictEqual(vnode.properties['data-custom'], '12345');
		},

		'does not override static properties'() {
			const item = new MenuItem();
			item.setProperties({
				controls: 'controls-base',
				expanded: false,
				hasPopup: false,
				disabled: false,
				properties: {
					'aria-controls': 'controls-custom',
					'aria-expanded': 'true',
					'aria-haspopup': 'true',
					'aria-disabled': 'true'
				}
			});

			const vnode: any = item.__render__();
			const properties = vnode.properties;

			assert.strictEqual(properties['aria-controls'], 'controls-base');
			assert.strictEqual(properties['aria-expanded'], 'false');
			assert.isUndefined(properties['aria-haspopup']);
			assert.strictEqual(properties['aria-disabled'], 'false');
		}
	},

	onClick: {
		'when disabled'() {
			const item = new MenuItem();
			let called = false;
			item.setProperties({
				disabled: true,
				onClick() {
					called = true;
				}
			});

			(<any> item).onClick(<any> {});
			assert.isFalse(called, '`onClick` should not be called when the menu item is disabled.');
		},

		'when not disabled'() {
			const item = new MenuItem();
			let called = false;
			item.setProperties({
				onClick() {
					called = true;
				}
			});

			(<any> item).onClick(<any> {});
			assert.isTrue(called, '`onClick` should be called when the menu item is enabled.');
		}
	},

	onKeydown() {
		const item = new MenuItem();
		let event: any;
		item.setProperties({
			onKeydown(_event: any) {
				event = _event;
			}
		});

		(<any> item).onKeydown(<any> { type: 'keydown' });
		assert.strictEqual(event!.type, 'keydown', '`onKeydown` should be called when the menu item is enabled.');
	},

	controls() {
		const item = new MenuItem();
		item.setProperties({
			controls: 'uuid-12345'
		});
		const vnode: any = item.__render__();
		assert.strictEqual(vnode.properties['aria-controls'], 'uuid-12345',
			'`controls` should be assigned to the `aria-controls` attribute');
	},

	disabled() {
		const item = new MenuItem();
		let vnode: any = item.__render__();

		assert.notOk(vnode.properties.classes[css.disabled]);

		item.setProperties({ disabled: true });
		vnode = item.__render__();
		assert.isTrue(vnode.properties.classes[css.disabled]);
	},

	expanded() {
		const item = new MenuItem();
		item.setProperties({
			expanded: true
		});
		const vnode: any = item.__render__();
		assert.strictEqual(vnode.properties['aria-expanded'], 'true',
			'`expanded` should be assigned to the `aria-expanded` attribute');
	},

	hasMenu: {
		'when false'() {
			const item = new MenuItem();
			const vnode: any = item.__render__();

			assert.isTrue(vnode.properties.classes[css.menuItem]);
			assert.notOk(vnode.properties.classes[css.menuLabel]);
		},

		'when true'() {
			const item = new MenuItem();
			item.setProperties({ hasMenu: true });

			const vnode: any = item.__render__();
			const classes = css.menuLabel.split(' ');

			classes.forEach((className: string) => {
				assert.isTrue(vnode.properties.classes[className]);
			});
		}
	},

	hasPopup() {
		const item = new MenuItem();
		item.setProperties({
			hasPopup: true
		});
		let vnode: any = item.__render__();

		assert.strictEqual(vnode.properties['aria-haspopup'], 'true',
			'`hasPopup` should be assigned to the `aria-haspopup` attribute');

		item.setProperties({
			hasPopup: false
		});
		vnode = item.__render__();

		assert.isUndefined(vnode.properties['aria-haspopup'],
			'the `aria-haspopup` attribute should be undefined');
	},

	selected() {
		const item = new MenuItem();
		let vnode: any = item.__render__();

		assert.notOk(vnode.properties.classes[css.selected]);

		item.setProperties({ selected: true });
		vnode = item.__render__();
		assert.isTrue(vnode.properties.classes[css.selected]);
	},

	tabIndex: {
		'when disabled'() {
			const item = new MenuItem();
			item.setProperties({ disabled: true, tabIndex: 1 });
			const vnode: any = item.__render__();

			assert.strictEqual(vnode.properties.tabIndex, -1, 'Specified tabIndex should be ignored');
		},

		'when enabled'() {
			const item = new MenuItem();
			item.setProperties({ tabIndex: 1 });
			const vnode: any = item.__render__();

			assert.strictEqual(vnode.properties.tabIndex, 1);
		},

		'defaults to 0'() {
			const item = new MenuItem();
			const vnode: any = item.__render__();

			assert.strictEqual(vnode.properties.tabIndex, 0);
		}
	},

	tag() {
		const item = new MenuItem();
		let vnode: any = item.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'span', 'defaults to span');

		item.setProperties({
			tag: 'a'
		});
		vnode = item.__render__();
		assert.strictEqual(vnode.vnodeSelector, 'a');
	}
});
