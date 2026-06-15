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
 * 递归转换 JSON 数据中的所有字符串值为小写。
 *
 * 适用于 userinfo 响应中 Matrix 可能读取不同 claim 字段的场景。
 *
 * @param {unknown} value 需要转换的 JSON 字段值。
 * @returns {unknown} 字符串会返回小写值，数组和对象会递归处理，其他类型保持原样。
 */
function lowercaseStringValues(value) {
  if (typeof value === "string") {
    return value.toLowerCase();
  }

  if (Array.isArray(value)) {
    return value.map((item) => lowercaseStringValues(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        lowercaseStringValues(item)
      ])
    );
  }

  return value;
}

/**
 * 对上游用户信息执行兼容层改写。
 *
 * @param {Record<string, unknown>} payload 上游 userinfo JSON 对象。
 * @param {{ forceStrtolower: boolean, minLevel: number|undefined, whitelist: string[] }} config 当前请求生效配置。
 * @returns {Response} 处理完成后的响应对象。
 */
export function transformUserInfo(payload, config) {
  const normalizedPayload = config.forceStrtolower
    ? lowercaseStringValues(payload)
    : { ...payload };

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
