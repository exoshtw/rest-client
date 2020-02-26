
import RestClient from './restclient';
import HTTPError from './httperror';

export default RestClient;
export {HTTPError};

/**
 * Do a simple fetch
 * @param {string} url
 * @param {string} [method='GET']
 * @param {object} [params]
 * @param {any} [body]
 * @param {object} [options]
 */
export async function simpleFetch(
    url, method = 'GET', params = {}, body = {}, options = {}) {
    const api = new RestClient(url);
    return api._fetch('', method, params, body, options);
}
