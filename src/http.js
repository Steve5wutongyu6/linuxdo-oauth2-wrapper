/**
 * 统一生成 JSON 响应。
 *
 * @param {unknown} body 需要输出的 JSON 数据。
 * @param {number} status HTTP 状态码。
 * @returns {Response} 构造完成的 JSON 响应对象。
 */
export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
