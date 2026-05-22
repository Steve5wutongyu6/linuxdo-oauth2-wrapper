import { jsonResponse } from "./http.js";

/**
 * 判断用户是否在信任等级白名单中。
 *
 * @param {string|undefined} username 当前上游返回的用户名。
 * @param {string[]} whitelist 白名单用户名列表。
 * @returns {boolean} 命中白名单时返回 true。
 */
function isWhitelisted(username, whitelist) {
  if (!username) {
    return false;
  }

  return whitelist.includes(username);
}

/**
 * 对上游用户信息执行兼容层改写。
 *
 * @param {Record<string, unknown>} payload 上游 userinfo JSON 对象。
 * @param {{ forceStrtolower: boolean, minLevel: number|undefined, whitelist: string[] }} config 当前请求生效配置。
 * @returns {Response} 处理完成后的响应对象。
 */
export function transformUserInfo(payload, config) {
  const normalizedPayload = { ...payload };

  if (config.forceStrtolower && typeof normalizedPayload.username === "string") {
    normalizedPayload.username = normalizedPayload.username.toLowerCase();
  }

  const trustLevel = normalizedPayload.trust_level;
  if (
    config.minLevel !== undefined &&
    !isWhitelisted(typeof normalizedPayload.username === "string" ? normalizedPayload.username : undefined, config.whitelist)
  ) {
    if (typeof trustLevel === "number") {
      if (trustLevel < config.minLevel) {
        return jsonResponse(
          { error: "User Trust Level does not meet the requirements" },
          403
        );
      }
    } else {
      console.error(JSON.stringify({
        message: "Upstream payload missing numeric trust_level",
        payload: normalizedPayload
      }));
    }
  }

  return jsonResponse(normalizedPayload, 200);
}
