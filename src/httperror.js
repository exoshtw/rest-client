import ExtendableError from 'extendable-error';
import HttpStatus from 'http-status-codes';

/**
 * Error object for HTTP Errors
 */
export default class HTTPError extends ExtendableError {

    #code = null;
    #response = null;

    /**
     * Instance new HTTPError
     * @param {int} code
     * @param {string} [msg]
     * @param {object} [response]
     */
    constructor(code, msg = null, response = {}) {
        const statusText = HttpStatus.getStatusText(code);

        if (!msg || msg === '') {
            msg = statusText;
        }

        super(msg);

        this.#code = parseInt(code, 10);
        this.#response = response;
        this.name = this.constructor.name;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(msg)).stack;
        }
    }

    /**
     * Status text of error
     * @type {string}
     */
    get statusText() {
        return HttpStatus.getStatusText(this.code);
    }

    /**
     * Status code
     * @type {int}
     */
    get code() {
        return this.#code;
    }

    /**
     * Remote response
     * @type {object}
     */
    get response() {
        return this.#response;
    }
}
