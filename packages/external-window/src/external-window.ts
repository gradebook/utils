/* eslint-env browser */
export class ExternalWindowService {
	public promise: Promise<void>;

	private readonly _interval: number;

	private readonly _window: Window;

	private _resolve: () => void;

	constructor(url: string, title = '') {
		this.promise = new Promise(resolve => {
			this._resolve = resolve;
		});

		this._window = window.open(url, title, this._externalWindowFeatures);
		this._interval = window.setInterval(() => {
			if (this._window?.closed) {
				clearInterval(this._interval);
				this._resolve();
			}
		}, 500);
	}

	requestFocus(): void {
		this._window?.focus();
	}

	private get _externalWindowFeatures(): string {
		const width = screen.width / 4;
		const height = screen.height / 2;
		const widthOffset = (screen.width / 2) - (width / 2);
		const heightOffset = (screen.height / 2) - (height / 2);

		return `width=${width}px,height=${height}px,left=${widthOffset}px,top=${heightOffset}px`;
	}
}

export default ExternalWindowService;
