import { resolveRuntimeConfig } from "./config.js";
import { jsonResponse } from "./http.js";
import { fetchUserInfo } from "./linuxdo-client.js";
import { transformUserInfo } from "./userinfo-transformer.js";

/**
 * 处理 Worker 的 HTTP 请求入口。
 *
 * @param {Request} request Cloudflare Workers 传入的请求对象。
 * @param {Record<string, unknown>} env Workers 环境变量和绑定对象。
 * @returns {Promise<Response>} 最终返回给调用方的 HTTP 响应。
 */
async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204
    });
  }

  if (new URL(request.url).pathname === "/health") {
    return jsonResponse({ ok: true });
  }

  const authorizationHeader = request.headers.get("authorization");
  if (!authorizationHeader) {
    return jsonResponse({ error: "Where is your AUTHORIZATION" }, 400);
  }

  let runtimeConfig;
  try {
    runtimeConfig = resolveRuntimeConfig(request, env);
  } catch (error) {
    console.error(JSON.stringify({
      message: "Invalid worker configuration",
      error: error instanceof Error ? error.message : String(error)
    }));

    return jsonResponse(
      { error: "Invalid worker configuration" },
      500
    );
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetchUserInfo(
      runtimeConfig.targetUrl,
      authorizationHeader
    );
  } catch (error) {
    console.error(JSON.stringify({
      message: "Failed to fetch upstream userinfo",
      targetUrl: runtimeConfig.targetUrl,
      error: error instanceof Error ? error.message : String(error)
    }));

    return jsonResponse(
      { error: "Failed to connect to target API" },
      502
    );
  }

  if (!upstreamResponse.ok) {
    const errorBody = await upstreamResponse.text();
    return new Response(errorBody || JSON.stringify({ error: "Failed to connect to target API" }), {
      status: upstreamResponse.status,
      headers: {
        "content-type": upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8"
      }
    });
  }

  let upstreamPayload;
  try {
    upstreamPayload = await upstreamResponse.json();
  } catch (error) {
    console.error(JSON.stringify({
      message: "Invalid JSON response from upstream",
      targetUrl: runtimeConfig.targetUrl,
      error: error instanceof Error ? error.message : String(error)
    }));

    return jsonResponse(
      { error: "Invalid JSON response from target API" },
      500
    );
  }

  if (!upstreamPayload || Array.isArray(upstreamPayload) || typeof upstreamPayload !== "object") {
    console.error(JSON.stringify({
      message: "Unexpected upstream payload shape",
      payload: upstreamPayload
    }));

    return jsonResponse(
      { error: "Invalid JSON response from target API" },
      500
    );
  }

  return transformUserInfo(upstreamPayload, runtimeConfig);
}

export default {
  /**
   * Cloudflare Workers 标准 fetch 处理器。
   *
   * @param {Request} request Cloudflare Workers 请求对象。
   * @param {Record<string, unknown>} env Workers 环境变量和绑定对象。
   * @returns {Promise<Response>} 返回给客户端的最终响应。
   */
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};
