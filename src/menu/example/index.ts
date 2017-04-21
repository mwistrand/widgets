import { w } from '@dojo/widget-core/d';
import { DNode, WidgetProperties } from '@dojo/widget-core/interfaces';
import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import StatefulMixin from '@dojo/widget-core/mixins/Stateful';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import Menu, { MenuProperties, Orientation } from '../Menu';
import MenuItem from '../MenuItem';

const AppBase = StatefulMixin(WidgetBase);

export class App extends AppBase<WidgetProperties> {
	render(): DNode {
		const { active, index, subMenuActive, subMenuHidden = true, subMenuIndex } = this.state;

		return w(Menu, <MenuProperties> {
			active: active && !subMenuActive,
			activeIndex: index,
			onBlur: () => {
				this.setState({ active: false });
			},
			onFocus: () => {
				this.setState({ active: true });
			},
			onRequestUpdateActive: (index?: number) => {
				this.setState({ index });
			},
			orientation: Orientation.Horizontal
		}, [
			w(MenuItem, {
				active: active && !subMenuActive && index === 0,
				focusable: index === 0 || index === undefined,
				key: 'first',
				onClick: () => {
					this.setState({
						active: true,
						index: 0
					});
				}
			}, [ 'First' ]),

			w(MenuItem, {
				active: active && !subMenuActive && index === 1,
				focusable: index === 1,
				key: 'second',
				menuActive: subMenuActive as boolean,
				parentOrientation: Orientation.Horizontal,
				onClick: () => {
					this.setState({
						active: true,
						index: 1,
						subMenuActive: false,
						subMenuHidden: false,
						subMenuIndex: 0
					});
				},
				onRequestEnterMenu: () => {
					this.setState({
						subMenuActive: true,
						subMenuHidden: false,
						subMenuIndex: 0
					});
				},
				onRequestExitMenu: () => {
					this.setState({
						subMenuActive: false,
						subMenuHidden: true,
						subMenuIndex: 0
					});
				},

				menu: w(Menu, {
					active: subMenuActive as boolean,
					activeIndex: subMenuIndex as number,
					hidden: subMenuHidden as boolean,
					onBlur: () => {
						this.setState({
							active: false,
							subMenuActive: false,
							subMenuHidden: true,
							subMenuIndex: 0
						});
					},
					onRequestUpdateActive: (subMenuIndex?: number) => {
						this.setState({ subMenuIndex });
					}
				}, [
					w(MenuItem, {
						active: subMenuActive && subMenuIndex === 0,
						focusable: subMenuIndex === 0,
						key: 'sub-first',
						onClick: () => {
							this.setState({ subMenuIndex: 0 });
						}
					}, [ 'First' ]),

					w(MenuItem, {
						active: subMenuActive && subMenuIndex === 1,
						focusable: subMenuIndex === 1,
						key: 'sub-second',
						onClick: () => {
							this.setState({ subMenuIndex: 1 });
						}
					}, [ 'Second' ])
				])
			}, [ 'Second' ]),

			w(MenuItem, {
				active: active && index === 2,
				focusable: index === 2,
				key: 'third',
				onClick: () => {
					this.setState({
						active: true,
						index: 2
					});
				}
			}, [ 'Third' ])
		]);
	}
}

const Projector = ProjectorMixin(App);
const projector = new Projector();

projector.append();
