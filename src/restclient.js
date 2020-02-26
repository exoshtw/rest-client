import Qs from 'qs';
import HTTPError from './httperror';

/**
 * Get header
 * @param {object} headers
 * @param {string} name
 * @return {any}
 */
function getHeader(headers, name) {
    const lname = name.toLowerCase();
    const key = Object
        .keys(headers)
        .filter((x) => x.match(/^[a-z0-9]/i))
        .find((x) => x.toLowerCase() === lname)
    ;

    return key ? headers[key] : null;
}

/**
 * RestClient class for abstraction
 * @example
 *  class MyApi extends RestClient {
 *      contructor() {
 *          super('https://my.api.com/api');
 *      }
 *  }
 *
 *  const api = new MyApi();
 *
 *  // Do a get
 *  api.get('/categories');
 *
 *  // Posting
 *  api.post('/login', {
 *      user,
 *      password,
 *  });
 *
 */
export default class RestClient {

    #baseUrl = '';
    #headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    #simulatedDelay = 0;

    /**
     * New RestApi
     * @param {string} baseUrl - Base of API path
     * @param {object} [options] - Options
     * @param {object} [options.headers] - Default headers
     * @param {int} [options.simulatedDelay] - Simulate a delay between calls
     */
    constructor(baseUrl, options = {}) {
        if (!baseUrl) throw new Error('missing baseUrl');

        this.#baseUrl = baseUrl;
        const {headers, simulatedDelay} = options;

        this.updateHeaders(headers || {});

        this.#simulatedDelay = simulatedDelay ?
            parseInt(simulatedDelay, 10) :
            0
        ;
    }

    /**
     * Simulate a delay
     * @private
     * @return {Promise<void>}
     */
    _simulateDelay() {
        return new Promise((r) => setTimeout(r, this.#simulatedDelay));
    }

    /**
     * Get full route
     * @param {string} url
     * @param {object} [params]
     * @return {string}
     */
    fullRoute(url, params = {}) {
        const sqs = Qs.stringify(params);
        return (`${this.#baseUrl}${url}?${sqs}`)
            .replace(/\?$/, '');
    }

    /**
     * Fetch request
     * @private
     * @param {string} route - Relative route to call
     * @param {string} [method='GET'] - Method
     * @param {object} [params] - QueryString params
     * @param {any} [body] - Body
     * @param {object} [options] - Options
     * @param {object} [options.headers] - Custom headers
     * @param {string} [options.forceType] - Force response type
     * @param {boolean} [options.resolveStreams] - In case of binary reponse,
     *                                             return as buffer, instead
     *                                             stream
     * @return {Promise<any>}
     */
    async _fetch(
        route, method = 'GET', params = {}, body = null, options = {}) {
        if (!route) throw new Error('Route is not defined');
        const fullRoute = this.fullRoute(route, params);

        const headers = {
            ...this.#headers,
            ...(options.headers || {}),
            ...await this.resolveHeaders(route, method, params, body, options),
        };

        const fetchOptions = {
            method,
            headers,
            body: this.parseBody(body, headers),
            ...(options.fetchOptions || {}),
        };

        const result = await fetch(fullRoute, fetchOptions);
        const response = await this.resolveResponse(
            result,
            options.forceType || null,
            options.resolveStreams || false,
        );

        if (!result.ok) {
            throw new HTTPError(result.status, result.statusText, response);
        }

        if (this.#simulatedDelay) {
            await this._simulateDelay();
        }

        return this.transform(response);
    }

    /**
     * Parse send body
     * @param {any} body
     * @param {object} headers
     * @return {Promise<any>}
     */
    async parseBody(body, headers) {
        if (!body) {
            return body;
        }

        const contentType = getHeader(headers, 'content-type');

        if (contentType.startsWith('text/')) {
            return `${body}`;
        } else if (contentType.startsWith('application/json')) {
            return JSON.stringify(body);
        } else if (contentType.startsWith('multipart/form-data')) {
            const nbody = new FormData();
            Object.keys(body).forEach((k) => nbody.append(k, body[k]));
            return nbody;
        }

        return body;
    }

    /**
     * Resolve response by type
     * @param {Response} result
     * @param {string} [forceType]
     * @param {bool} [resolveStreams]
     * @return {Promise<any>}
     */
    async resolveResponse(result, forceType = null, resolveStreams = false) {
        const {headers} = result;
        const contentType = forceType ||
                            getHeader(headers, 'content-type').toLowerCase();

        if (contentType.startsWith('text/')) {
            return result.text();
        } else if (contentType.startsWith('application/json')) {
            return result.json();
        }/* else if (contentType.match(/^(?:image|video|audio)\//))*/

        if (resolveStreams) {
            return result.arrayBuffer();
        } else {
            return result.body;
        }
    }

    /**
     * Resolve headers on each call
     * @abstract
     */
    async resolveHeaders() {
        return {};
    }

    /**
     * Transform data on each call
     * @abstract
     * @param {any} data
     * @return {Promise<any>}
     */
    async transform(data) {
        return data;
    }

    /**
     * Update headers
     * @param {object} headers - New headers
     * @return {RestClient}
     */
    updateHeaders(headers = {}) {
        this.#headers = {
            ...this.#headers,
            ...headers,
        };

        return this;
    }

    /**
     * Do a get
     * @param {string} route
     * @param {object} [query]
     * @param {object} [options]
     * @return {Promise<any>}
     */
    async get(route, query = {}, options = {}) {
        return this._fetch(route, 'GET', query, null, options);
    }

    /**
     * Do a post
     * @param {string} route
     * @param {object} [body]
     * @param {object} [options]
     * @param {object} [options.query]
     * @return {Promise<any>}
     */
    async post(route, body, options = {}) {
        const query = options.query || {};
        delete options.query;
        return this._fetch(route, 'POST', query, body, options);
    }

    /**
     * Do a put
     * @param {string} route
     * @param {object} [body]
     * @param {object} [options]
     * @param {object} [options.query]
     * @return {Promise<any>}
     */
    async put(route, body, options = {}) {
        const query = options.query || {};
        delete options.query;
        return this._fetch(route, 'PUT', query, body, options);
    }

    /**
     * Do a patch
     * @param {string} route
     * @param {object} [body]
     * @param {object} [options]
     * @param {object} [options.query]
     * @return {Promise<any>}
     */
    async patch(route, body, options = {}) {
        const query = options.query || {};
        delete options.query;
        return this._fetch(route, 'PATCH', query, body, options);
    }

    /**
     * Do a delete
     * @param {string} route
     * @param {object} [query]
     * @param {object} [options]
     * @return {Promise<any>}
     */
    async delete(route, query = {}, options = {}) {
        return this._fetch(route, 'DELETE', query, options);
    }
}
