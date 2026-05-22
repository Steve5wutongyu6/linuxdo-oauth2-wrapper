const DEFAULT_TARGET_URL = "https://connect.linux.do/api/user";

/**
 * 将 Workers 环境变量解析为布尔值。
 *
 * @param {unknown} value 需要解析的原始值。
 * @returns {boolean|undefined} 成功时返回布尔值，缺失或空值时返回 undefined。
 * @throws {TypeError} 当值不是可识别的布尔表达时抛出异常。
 */
export function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  switch (normalizedValue) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      throw new TypeError(`Invalid boolean value: ${value}`);
  }
}

/**
 * 将 Workers 环境变量解析为数字。
 *
 * @param {unknown} value 需要解析的原始值。
 * @returns {number|undefined} 成功时返回数字，缺失或空值时返回 undefined。
 * @throws {TypeError} 当值不是有效数字时抛出异常。
 */
export function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedNumber = Number(value);
  if (!Number.isFinite(parsedNumber)) {
    throw new TypeError(`Invalid numeric value: ${value}`);
  }

  return parsedNumber;
}

/**
 * 将白名单环境变量解析为用户名数组。
 *
 * 支持 JSON 数组字符串和逗号分隔字符串两种格式。
 *
 * @param {unknown} value 需要解析的原始值。
 * @returns {string[]} 解析后的用户名白名单。
 * @throws {TypeError} 当配置格式不合法时抛出异常。
 */
export function parseWhitelist(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return [];
  }

  if (rawValue.startsWith("[")) {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      throw new TypeError("WHITELIST_MINLEVEL_USERNAME must be a JSON array");
    }

    return parsedValue.map((item) => String(item).trim()).filter(Boolean);
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 解析请求和 Workers 环境变量中的运行配置。
 *
 * 环境变量优先级高于查询参数，便于在 Cloudflare Workers 中强制固定策略。
 *
 * @param {Request} request 当前请求对象。
 * @param {Record<string, unknown>} env Workers 绑定环境变量对象。
 * @returns {{
 *   targetUrl: string,
 *   forceStrtolower: boolean,
 *   minLevel: number|undefined,
 *   whitelist: string[]
 * }} 返回当前请求最终生效的配置。
 * @throws {TypeError} 当环境变量格式非法时抛出异常。
 */
export function resolveRuntimeConfig(request, env) {
  const requestUrl = new URL(request.url);
  const queryForceStrtolower = requestUrl.searchParams.has("force_strtolower")
    ? true
    : undefined;
  const queryMinLevel = requestUrl.searchParams.get("force_minlevel");

  const envForceStrtolower = parseBoolean(env.FORCE_STRTOLOWER);
  const envMinLevel = parseNumber(env.FORCE_MINLEVEL);
  const whitelist = parseWhitelist(env.WHITELIST_MINLEVEL_USERNAME);

  return {
    targetUrl: String(env.TARGET_URL || DEFAULT_TARGET_URL),
    forceStrtolower: envForceStrtolower ?? queryForceStrtolower ?? false,
    minLevel: envMinLevel ?? parseNumber(queryMinLevel),
    whitelist
  };
}
