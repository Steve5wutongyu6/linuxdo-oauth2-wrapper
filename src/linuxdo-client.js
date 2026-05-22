const REQUEST_TIMEOUT_MS = 5000;

/**
 * 请求 Linux.do userinfo 接口。
 *
 * @param {string} targetUrl 上游 userinfo 接口地址。
 * @param {string} authorizationHeader 下游客户端透传过来的 Authorization 请求头。
 * @returns {Promise<Response>} 上游接口原始响应对象。
 * @throws {Error} 当请求超时或网络失败时抛出异常。
 */
export async function fetchUserInfo(targetUrl, authorizationHeader) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort("Upstream request timeout");
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "linuxdo-oauth2-wrapper/1.0",
        Authorization: authorizationHeader
      },
      signal: abortController.signal
    });
  } catch (error) {
    throw new Error(`Failed to request upstream userinfo: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
