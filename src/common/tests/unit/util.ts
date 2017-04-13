import has from '@dojo/has/has';
import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as sinon from 'sinon';
import { Keys, observeViewport } from '../../util';

registerSuite({
	name: 'util',

	beforeEach() {
		if (has('host-node')) {
			(<any> global).window = {
				addEventListener: sinon.spy(),
				removeEventListener: sinon.spy()
			};
			(<any> global).document = {
				body: { offsetWidth: 500 }
			};
		}
		else if (has('host-browser')) {
			sinon.spy(window, 'addEventListener');
			sinon.spy(window, 'removeEventListener');
		}
	},

	afterEach() {
		if (has('host-node')) {
			delete (<any> global).window;
			delete (<any> global).document;
		}
		else if (has('host-browser')) {
			(<any> window).addEventListener.restore();
			(<any> window).removeEventListener.restore();
		}
	},

	Keys() {
		assert.strictEqual(Keys.Down, 40);
		assert.strictEqual(Keys.End, 35);
		assert.strictEqual(Keys.Enter, 13);
		assert.strictEqual(Keys.Escape, 27);
		assert.strictEqual(Keys.Home, 36);
		assert.strictEqual(Keys.Left, 37);
		assert.strictEqual(Keys.PageDown, 34);
		assert.strictEqual(Keys.PageUp, 33);
		assert.strictEqual(Keys.Right, 39);
		assert.strictEqual(Keys.Space, 32);
		assert.strictEqual(Keys.Tab, 9);
		assert.strictEqual(Keys.Up, 38);
	},

	observeViewport() {
		let next = sinon.spy();
		const subscriber = observeViewport({ next });
		const listener: () => void = (<any> window.addEventListener).args[0][1];
		listener();

		assert.isTrue((<any> window.addEventListener).calledWith('resize'));
		assert.isTrue(next.calledWith(500), '`next` should be passed the current viewport width.');

		subscriber.unsubscribe();
		assert.isTrue((<any> window.removeEventListener).calledWith('resize'));

		next = sinon.spy();
		observeViewport({ next }).unsubscribe();
		listener();
		assert.isFalse(next.called);
	}
});
