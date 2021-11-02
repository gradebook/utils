/* global document,typeSafeWindow */
// Based on https://github.com/getsentry/sentry/blob/master/src/sentry/templates/sentry/error-page-embed.html,
// https://github.com/getsentry/sentry/blob/master/src/sentry/templates/sentry/error-page-embed.js, and
// https://github.com/getsentry/sentry/blob/master/src/sentry/web/frontend/error_page_embed.py

const template = `
<style>
.sentry-error-embed-wrapper {
	display: block;
	outline: none;
	position: fixed;
	z-index: 1001;
	width: 100%;
	height: 100%;
	text-align: center;
	top: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.6);
	overflow: auto;
}

.sentry-error-embed {
	background: #fff;
	margin: 0 auto;
	max-height: 80%;
	margin-top: 4%;
	text-align: left;
	border: 1px solid #fff;
	padding: 40px;
	max-width: 700px;
	overflow: auto;
	border-radius: 3px;
	color: #546076;
	box-shadow: 0 0 0 1px rgba(0,0,0, .3), 0 10px 40px rgba(0,0,0, .3);
}

.sentry-error-embed a,
.sentry-error-embed a:visited {
	color: #546076;
	font-weight: 500;
	text-decoration: none;
}

.sentry-error-embed p {
	margin: 0 0 20px;
}

.sentry-error-embed a:active,
.sentry-error-embed a:focus, a:hover {
	color: #1E263C;
	text-decoration: underline;
}

.sentry-error-embed h2 {
	font-size: 28px;
	font-weight: 500;
	margin: 0 0 5px;
	color: #394359;
}

.sentry-error-embed header {
	text-align: center;
	margin-bottom: 20px;
	padding-bottom: 8px;
	border-bottom: 1px solid #E8EBF1;
}

.sentry-error-embed .form-submit {
	display: flex;
}

.sentry-error-embed pre {
	max-height: 50vh;
	overflow: scroll;
	border: 1px solid cyan;
}

.sentry-error-embed header p {
	color: #94A0B3;
	font-size: 16px;
}

.sentry-error-embed .form-submit .btn {
	border: none;
	color: #fff;
	background: #25A6F7;
	padding: 10px 15px;
	margin-right: 15px;
	font-size: 16px;
	font-weight: 500;
	cursor: pointer;
	float: left;
	border: 1px solid #1D87CE;
	box-shadow: 0 1px 1px rgba(0,0,0, .12);
}

.sentry-error-embed .form-submit .btn:hover {
	background: #1D87CE;
}

@media screen and (max-height: 570px) {
	.sentry-error-embed {
		max-height: none;
		margin-top: 0;
	}
}

@media screen and (max-width: 660px) {
	.sentry-error-embed {
		padding: 10px;
		max-width: none;
	}
	.sentry-error-embed h2 {
		font-size: 22px;
	}
	.sentry-error-embed header p {
		font-size: 14px;
	}
}

@media screen and (max-width: 480px) {
	.sentry-error-embed {
		padding: 10px;
		margin-top: 0;
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		height: 100%;
		max-height: none;
	}

	.sentry-error-embed h2 {
		font-size: 20px;
		line-height: 24px;
	}

	.sentry-error-embed header p {
		font-size: 13px;
	}

	.sentry-error-embed header h2 > span,
	.sentry-error-embed header p > span {
		display: none;
	}

	.sentry-error-embed .form-submit {
		text-align: center;
	}

	.sentry-error-embed .form-submit .btn{
		float: none;
		display: block;
		margin: 0 auto;
	}
}
</style>

<div class="sentry-error-embed" role="dialog" aria-modal="true" aria-labelledby="sentry-error-embed-heading">
	<header>
		<h2 id="sentry-error-embed-heading">It looks like we&#39;re having issues.</h2>
		<p>Our team has been notified. <span>If you&#39;d like to help, tell us what happened below.</span></p>
	</header>
	<div class="form-submit">
		<button class="btn safe">Close</button>
		<button class="btn unsafe">Close (don't reload)</button>
	</div>
	<div><pre>{{event}}</pre></div>
</div>`;

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-expect-error
const typeSafeWindow = window;
// @ts-expect-error
const typeSafeDocument = document;

class SentryErrorEmbed {
	private readonly _element = typeSafeDocument.createElement('div');

	constructor() {
		const lastEvent = JSON.stringify((typeSafeWindow.__sentryEvents || []).pop() || '(none)', null, 2);
		this._element.className = 'sentry-error-embed-wrapper';
		this._element.innerHTML = template.replace('{{event}}', lastEvent);
		this._element.addEventListener('click', (event: any) => {
			if (event.target === this._element) {
				this.close();
			}
		});

		this._element.querySelector('.safe').addEventListener('click', () => {
			typeSafeWindow.location.reload();
		});
		this._element.querySelector('.unsafe').addEventListener('click', () => this.close());
	}

	close() {
		this._element.remove();
	}

	attach(parent: any) {
		parent.append(this._element);
	}
}

const options = typeSafeWindow.sentryConfig || {};
const embed = new SentryErrorEmbed();
if (options.attachOnLoad !== false) {
	embed.attach(options.parent || typeSafeDocument.body);
	typeSafeWindow.sentryEmbedCallback?.(embed);
}
/* eslint-enable @typescript-eslint/no-unsafe-call */
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
