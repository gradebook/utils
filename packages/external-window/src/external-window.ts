/* eslint-env browser */
export class ExternalWindowService {
	public promise: Promise<void>;
	private readonly _interval: number;
	private readonly _window: Window;
	private readonly _listener$: () => void;
	private _resolve: () => void;
	private _reject: (error: Error) => void;

	constructor(url: string, title = '') {
		this.promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});

		this._listener$ = this._registerListener();

		this._window = window.open(url, title, this._externalWindowFeatures);

		if (this._window && !this._window.closed) {
			this._interval = window.setInterval(() => {
				if (this._window?.closed) {
					clearInterval(this._interval);
					window?.removeEventListener('beforeunload', this._listener$);
					this._resolve();
				}
			}, 500);
		} else {
			this._reject(new Error('E_BLOCKED_BY_CLIENT'));
		}
	}

	requestFocus(): void {
		this._window?.focus();
	}

	private _registerListener() {
		const handleUnload = (): void => {
			this._window?.close();
		};

		window?.addEventListener('beforeunload', handleUnload);
		return handleUnload;
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
